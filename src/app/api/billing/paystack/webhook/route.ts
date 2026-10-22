import { NextResponse } from "next/server";
import {
  activateTrailPlus,
  claimWebhookEvent,
  deactivateTrailPlus,
  fulfillPaystackCharge,
  getPaymentByReference,
} from "@/lib/ai/subscription";
import {
  isPaystackConfigured,
  maybeCreateCardSubscription,
  trailPlusPlanCode,
  verifyPaystackSignature,
} from "@/lib/paystack";

function metaUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (typeof m.user_id === "string" && m.user_id) return m.user_id;
  return null;
}

function eventIdOf(event: {
  id?: unknown;
  data?: Record<string, unknown>;
  event?: string;
}) {
  if (typeof event.id === "string" || typeof event.id === "number") {
    return String(event.id);
  }
  const data = event.data ?? {};
  const ref = typeof data.reference === "string" ? data.reference : "noref";
  const paidAt =
    typeof data.paid_at === "string"
      ? data.paid_at
      : typeof data.paidAt === "string"
        ? data.paidAt
        : "";
  return `${event.event ?? "event"}:${ref}:${paidAt}`;
}

export async function POST(req: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    id?: string | number;
    event?: string;
    data?: Record<string, unknown>;
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data ?? {};
  const eventName = event.event ?? "";
  const reference =
    typeof data.reference === "string" ? data.reference : null;
  const eventId = eventIdOf(event);

  const claimed = await claimWebhookEvent({
    eventId,
    eventName,
    reference,
  });
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (eventName === "charge.success") {
      const pending = reference
        ? await getPaymentByReference(reference)
        : null;
      const userId =
        pending?.user_id ||
        metaUserId(data.metadata) ||
        (typeof data.metadata === "object" &&
        data.metadata &&
        "user_id" in (data.metadata as object)
          ? String((data.metadata as { user_id: string }).user_id)
          : null);

      if (userId && reference) {
        const customer = data.customer as
          | { email?: string; customer_code?: string }
          | undefined;
        const authorization = data.authorization as
          | {
              authorization_code?: string;
              reusable?: boolean;
            }
          | undefined;

        let subscriptionCode =
          typeof data.subscription_code === "string"
            ? data.subscription_code
            : null;
        const planCode = trailPlusPlanCode();
        const authCode = authorization?.authorization_code;
        const reusable = Boolean(authorization?.reusable);
        const customerCode = customer?.customer_code;
        if (!subscriptionCode && planCode && reusable && authCode && customerCode) {
          subscriptionCode = await maybeCreateCardSubscription({
            customerCode,
            authorizationCode: authCode,
            planCode,
          });
        }

        await fulfillPaystackCharge({
          userId,
          email: customer?.email ?? null,
          reference,
          customerCode: customerCode ?? null,
          amount: typeof data.amount === "number" ? data.amount : null,
          currency:
            typeof data.currency === "string" ? data.currency : null,
          paidAt:
            typeof data.paid_at === "string"
              ? data.paid_at
              : new Date().toISOString(),
          subscriptionCode,
          providerEventId: eventId,
        });
      }
    }

    if (
      eventName === "subscription.create" ||
      eventName === "subscription.enable" ||
      eventName === "invoice.payment_success"
    ) {
      const customer = data.customer as
        | { email?: string; customer_code?: string }
        | undefined;
      const meta = data.metadata ?? (data as { meta?: unknown }).meta;
      let userId = metaUserId(meta);

      if (!userId && typeof (data as { user_id?: string }).user_id === "string") {
        userId = (data as { user_id: string }).user_id;
      }
      if (!userId && reference) {
        userId = (await getPaymentByReference(reference))?.user_id ?? null;
      }

      const nextPayment =
        typeof data.next_payment_date === "string"
          ? data.next_payment_date
          : null;

      if (userId && reference) {
        await fulfillPaystackCharge({
          userId,
          email: customer?.email ?? null,
          reference,
          customerCode: customer?.customer_code ?? null,
          subscriptionCode:
            typeof data.subscription_code === "string"
              ? data.subscription_code
              : null,
          periodEnd: nextPayment,
          providerEventId: eventId,
        });
      } else if (userId) {
        // Subscription events without a new charge reference still extend access.
        await activateTrailPlus({
          userId,
          email: customer?.email ?? null,
          customerCode: customer?.customer_code ?? null,
          subscriptionCode:
            typeof data.subscription_code === "string"
              ? data.subscription_code
              : null,
          periodEnd: nextPayment,
        });
      }
    }

    if (
      eventName === "subscription.disable" ||
      eventName === "subscription.not_renew"
    ) {
      const meta = data.metadata;
      let userId = metaUserId(meta);
      if (!userId && reference) {
        userId = (await getPaymentByReference(reference))?.user_id ?? null;
      }
      if (userId) await deactivateTrailPlus(userId);
    }
  } catch (err) {
    console.error(
      "[paystack] webhook",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
