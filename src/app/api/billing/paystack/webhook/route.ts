import { NextResponse } from "next/server";
import {
  activateTrailPlus,
  deactivateTrailPlus,
} from "@/lib/ai/subscription";
import {
  isPaystackConfigured,
  verifyPaystackSignature,
} from "@/lib/paystack";

function metaUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (typeof m.user_id === "string" && m.user_id) return m.user_id;
  return null;
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

  try {
    if (eventName === "charge.success") {
      const userId =
        metaUserId(data.metadata) ||
        (typeof data.metadata === "object" &&
        data.metadata &&
        "user_id" in (data.metadata as object)
          ? String((data.metadata as { user_id: string }).user_id)
          : null);

      if (userId) {
        const customer = data.customer as
          | { email?: string; customer_code?: string }
          | undefined;
        await activateTrailPlus({
          userId,
          email: customer?.email ?? null,
          reference:
            typeof data.reference === "string" ? data.reference : null,
          customerCode: customer?.customer_code ?? null,
          amount: typeof data.amount === "number" ? data.amount : null,
          currency:
            typeof data.currency === "string" ? data.currency : null,
          paidAt:
            typeof data.paid_at === "string"
              ? data.paid_at
              : new Date().toISOString(),
          subscriptionCode:
            typeof data.subscription_code === "string"
              ? data.subscription_code
              : null,
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

      // Subscription payloads sometimes nest metadata on the subscription object
      if (!userId && typeof data.subscription_code === "string") {
        /* keep looking */
      }
      if (!userId && typeof (data as { user_id?: string }).user_id === "string") {
        userId = (data as { user_id: string }).user_id;
      }

      const nextPayment =
        typeof data.next_payment_date === "string"
          ? data.next_payment_date
          : null;

      if (userId) {
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
      const userId = metaUserId(meta);
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
