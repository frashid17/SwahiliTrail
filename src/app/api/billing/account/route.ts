import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
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
  trailPlusAmountSubunits,
  trailPlusCurrency,
} from "@/lib/paystack";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, payments, unlimited, quota] = await Promise.all([
    getSubscription(userId),
    listPayments(userId),
    userHasActiveTrailPlus(userId),
    getAiQuotaStatus(userId),
  ]);

  const currency = trailPlusCurrency();
  const amount = trailPlusAmountSubunits();
  const periodEnd = subscription?.current_period_end ?? null;
  const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);

  const upcomingInvoice =
    unlimited && periodEnd && !cancelAtPeriodEnd
      ? {
          id: "upcoming-trail-plus",
          description: `Trail Plus — next billing`,
          amount,
          currency,
          amountFormatted: formatMoney(amount, currency),
          dueDate: periodEnd,
          status: "upcoming" as const,
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
    cancelAtPeriodEnd,
    currentPeriodEnd: periodEnd,
    subscriptionStatus: subscription?.status ?? "inactive",
    quota,
    upcomingInvoice,
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
