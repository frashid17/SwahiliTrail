import { createAdminClient } from "@/lib/supabase/admin";
import {
  trailPlusAmountSubunits,
  trailPlusCurrency,
  TRAIL_PLUS_PRICE_USD,
} from "@/lib/paystack";

export type SubscriptionRow = {
  user_id: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
  plan: string;
  provider: string;
  paystack_reference: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  email: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type PaymentRow = {
  id: string;
  user_id: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending" | "refunded";
  paid_at: string | null;
  description: string | null;
  receipt_number: string | null;
  created_at: string;
};

const memorySubs = new Map<string, SubscriptionRow>();
const memoryPayments = new Map<string, PaymentRow[]>();

function periodEndActive(iso: string | null | undefined) {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

function newId() {
  return crypto.randomUUID();
}

export async function getSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const supabase = createAdminClient();
  if (!supabase) return memorySubs.get(userId) ?? null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[subscription] get", error.message);
    return memorySubs.get(userId) ?? null;
  }

  if (!data) return memorySubs.get(userId) ?? null;
  return {
    user_id: data.user_id as string,
    status: data.status as SubscriptionRow["status"],
    plan: (data.plan as string) || "trail_plus",
    provider: (data.provider as string) || "paystack",
    paystack_reference: (data.paystack_reference as string) ?? null,
    paystack_customer_code: (data.paystack_customer_code as string) ?? null,
    paystack_subscription_code:
      (data.paystack_subscription_code as string) ?? null,
    email: (data.email as string) ?? null,
    current_period_end: (data.current_period_end as string) ?? null,
    cancel_at_period_end: Boolean(data.cancel_at_period_end),
  };
}

export async function userHasActiveTrailPlus(userId: string): Promise<boolean> {
  const row = await getSubscription(userId);
  if (!row) return false;
  if (!periodEndActive(row.current_period_end)) return false;
  return row.status === "active" || row.status === "past_due";
}

export async function activateTrailPlus(input: {
  userId: string;
  email?: string | null;
  reference?: string | null;
  customerCode?: string | null;
  subscriptionCode?: string | null;
  /** ISO end date; defaults to +30 days */
  periodEnd?: string | null;
  amount?: number | null;
  currency?: string | null;
  paidAt?: string | null;
}) {
  const periodEnd =
    input.periodEnd ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const row: SubscriptionRow = {
    user_id: input.userId,
    status: "active",
    plan: "trail_plus",
    provider: "paystack",
    paystack_reference: input.reference ?? null,
    paystack_customer_code: input.customerCode ?? null,
    paystack_subscription_code: input.subscriptionCode ?? null,
    email: input.email ?? null,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
  };

  memorySubs.set(input.userId, row);

  const supabase = createAdminClient();
  if (supabase) {
    const { error } = await supabase.from("subscriptions").upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("[subscription] activate", error.message);
  }

  if (input.reference) {
    await recordPayment({
      userId: input.userId,
      reference: input.reference,
      amount: input.amount ?? trailPlusAmountSubunits(),
      currency: input.currency ?? trailPlusCurrency(),
      status: "success",
      paidAt: input.paidAt ?? new Date().toISOString(),
      description: `Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo)`,
    });
  }

  return row;
}

export async function cancelTrailPlus(userId: string) {
  const existing = (await getSubscription(userId)) ?? {
    user_id: userId,
    status: "cancelled" as const,
    plan: "trail_plus",
    provider: "paystack",
    paystack_reference: null,
    paystack_customer_code: null,
    paystack_subscription_code: null,
    email: null,
    current_period_end: null,
    cancel_at_period_end: true,
  };

  const row: SubscriptionRow = {
    ...existing,
    cancel_at_period_end: true,
    // Keep access until period end when still active
    status:
      existing.status === "active" || periodEndActive(existing.current_period_end)
        ? "active"
        : "cancelled",
  };

  memorySubs.set(userId, row);

  const supabase = createAdminClient();
  if (!supabase) return row;

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) console.error("[subscription] cancel", error.message);
  return row;
}

export async function deactivateTrailPlus(userId: string) {
  const existing = memorySubs.get(userId);
  if (existing) {
    memorySubs.set(userId, {
      ...existing,
      status: "cancelled",
      cancel_at_period_end: true,
    });
  }

  const supabase = createAdminClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) console.error("[subscription] deactivate", error.message);
}

export async function recordPayment(input: {
  userId: string;
  reference: string;
  amount: number;
  currency: string;
  status?: PaymentRow["status"];
  paidAt?: string | null;
  description?: string | null;
}) {
  const payment: PaymentRow = {
    id: newId(),
    user_id: input.userId,
    provider: "paystack",
    reference: input.reference,
    amount: input.amount,
    currency: input.currency,
    status: input.status ?? "success",
    paid_at: input.paidAt ?? new Date().toISOString(),
    description: input.description ?? `Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo)`,
    receipt_number: `ST-${input.reference.slice(-10).toUpperCase()}`,
    created_at: new Date().toISOString(),
  };

  const list = memoryPayments.get(input.userId) ?? [];
  if (!list.some((p) => p.reference === payment.reference)) {
    memoryPayments.set(input.userId, [payment, ...list]);
  }

  const supabase = createAdminClient();
  if (!supabase) return payment;

  const { data, error } = await supabase
    .from("payments")
    .upsert(
      {
        user_id: payment.user_id,
        provider: payment.provider,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paid_at: payment.paid_at,
        description: payment.description,
        receipt_number: payment.receipt_number,
      },
      { onConflict: "provider,reference" },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[payment] record", error.message);
    return payment;
  }

  if (data) {
    return {
      id: data.id as string,
      user_id: data.user_id as string,
      provider: data.provider as string,
      reference: data.reference as string,
      amount: data.amount as number,
      currency: data.currency as string,
      status: data.status as PaymentRow["status"],
      paid_at: (data.paid_at as string) ?? null,
      description: (data.description as string) ?? null,
      receipt_number: (data.receipt_number as string) ?? null,
      created_at: data.created_at as string,
    };
  }

  return payment;
}

export async function listPayments(userId: string): Promise<PaymentRow[]> {
  const supabase = createAdminClient();
  if (!supabase) return memoryPayments.get(userId) ?? [];

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("paid_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[payment] list", error.message);
    return memoryPayments.get(userId) ?? [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    provider: row.provider as string,
    reference: row.reference as string,
    amount: row.amount as number,
    currency: row.currency as string,
    status: row.status as PaymentRow["status"],
    paid_at: (row.paid_at as string) ?? null,
    description: (row.description as string) ?? null,
    receipt_number: (row.receipt_number as string) ?? null,
    created_at: row.created_at as string,
  }));
}

export async function getPaymentForUser(userId: string, paymentId: string) {
  const supabase = createAdminClient();
  if (!supabase) {
    return (
      (memoryPayments.get(userId) ?? []).find((p) => p.id === paymentId) ?? null
    );
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    user_id: data.user_id as string,
    provider: data.provider as string,
    reference: data.reference as string,
    amount: data.amount as number,
    currency: data.currency as string,
    status: data.status as PaymentRow["status"],
    paid_at: (data.paid_at as string) ?? null,
    description: (data.description as string) ?? null,
    receipt_number: (data.receipt_number as string) ?? null,
    created_at: data.created_at as string,
  };
}

export function formatMoney(amountSubunits: number, currency: string) {
  const major = amountSubunits / 100;
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}
