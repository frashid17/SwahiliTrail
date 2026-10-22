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
  provider_event_id?: string | null;
};

const memorySubs = new Map<string, SubscriptionRow>();
const memoryPayments = new Map<string, PaymentRow[]>();
const memoryWebhookEvents = new Set<string>();

/** Stable checkout refs so retries reuse the same Paystack charge key. */
export function makeCheckoutReference(userId: string) {
  const short = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-10) || "user";
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `st_${short}_${rand}`;
}

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

function addDaysIso(fromMs: number, days: number) {
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Extend access from the later of now or the current period end (+30 days). */
export async function nextPeriodEndForUser(
  userId: string,
  explicit?: string | null,
) {
  if (explicit) return explicit;
  const existing = await getSubscription(userId);
  const base = Math.max(
    Date.now(),
    existing?.current_period_end
      ? new Date(existing.current_period_end).getTime()
      : 0,
  );
  return addDaysIso(base, 30);
}

export async function activateTrailPlus(input: {
  userId: string;
  email?: string | null;
  reference?: string | null;
  customerCode?: string | null;
  subscriptionCode?: string | null;
  /** ISO end date; defaults to +30 days from now or current period end */
  periodEnd?: string | null;
  amount?: number | null;
  currency?: string | null;
  paidAt?: string | null;
}) {
  const existing = await getSubscription(input.userId);
  const periodEnd =
    input.periodEnd || (await nextPeriodEndForUser(input.userId));

  const row: SubscriptionRow = {
    user_id: input.userId,
    status: "active",
    plan: "trail_plus",
    provider: "paystack",
    paystack_reference: input.reference ?? existing?.paystack_reference ?? null,
    paystack_customer_code:
      input.customerCode ?? existing?.paystack_customer_code ?? null,
    paystack_subscription_code:
      input.subscriptionCode ?? existing?.paystack_subscription_code ?? null,
    email: input.email ?? existing?.email ?? null,
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

function mapPaymentRow(data: Record<string, unknown>): PaymentRow {
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
    provider_event_id: (data.provider_event_id as string) ?? null,
  };
}

export async function recordPayment(input: {
  userId: string;
  reference: string;
  amount: number;
  currency: string;
  status?: PaymentRow["status"];
  paidAt?: string | null;
  description?: string | null;
  providerEventId?: string | null;
  /** Allow correcting a false-positive success (Paystack never cleared). */
  allowDowngrade?: boolean;
}) {
  const status = input.status ?? "success";
  const payment: PaymentRow = {
    id: newId(),
    user_id: input.userId,
    provider: "paystack",
    reference: input.reference,
    amount: input.amount,
    currency: input.currency,
    status,
    paid_at:
      status === "pending" || status === "failed"
        ? null
        : (input.paidAt ?? new Date().toISOString()),
    description: input.description ?? `Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo)`,
    receipt_number: `ST-${input.reference.slice(-10).toUpperCase()}`,
    created_at: new Date().toISOString(),
    provider_event_id: input.providerEventId ?? null,
  };

  const list = memoryPayments.get(input.userId) ?? [];
  const existingIdx = list.findIndex((p) => p.reference === payment.reference);
  if (existingIdx >= 0) {
    const prev = list[existingIdx]!;
    // Never downgrade a successful payment unless we are correcting a false clear.
    if (
      prev.status === "success" &&
      payment.status !== "success" &&
      !input.allowDowngrade
    ) {
      return prev;
    }
    list[existingIdx] = {
      ...prev,
      ...payment,
      id: prev.id,
      created_at: prev.created_at,
      receipt_number: prev.receipt_number ?? payment.receipt_number,
    };
    memoryPayments.set(input.userId, list);
  } else {
    memoryPayments.set(input.userId, [payment, ...list]);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return (
      memoryPayments
        .get(input.userId)
        ?.find((p) => p.reference === payment.reference) ?? payment
    );
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("provider", "paystack")
    .eq("reference", payment.reference)
    .maybeSingle();

  if (
    existing?.status === "success" &&
    payment.status !== "success" &&
    !input.allowDowngrade
  ) {
    return mapPaymentRow(existing as Record<string, unknown>);
  }

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
        provider_event_id: payment.provider_event_id,
      },
      { onConflict: "provider,reference" },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[payment] record", error.message);
    return payment;
  }

  if (data) return mapPaymentRow(data as Record<string, unknown>);
  return payment;
}

/** Create or reuse a pending checkout reference for this user (idempotent retry). */
export async function ensurePendingCheckout(input: {
  userId: string;
  amount: number;
  currency: string;
}): Promise<PaymentRow> {
  const supabase = createAdminClient();
  const freshWindowMs = 60 * 60 * 1000; // reuse pending for 1 hour

  if (supabase) {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", input.userId)
      .eq("provider", "paystack")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const created = new Date(data.created_at as string).getTime();
      if (Date.now() - created < freshWindowMs) {
        return mapPaymentRow(data as Record<string, unknown>);
      }
    }
  } else {
    const mem = (memoryPayments.get(input.userId) ?? []).find(
      (p) =>
        p.status === "pending" &&
        Date.now() - new Date(p.created_at).getTime() < freshWindowMs,
    );
    if (mem) return mem;
  }

  return recordPayment({
    userId: input.userId,
    reference: makeCheckoutReference(input.userId),
    amount: input.amount,
    currency: input.currency,
    status: "pending",
    paidAt: null,
    description: `Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo)`,
  });
}

export async function getPaymentByReference(
  reference: string,
): Promise<PaymentRow | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    for (const list of memoryPayments.values()) {
      const hit = list.find((p) => p.reference === reference);
      if (hit) return hit;
    }
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("provider", "paystack")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;
  return mapPaymentRow(data as Record<string, unknown>);
}

/**
 * Credit Trail Plus from a verified Paystack charge.
 * Safe to call from callback + webhook concurrently (unique reference).
 */
export async function fulfillPaystackCharge(input: {
  userId: string;
  email?: string | null;
  reference: string;
  customerCode?: string | null;
  subscriptionCode?: string | null;
  amount?: number | null;
  currency?: string | null;
  paidAt?: string | null;
  periodEnd?: string | null;
  providerEventId?: string | null;
}) {
  const existing = await getPaymentByReference(input.reference);
  const userId = existing?.user_id || input.userId;

  await recordPayment({
    userId,
    reference: input.reference,
    amount: input.amount ?? existing?.amount ?? trailPlusAmountSubunits(),
    currency: input.currency ?? existing?.currency ?? trailPlusCurrency(),
    status: "success",
    paidAt: input.paidAt ?? new Date().toISOString(),
    providerEventId: input.providerEventId ?? null,
  });

  return activateTrailPlus({
    userId,
    email: input.email ?? null,
    reference: input.reference,
    customerCode: input.customerCode ?? null,
    subscriptionCode: input.subscriptionCode ?? null,
    periodEnd: input.periodEnd,
    amount: input.amount ?? existing?.amount ?? trailPlusAmountSubunits(),
    currency: input.currency ?? existing?.currency ?? trailPlusCurrency(),
    paidAt: input.paidAt ?? new Date().toISOString(),
  });
}

/**
 * Align local payment row with Paystack (and unwind a false Plus grant).
 * Use when callback/reconcile sees non-success after we may have marked success.
 */
export async function alignPaymentWithProvider(input: {
  reference: string;
  providerStatus: string;
  amount?: number | null;
  currency?: string | null;
}): Promise<PaymentRow | null> {
  const existing = await getPaymentByReference(input.reference);
  if (!existing) return null;

  const mapped =
    input.providerStatus === "success"
      ? ("success" as const)
      : input.providerStatus === "failed" ||
          input.providerStatus === "abandoned" ||
          input.providerStatus === "reversed" ||
          input.providerStatus === "cancelled" ||
          input.providerStatus === "canceled"
        ? ("failed" as const)
        : ("pending" as const);

  if (existing.status === mapped) return existing;

  const updated = await recordPayment({
    userId: existing.user_id,
    reference: existing.reference,
    amount: input.amount ?? existing.amount,
    currency: input.currency ?? existing.currency,
    status: mapped,
    paidAt: mapped === "success" ? existing.paid_at ?? new Date().toISOString() : null,
    description: existing.description,
    allowDowngrade: true,
  });

  // If we wrongly activated Trail Plus off this reference, pull access back.
  if (mapped !== "success") {
    const sub = await getSubscription(existing.user_id);
    if (sub?.paystack_reference === existing.reference) {
      await deactivateTrailPlus(existing.user_id);
    }
  }

  return updated;
}

/** Returns false if this webhook event was already processed. */
export async function claimWebhookEvent(input: {
  eventId: string;
  eventName?: string | null;
  reference?: string | null;
}): Promise<boolean> {
  const key = `paystack:${input.eventId}`;
  if (memoryWebhookEvents.has(key)) return false;
  memoryWebhookEvents.add(key);

  const supabase = createAdminClient();
  if (!supabase) return true;

  const { error } = await supabase.from("billing_webhook_events").insert({
    provider: "paystack",
    event_id: input.eventId,
    event_name: input.eventName ?? null,
    reference: input.reference ?? null,
  });

  if (error) {
    // Unique violation = already processed
    if (error.code === "23505") return false;
    console.error("[billing] webhook claim", error.message);
    // Fail open for claim table issues so payment can still credit via upsert.
    return true;
  }
  return true;
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
