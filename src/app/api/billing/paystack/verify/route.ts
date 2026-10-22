import { NextResponse } from "next/server";
import {
  alignPaymentWithProvider,
  fulfillPaystackCharge,
  getPaymentByReference,
} from "@/lib/ai/subscription";
import {
  appBaseUrl,
  isPaystackChargeSuccess,
  isPaystackConfigured,
  mapPaystackToPaymentStatus,
  maybeCreateCardSubscription,
  trailPlusPlanCode,
  verifyPaystackTransaction,
} from "@/lib/paystack";

function metaUserId(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null;
  const direct = metadata.user_id;
  if (typeof direct === "string" && direct) return direct;
  const custom = metadata.custom_fields;
  if (Array.isArray(custom)) {
    for (const field of custom) {
      if (
        field &&
        typeof field === "object" &&
        "variable_name" in field &&
        (field as { variable_name?: string }).variable_name === "user_id" &&
        "value" in field
      ) {
        const v = (field as { value?: unknown }).value;
        if (typeof v === "string" && v) return v;
      }
    }
  }
  return null;
}

export async function GET(req: Request) {
  const base = appBaseUrl(req);
  const url = new URL(req.url);
  const reference =
    url.searchParams.get("reference") || url.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${base}/pricing?billing=missing_ref`);
  }

  if (!isPaystackConfigured()) {
    return NextResponse.redirect(`${base}/pricing?billing=not_configured`);
  }

  try {
    const tx = await verifyPaystackTransaction(reference);

    // Strict: only Paystack "success" clears money. Keep row pending otherwise.
    if (!isPaystackChargeSuccess(tx)) {
      await alignPaymentWithProvider({
        reference,
        providerStatus: mapPaystackToPaymentStatus(tx),
        amount: tx.amount,
        currency: tx.currency,
      });
      const mapped = mapPaystackToPaymentStatus(tx);
      if (mapped === "pending") {
        return NextResponse.redirect(
          `${base}/pricing?billing=pending_confirm&ref=${encodeURIComponent(reference)}`,
        );
      }
      return NextResponse.redirect(
        `${base}/pricing?billing=failed&ref=${encodeURIComponent(reference)}`,
      );
    }

    const pending = await getPaymentByReference(reference);
    const userId =
      pending?.user_id || metaUserId(tx.metadata ?? undefined) || null;

    if (!userId) {
      return NextResponse.redirect(
        `${base}/pricing?billing=missing_user&ref=${encodeURIComponent(reference)}`,
      );
    }

    // Card only: optional auto-renew. M-Pesa stays period access (pay again next month).
    let subscriptionCode: string | null = null;
    const planCode = trailPlusPlanCode();
    const authCode = tx.authorization?.authorization_code;
    const reusable = Boolean(tx.authorization?.reusable);
    const customerCode = tx.customer?.customer_code;
    if (planCode && reusable && authCode && customerCode) {
      subscriptionCode = await maybeCreateCardSubscription({
        customerCode,
        authorizationCode: authCode,
        planCode,
      });
    }

    await fulfillPaystackCharge({
      userId,
      email: tx.customer?.email ?? null,
      reference: tx.reference,
      customerCode: customerCode ?? null,
      subscriptionCode,
      amount: tx.amount,
      currency: tx.currency,
      paidAt: tx.paid_at,
    });

    return NextResponse.redirect(
      `${base}/pricing?billing=success&ref=${encodeURIComponent(reference)}`,
    );
  } catch (err) {
    console.error(
      "[paystack] verify",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.redirect(
      `${base}/pricing?billing=pending_confirm&ref=${encodeURIComponent(reference)}`,
    );
  }
}
