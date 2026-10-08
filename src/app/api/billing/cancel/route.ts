import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  cancelTrailPlus,
  getSubscription,
  userHasActiveTrailPlus,
} from "@/lib/ai/subscription";
import {
  disablePaystackSubscription,
  fetchPaystackSubscription,
  isPaystackConfigured,
} from "@/lib/paystack";

export async function POST() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await userHasActiveTrailPlus(userId);
  if (!active) {
    return NextResponse.json(
      { error: "No active Trail Plus plan to cancel." },
      { status: 400 },
    );
  }

  const sub = await getSubscription(userId);

  if (
    isPaystackConfigured() &&
    sub?.paystack_subscription_code
  ) {
    try {
      const remote = await fetchPaystackSubscription(
        sub.paystack_subscription_code,
      );
      const token = remote.email_token;
      if (token) {
        await disablePaystackSubscription(
          sub.paystack_subscription_code,
          token,
        );
      }
    } catch (err) {
      console.error(
        "[billing] cancel remote",
        err instanceof Error ? err.message : err,
      );
      // Still cancel locally so the user is not stuck.
    }
  }

  const updated = await cancelTrailPlus(userId);

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: updated.current_period_end,
    message: updated.current_period_end
      ? `Cancelled. Trail Plus stays active until ${new Date(
          updated.current_period_end,
        ).toLocaleDateString("en-KE", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}.`
      : "Cancelled. Trail Plus will not renew.",
  });
}
