import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  fulfillPaystackCharge,
  getPaymentByReference,
  userHasActiveTrailPlus,
} from "@/lib/ai/subscription";
import {
  isPaystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/paystack";

function metaUserId(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null;
  const direct = metadata.user_id;
  if (typeof direct === "string" && direct) return direct;
  return null;
}

/** Client-safe retry: verify Paystack + credit once (idempotent). */
export async function POST(req: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    reference?: string;
  };
  const reference = body.reference?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const { userId: sessionUserId } = await auth();
  const pending = await getPaymentByReference(reference);

  try {
    const tx = await verifyPaystackTransaction(reference);
    if (tx.status !== "success") {
      return NextResponse.json({
        ok: false,
        status: tx.status,
        active: sessionUserId
          ? await userHasActiveTrailPlus(sessionUserId)
          : false,
      });
    }

    const userId =
      pending?.user_id ||
      metaUserId(tx.metadata ?? undefined) ||
      sessionUserId ||
      null;

    if (!userId) {
      return NextResponse.json(
        { error: "Could not link payment to an account" },
        { status: 409 },
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

    return NextResponse.json({
      ok: true,
      active: true,
      userId,
      reference: tx.reference,
    });
  } catch (err) {
    console.error(
      "[paystack] reconcile",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Could not confirm payment yet" },
      { status: 502 },
    );
  }
}
