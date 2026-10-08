import { userHasActiveTrailPlus } from "@/lib/ai/subscription";
import { TRAIL_PLUS_PRICE_USD } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

/** Free AI calls per calendar month (guide + planner + stay matcher). */
export const FREE_AI_QUOTA = 3;

export { TRAIL_PLUS_PRICE_USD };

export type AiQuotaStatus = {
  unlimited: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: string;
  plan: "free" | "trail_plus";
};

const memoryUsage = new Map<string, number>();

export function currentAiPeriod(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function memoryKey(userId: string, period: string) {
  return `${userId}:${period}`;
}

function freeStatus(used: number, period: string): AiQuotaStatus {
  const safeUsed = Math.max(0, used);
  return {
    unlimited: false,
    used: safeUsed,
    limit: FREE_AI_QUOTA,
    remaining: Math.max(0, FREE_AI_QUOTA - safeUsed),
    period,
    plan: "free",
  };
}

export async function getAiQuotaStatus(userId: string): Promise<AiQuotaStatus> {
  const period = currentAiPeriod();
  if (await userHasActiveTrailPlus(userId)) {
    return {
      unlimited: true,
      used: 0,
      limit: null,
      remaining: null,
      period,
      plan: "trail_plus",
    };
  }

  const used = await readUsage(userId, period);
  return freeStatus(used, period);
}

/**
 * Enforce free-tier limit before an AI call.
 */
export async function assertAiQuota(userId: string): Promise<
  | { ok: true; status: AiQuotaStatus }
  | {
      ok: false;
      status: AiQuotaStatus;
      responseBody: {
        error: string;
        code: "AI_QUOTA_EXCEEDED";
        used: number;
        limit: number;
        remaining: number;
        upgradeUrl: string;
        priceUsdPerMonth: number;
      };
    }
> {
  const status = await getAiQuotaStatus(userId);
  if (status.unlimited) return { ok: true, status };

  if (status.used >= FREE_AI_QUOTA) {
    return {
      ok: false,
      status,
      responseBody: {
        error: `Free plan includes ${FREE_AI_QUOTA} AI uses per month. Upgrade to Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo) for unlimited AI.`,
        code: "AI_QUOTA_EXCEEDED",
        used: status.used,
        limit: FREE_AI_QUOTA,
        remaining: 0,
        upgradeUrl: "/pricing",
        priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
      },
    };
  }

  return { ok: true, status };
}

/** Call after a successful AI response so failed calls do not consume quota. */
export async function consumeAiQuota(
  userId: string,
  source: "guide" | "plan" | "hotels",
): Promise<AiQuotaStatus> {
  if (await userHasActiveTrailPlus(userId)) {
    return getAiQuotaStatus(userId);
  }
  const period = currentAiPeriod();
  const used = await incrementUsage(userId, period, source);
  return freeStatus(used, period);
}

async function readUsage(userId: string, period: string): Promise<number> {
  const key = memoryKey(userId, period);
  const mem = memoryUsage.get(key) ?? 0;
  const supabase = createAdminClient();
  if (!supabase) return mem;

  const { data, error } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("period", period)
    .maybeSingle();

  if (error) {
    console.error("[ai-quota] read", error.message);
    return mem;
  }

  const dbCount = typeof data?.count === "number" ? data.count : 0;
  // Prefer the higher value so a failed write + in-memory count is not wiped.
  const count = Math.max(dbCount, mem);
  memoryUsage.set(key, count);
  return count;
}

async function incrementUsage(
  userId: string,
  period: string,
  source: string,
): Promise<number> {
  const key = memoryKey(userId, period);
  const supabase = createAdminClient();

  if (!supabase) {
    const next = (memoryUsage.get(key) ?? 0) + 1;
    memoryUsage.set(key, next);
    return next;
  }

  // Atomic increment when the SQL function is installed.
  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    "increment_ai_usage",
    {
      p_user_id: userId,
      p_period: period,
      p_source: source,
    },
  );

  if (!rpcError && typeof rpcCount === "number") {
    memoryUsage.set(key, rpcCount);
    return rpcCount;
  }

  if (rpcError) {
    console.warn(
      "[ai-quota] rpc increment unavailable, using upsert fallback:",
      rpcError.message,
    );
  }

  const current = await readUsage(userId, period);
  const next = current + 1;
  memoryUsage.set(key, next);

  const { error } = await supabase.from("ai_usage").upsert(
    {
      user_id: userId,
      period,
      count: next,
      last_source: source,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period" },
  );

  if (error) {
    console.error("[ai-quota] increment upsert", error.message);
    // Keep memory count so this process still enforces the limit.
  }

  return next;
}
