import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  alignPaymentWithProvider,
  formatMoney,
  getSubscription,
  listPayments,
  userHasActiveTrailPlus,
} from "@/lib/ai/subscription";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  getAiQuotaStatus,
} from "@/lib/ai/quota";
import {
  isPaystackConfigured,
  mapPaystackToPaymentStatus,
  trailPlusAmountSubunits,
  trailPlusCurrency,
  verifyPaystackTransaction,
} from "@/lib/paystack";

/** Re-check pending (and recent false-success) rows against Paystack. */
async function syncLocalPayments(
  userId: string,
  payments: Awaited<ReturnType<typeof listPayments>>,
) {
  if (!isPaystackConfigured() || payments.length === 0) return payments;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const candidates = payments
    .filter((p) => {
      if (p.status === "pending") return true;
      if (p.status !== "success") return false;
      return new Date(p.created_at).getTime() >= weekAgo;
    })
    .slice(0, 5);

  if (candidates.length === 0) return payments;

  await Promise.all(
    candidates.map(async (p) => {
      try {
        const tx = await verifyPaystackTransaction(p.reference);
        const mapped = mapPaystackToPaymentStatus(tx);
        if (mapped !== p.status) {
          await alignPaymentWithProvider({
            reference: p.reference,
            providerStatus: mapped,
            amount: tx.amount,
            currency: tx.currency,
          });
        }
      } catch {
        // Keep local row if Paystack is unreachable.
      }
    }),
  );

  return listPayments(userId);
}

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payments = await listPayments(userId);
  payments = await syncLocalPayments(userId, payments);

  const [subscription, unlimited, quota] = await Promise.all([
    getSubscription(userId),
    userHasActiveTrailPlus(userId),
    getAiQuotaStatus(userId),
  ]);

  const currency = trailPlusCurrency();
  const amount = trailPlusAmountSubunits();
  const periodEnd = subscription?.current_period_end ?? null;
  const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);
  // Card auto-renew only when Paystack has a subscription code.
  // M-Pesa / one-time stays period access (pay again to extend).
  const autoRenew = Boolean(subscription?.paystack_subscription_code);

  const upcomingInvoice =
    unlimited && autoRenew && periodEnd && !cancelAtPeriodEnd
      ? {
          id: "upcoming-trail-plus",
          description: `Trail Plus - next billing`,
          amount,
          currency,
          amountFormatted: formatMoney(amount, currency),
          dueDate: periodEnd,
          status: "upcoming" as const,
        }
      : null;

  const periodAccessNotice =
    unlimited && !autoRenew && periodEnd
      ? {
          message: `Trail Plus is active until ${new Date(periodEnd).toLocaleDateString("en-KE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}. Pay again anytime to extend another 30 days.`,
          endsAt: periodEnd,
        }
      : null;

  const cancelledNotice =
    unlimited && cancelAtPeriodEnd && periodEnd
      ? {
          message: `Trail Plus stays active until ${new Date(periodEnd).toLocaleDateString("en-KE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}. It will not renew.`,
          endsAt: periodEnd,
        }
      : null;

  return NextResponse.json({
    plan: unlimited ? "trail_plus" : "free",
    planLabel: unlimited ? "Trail Plus" : "Free",
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    freeAiQuota: FREE_AI_QUOTA,
    unlimited,
    autoRenew,
    cancelAtPeriodEnd,
    currentPeriodEnd: periodEnd,
    subscriptionStatus: subscription?.status ?? "inactive",
    quota,
    upcomingInvoice,
    periodAccessNotice,
    cancelledNotice,
    payments: payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      currency: p.currency,
      amountFormatted: formatMoney(p.amount, p.currency),
      status: p.status,
      paidAt: p.paid_at,
      description: p.description,
      receiptNumber: p.receipt_number,
      receiptUrl: `/api/billing/receipts/${p.id}`,
    })),
  });
}
