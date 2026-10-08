import {
  AI_CAPS,
  assertAiGuardrails,
  currentAiPeriod,
  getGuardrailQuotaStatus,
  recordAiGuardrailUse,
  type AiQuotaStatus,
  type AiSource,
} from "@/lib/ai/guardrails";
import { TRAIL_PLUS_PRICE_USD } from "@/lib/paystack";

/** Free AI calls per calendar month (guide + planner + stay matcher). */
export const FREE_AI_QUOTA = AI_CAPS.free.perMonth;

/** Trail Plus fair-use monthly ceiling (abuse protection). */
export const TRAIL_PLUS_MONTHLY_CAP = AI_CAPS.trail_plus.perMonth;

/** Trail Plus fair-use daily ceiling. */
export const TRAIL_PLUS_DAILY_CAP = AI_CAPS.trail_plus.perDay;

export { TRAIL_PLUS_PRICE_USD, AI_CAPS, currentAiPeriod };
export type { AiQuotaStatus, AiSource };

export async function getAiQuotaStatus(userId: string): Promise<AiQuotaStatus> {
  return getGuardrailQuotaStatus(userId);
}

/**
 * Enforce monthly/daily/burst fair-use caps + basic abuse checks.
 */
export async function assertAiQuota(
  userId: string,
  source: AiSource,
  rawInput?: string,
): Promise<
  | {
      ok: true;
      status: AiQuotaStatus;
      requestHash: string | null;
      plan: "free" | "trail_plus";
    }
  | {
      ok: false;
      status: AiQuotaStatus;
      httpStatus: number;
      responseBody: {
        error: string;
        code: "AI_QUOTA_EXCEEDED" | "AI_RATE_LIMITED" | "AI_ABUSE_BLOCKED";
        used?: number;
        limit?: number;
        remaining?: number;
        retryAfterSeconds?: number;
        upgradeUrl?: string;
        priceUsdPerMonth?: number;
      };
    }
> {
  const gate = await assertAiGuardrails({ userId, source, rawInput });
  const status = await getGuardrailQuotaStatus(userId);

  if (!gate.ok) {
    return {
      ok: false,
      status,
      httpStatus: gate.status,
      responseBody: gate.responseBody,
    };
  }

  return {
    ok: true,
    status,
    requestHash: gate.requestHash,
    plan: gate.plan,
  };
}

/** Call after a successful AI response so failed calls do not consume quota. */
export async function consumeAiQuota(
  userId: string,
  source: AiSource,
  opts?: { requestHash?: string | null; plan?: "free" | "trail_plus" },
): Promise<AiQuotaStatus> {
  const plan =
    opts?.plan ??
    ((await getGuardrailQuotaStatus(userId)).plan === "trail_plus"
      ? "trail_plus"
      : "free");

  return recordAiGuardrailUse({
    userId,
    source,
    requestHash: opts?.requestHash,
    plan,
  });
}
