import { NextResponse } from "next/server";
import {
  fulfillPaystackCharge,
  getPaymentByReference,
} from "@/lib/ai/subscription";
import {
  appBaseUrl,
  isPaystackConfigured,
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
    if (tx.status !== "success") {
      // Do not mark our pending row failed here - provider may still settle /
      // customer may retry with the same reference.
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

    await fulfillPaystackCharge({
      userId,
      email: tx.customer?.email ?? null,
      reference: tx.reference,
      customerCode: tx.customer?.customer_code ?? null,
      amount: tx.amount,
      currency: tx.currency,
      paidAt: tx.paid_at,
    });

    // Always land on pricing (works even if the Paystack hop dropped the session).
    return NextResponse.redirect(
      `${base}/pricing?billing=success&ref=${encodeURIComponent(reference)}`,
    );
  } catch (err) {
    console.error(
      "[paystack] verify",
      err instanceof Error ? err.message : err,
    );
    // Payment may still succeed via webhook - ask user to sign in / refresh.
    return NextResponse.redirect(
      `${base}/pricing?billing=pending_confirm&ref=${encodeURIComponent(reference)}`,
    );
  }
}
