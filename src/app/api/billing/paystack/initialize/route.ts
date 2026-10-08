import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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
    const base = appBaseUrl(req);
    const data = await initializePaystackTransaction({
      email,
      amount: trailPlusAmountSubunits(),
      currency: trailPlusCurrency(),
      callbackUrl: `${base}/api/billing/paystack/verify`,
      planCode: process.env.PAYSTACK_PLAN_CODE || undefined,
      metadata: {
        user_id: userId,
        plan: "trail_plus",
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
