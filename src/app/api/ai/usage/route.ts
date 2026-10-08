import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  getAiQuotaStatus,
} from "@/lib/ai/quota";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await getAiQuotaStatus(userId);
  return NextResponse.json({
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  });
}
