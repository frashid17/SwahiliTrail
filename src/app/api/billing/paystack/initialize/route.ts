import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/admin/settings";
import { ensurePendingCheckout } from "@/lib/ai/subscription";
import {
  appBaseUrl,
  initializePaystackTransaction,
  isPaystackConfigured,
  trailPlusAmountSubunits,
  trailPlusCurrency,
} from "@/lib/paystack";

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAdminSettings();
  if (!settings.trailPlusSalesEnabled) {
    return NextResponse.json(
      {
        error:
          "Trail Plus upgrades are temporarily paused. Please try again later.",
      },
      { status: 503 },
    );
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        error: "Checkout is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    return NextResponse.json(
      { error: "Add an email to your account before upgrading." },
      { status: 400 },
    );
  }

  try {
    const amount = trailPlusAmountSubunits();
    const currency = trailPlusCurrency();
    // Reuse a pending reference on retry so Paystack won't create a second charge.
    const pending = await ensurePendingCheckout({
      userId,
      amount,
      currency,
    });

    const base = appBaseUrl(req);
    // One-time charge only. M-Pesa cannot reliably auto-renew with a Plan.
    // Card auto-renew is attempted after a successful reusable authorization.
    const data = await initializePaystackTransaction({
      email,
      amount,
      currency,
      reference: pending.reference,
      callbackUrl: `${base}/api/billing/paystack/verify`,
      metadata: {
        user_id: userId,
        plan: "trail_plus",
        billing_mode: "period_access",
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: userId,
          },
        ],
      },
    });

    return NextResponse.json({
      authorizationUrl: data.authorization_url,
      reference: data.reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[paystack] initialize", message);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
