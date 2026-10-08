import { createHash } from "crypto";
import { userHasActiveTrailPlus } from "@/lib/ai/subscription";
import { TRAIL_PLUS_PRICE_USD } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

export type AiSource = "guide" | "plan" | "hotels";

/** Abuse / fair-use caps. Trail Plus is high-volume, not infinite. */
export const AI_CAPS = {
  free: {
    perMinute: 2,
    perHour: 5,
    perDay: 3,
    perMonth: 3,
  },
  trail_plus: {
    perMinute: 6,
    perHour: 40,
    perDay: 150,
    perMonth: 1000,
  },
} as const;

export type AiQuotaStatus = {
  unlimited: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: string;
  plan: "free" | "trail_plus";
  dayUsed?: number;
  dayLimit?: number;
  monthUsed?: number;
  monthLimit?: number;
};

export function currentAiPeriod(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export type AiCapPlan = keyof typeof AI_CAPS;

type WindowHit = { at: number; hash?: string };

const windowHits = new Map<string, WindowHit[]>();

function windowKey(userId: string) {
  return userId;
}

function prune(hits: WindowHit[], oldestMs: number) {
  const cutoff = Date.now() - oldestMs;
  return hits.filter((h) => h.at >= cutoff);
}

function currentDayPeriod(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `d:${y}-${m}-${d}`;
}

function fingerprintInput(source: AiSource, raw: string) {
  return createHash("sha256")
    .update(`${source}:${raw.trim().toLowerCase().replace(/\s+/g, " ")}`)
    .digest("hex")
    .slice(0, 24);
}

export type GuardrailFailure = {
  ok: false;
  status: number;
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
};

export type GuardrailOk = {
  ok: true;
  plan: AiCapPlan;
  caps: (typeof AI_CAPS)[AiCapPlan];
  requestHash: string | null;
};

/**
 * Input + rate-limit guardrails for every AI call (free and paid).
 */
export async function assertAiGuardrails(input: {
  userId: string;
  source: AiSource;
  /** Raw text used to detect rapid identical repeats */
  rawInput?: string;
}): Promise<GuardrailOk | GuardrailFailure> {
  const plus = await userHasActiveTrailPlus(input.userId);
  const plan: AiCapPlan = plus ? "trail_plus" : "free";
  const caps = AI_CAPS[plan];

  const raw = (input.rawInput ?? "").trim();
  if (raw) {
    if (raw.length > 4000) {
      return {
        ok: false,
        status: 400,
        responseBody: {
          error: "That request is too long. Shorten it and try again.",
          code: "AI_ABUSE_BLOCKED",
        },
      };
    }

    // Repeated character / nonsense spam
    if (/(.)\1{40,}/.test(raw) || /^[^a-zA-Z0-9\u00C0-\u024F]{20,}$/.test(raw)) {
      return {
        ok: false,
        status: 400,
        responseBody: {
          error: "That request looks like spam. Please send a normal travel question.",
          code: "AI_ABUSE_BLOCKED",
        },
      };
    }
  }

  const requestHash = raw ? fingerprintInput(input.source, raw) : null;
  const key = windowKey(input.userId);
  const now = Date.now();
  let hits = prune(windowHits.get(key) ?? [], 60 * 60 * 1000);
  windowHits.set(key, hits);

  // Duplicate identical request within 45s
  if (requestHash) {
    const dup = hits.find(
      (h) => h.hash === requestHash && now - h.at < 45_000,
    );
    if (dup) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((45_000 - (now - dup.at)) / 1000),
      );
      return {
        ok: false,
        status: 429,
        responseBody: {
          error: `You just sent the same request. Wait ${retryAfterSeconds}s before retrying.`,
          code: "AI_RATE_LIMITED",
          retryAfterSeconds,
        },
      };
    }
  }

  const minuteHits = hits.filter((h) => now - h.at < 60_000).length;
  if (minuteHits >= caps.perMinute) {
    return {
      ok: false,
      status: 429,
      responseBody: {
        error: `Slow down — max ${caps.perMinute} AI requests per minute on your plan.`,
        code: "AI_RATE_LIMITED",
        retryAfterSeconds: 60,
        limit: caps.perMinute,
      },
    };
  }

  const hourHits = hits.filter((h) => now - h.at < 60 * 60 * 1000).length;
  if (hourHits >= caps.perHour) {
    return {
      ok: false,
      status: 429,
      responseBody: {
        error: `Hourly AI limit reached (${caps.perHour}/hour). Try again later.`,
        code: "AI_RATE_LIMITED",
        retryAfterSeconds: 900,
        limit: caps.perHour,
      },
    };
  }

  const dayUsed = await readPeriodCount(input.userId, currentDayPeriod());
  if (dayUsed >= caps.perDay) {
    return {
      ok: false,
      status: 429,
      responseBody: {
        error:
          plan === "free"
            ? `Free plan includes ${caps.perDay} AI uses per day (and ${caps.perMonth}/month). Upgrade to Trail Plus for higher fair-use limits.`
            : `Daily fair-use limit reached (${caps.perDay}/day). Try again tomorrow.`,
        code: plan === "free" ? "AI_QUOTA_EXCEEDED" : "AI_RATE_LIMITED",
        used: dayUsed,
        limit: caps.perDay,
        remaining: 0,
        upgradeUrl: "/pricing",
        priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
      },
    };
  }

  const monthUsed = await readPeriodCount(input.userId, currentAiPeriod());
  if (monthUsed >= caps.perMonth) {
    return {
      ok: false,
      status: 402,
      responseBody: {
        error:
          plan === "free"
            ? `Free plan includes ${caps.perMonth} AI uses per month. Upgrade to Trail Plus ($${TRAIL_PLUS_PRICE_USD}/mo) for higher fair-use limits.`
            : `Monthly fair-use limit reached (${caps.perMonth}/month). Contact support if you need more.`,
        code: "AI_QUOTA_EXCEEDED",
        used: monthUsed,
        limit: caps.perMonth,
        remaining: 0,
        upgradeUrl: "/pricing",
        priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
      },
    };
  }

  return { ok: true, plan, caps, requestHash };
}

/** Record a successful AI call against sliding windows + day/month counters. */
export async function recordAiGuardrailUse(input: {
  userId: string;
  source: AiSource;
  requestHash?: string | null;
  plan: AiCapPlan;
}): Promise<AiQuotaStatus> {
  const key = windowKey(input.userId);
  const hits = prune(windowHits.get(key) ?? [], 60 * 60 * 1000);
  hits.push({ at: Date.now(), hash: input.requestHash ?? undefined });
  windowHits.set(key, hits);

  const dayPeriod = currentDayPeriod();
  const monthPeriod = currentAiPeriod();
  const dayUsed = await incrementPeriodCount(
    input.userId,
    dayPeriod,
    input.source,
  );
  const monthUsed = await incrementPeriodCount(
    input.userId,
    monthPeriod,
    input.source,
  );

  return buildQuotaStatus(input.plan, monthUsed, dayUsed, monthPeriod);
}

export function buildQuotaStatus(
  plan: AiCapPlan,
  monthUsed: number,
  dayUsed: number,
  monthPeriod: string,
): AiQuotaStatus {
  const caps = AI_CAPS[plan];
  if (plan === "trail_plus") {
    return {
      unlimited: false,
      used: dayUsed,
      limit: caps.perDay,
      remaining: Math.max(0, caps.perDay - dayUsed),
      period: monthPeriod,
      plan: "trail_plus",
      dayUsed,
      dayLimit: caps.perDay,
      monthUsed,
      monthLimit: caps.perMonth,
    };
  }

  return {
    unlimited: false,
    used: monthUsed,
    limit: caps.perMonth,
    remaining: Math.max(0, caps.perMonth - monthUsed),
    period: monthPeriod,
    plan: "free",
    dayUsed,
    dayLimit: caps.perDay,
    monthUsed,
    monthLimit: caps.perMonth,
  };
}

const memoryPeriod = new Map<string, number>();

function memKey(userId: string, period: string) {
  return `${userId}:${period}`;
}

async function readPeriodCount(userId: string, period: string) {
  const key = memKey(userId, period);
  const mem = memoryPeriod.get(key) ?? 0;
  const supabase = createAdminClient();
  if (!supabase) return mem;

  const { data, error } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("period", period)
    .maybeSingle();

  if (error) {
    console.error("[ai-guardrails] read", error.message);
    return mem;
  }

  const db = typeof data?.count === "number" ? data.count : 0;
  const count = Math.max(db, mem);
  memoryPeriod.set(key, count);
  return count;
}

async function incrementPeriodCount(
  userId: string,
  period: string,
  source: string,
) {
  const key = memKey(userId, period);
  const supabase = createAdminClient();

  if (!supabase) {
    const next = (memoryPeriod.get(key) ?? 0) + 1;
    memoryPeriod.set(key, next);
    return next;
  }

  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    "increment_ai_usage",
    {
      p_user_id: userId,
      p_period: period,
      p_source: source,
    },
  );

  if (!rpcError && typeof rpcCount === "number") {
    memoryPeriod.set(key, rpcCount);
    return rpcCount;
  }

  const current = await readPeriodCount(userId, period);
  const next = current + 1;
  memoryPeriod.set(key, next);

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
  if (error) console.error("[ai-guardrails] increment", error.message);
  return next;
}

export async function getGuardrailQuotaStatus(
  userId: string,
): Promise<AiQuotaStatus> {
  const plus = await userHasActiveTrailPlus(userId);
  const plan: AiCapPlan = plus ? "trail_plus" : "free";
  const monthUsed = await readPeriodCount(userId, currentAiPeriod());
  const dayUsed = await readPeriodCount(userId, currentDayPeriod());
  return buildQuotaStatus(plan, monthUsed, dayUsed, currentAiPeriod());
}
