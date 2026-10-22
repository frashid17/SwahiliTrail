import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/access";
import {
  alignPaymentWithProvider,
  fulfillPaystackCharge,
  getPaymentByReference,
} from "@/lib/ai/subscription";
import {
  isPaystackChargeSuccess,
  isPaystackConfigured,
  mapPaystackToPaymentStatus,
  verifyPaystackTransaction,
} from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  action: z.enum(["reconcile", "mark_failed", "mark_refunded", "mark_pending"]),
  reference: z.string().min(3).max(120),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const reference = body.reference.trim();
    const payment = await getPaymentByReference(reference);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (body.action === "reconcile") {
      if (!isPaystackConfigured()) {
        return NextResponse.json(
          { error: "Paystack is not configured" },
          { status: 503 },
        );
      }
      const tx = await verifyPaystackTransaction(reference);
      if (!isPaystackChargeSuccess(tx)) {
        const mapped = mapPaystackToPaymentStatus(tx);
        await alignPaymentWithProvider({
          reference,
          providerStatus: mapped,
          amount: tx.amount,
          currency: tx.currency,
        });
        return NextResponse.json({
          ok: false,
          status: mapped,
          message: `Paystack status: ${tx.status}`,
        });
      }
      await fulfillPaystackCharge({
        userId: payment.user_id,
        reference,
        amount: tx.amount,
        currency: tx.currency,
        customerCode: tx.customer?.customer_code,
        paidAt: tx.paid_at
          ? new Date(tx.paid_at).toISOString()
          : new Date().toISOString(),
      });
      return NextResponse.json({
        ok: true,
        status: "success",
        message: "Payment reconciled and Trail Plus credited",
      });
    }

    const statusMap = {
      mark_failed: "failed",
      mark_refunded: "refunded",
      mark_pending: "pending",
    } as const;
    const nextStatus = statusMap[body.action];

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    }

    const { error } = await supabase
      .from("payments")
      .update({
        status: nextStatus,
        paid_at: nextStatus === "pending" || nextStatus === "failed" ? null : payment.paid_at,
      })
      .eq("reference", reference);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      message: `Payment marked ${nextStatus}`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Payment action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
