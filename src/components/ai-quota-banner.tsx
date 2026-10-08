"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  type AiQuotaStatus,
} from "@/lib/ai/quota";
import { cn } from "@/lib/utils";

export type UsagePayload = AiQuotaStatus & {
  freeLimit?: number;
  priceUsdPerMonth?: number;
  upgradeUrl?: string;
};

type AiQuotaContextValue = {
  quota: UsagePayload | null;
  setQuota: (quota: UsagePayload | null) => void;
  /** Apply quota from an AI response — never lowers free usage for the same period. */
  applyQuota: (quota: Partial<UsagePayload> | AiQuotaStatus | null | undefined) => void;
  refresh: () => Promise<void>;
};

const AiQuotaContext = createContext<AiQuotaContextValue | null>(null);

function sessionKey(userId: string, period: string) {
  return `swahili-trail-ai-used:${userId}:${period}`;
}

function readSessionUsed(userId: string, period: string): number {
  if (typeof window === "undefined" || !period) return 0;
  try {
    const raw = sessionStorage.getItem(sessionKey(userId, period));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeSessionUsed(userId: string, period: string, used: number) {
  if (typeof window === "undefined" || !period) return;
  try {
    sessionStorage.setItem(sessionKey(userId, period), String(used));
  } catch {
    /* ignore */
  }
}

function normalizeQuota(
  incoming: Partial<UsagePayload> | AiQuotaStatus,
  prev: UsagePayload | null,
  userId?: string | null,
): UsagePayload {
  const data = incoming as Partial<UsagePayload>;
  const unlimited = Boolean(data.unlimited);
  const period = data.period || prev?.period || "";

  // Subscribed → Trail Plus (only intentional “reset” of the free meter).
  if (unlimited) {
    return {
      unlimited: true,
      used: 0,
      limit: null,
      remaining: null,
      period,
      plan: "trail_plus",
      freeLimit: FREE_AI_QUOTA,
      priceUsdPerMonth:
        typeof data.priceUsdPerMonth === "number"
          ? data.priceUsdPerMonth
          : (prev?.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD),
      upgradeUrl: data.upgradeUrl || prev?.upgradeUrl || "/pricing",
    };
  }

  const incomingUsed =
    typeof data.used === "number" ? data.used : (prev?.used ?? 0);
  const sessionUsed =
    userId && period ? readSessionUsed(userId, period) : 0;
  const prevUsed =
    prev && !prev.unlimited && prev.period === period ? prev.used : 0;

  // Free usage only goes up within a period (blocks stale refresh → 0).
  const used = Math.max(incomingUsed, sessionUsed, prevUsed);
  const limit =
    typeof data.limit === "number"
      ? data.limit
      : (prev?.limit ?? FREE_AI_QUOTA);
  const remaining = Math.max(0, (limit ?? FREE_AI_QUOTA) - used);

  if (userId && period) writeSessionUsed(userId, period, used);

  return {
    unlimited: false,
    used,
    limit,
    remaining,
    period,
    plan: "free",
    freeLimit:
      typeof data.freeLimit === "number"
        ? data.freeLimit
        : (prev?.freeLimit ?? FREE_AI_QUOTA),
    priceUsdPerMonth:
      typeof data.priceUsdPerMonth === "number"
        ? data.priceUsdPerMonth
        : (prev?.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD),
    upgradeUrl: data.upgradeUrl || prev?.upgradeUrl || "/pricing",
  };
}

export function AiQuotaProvider({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const [quota, setQuotaState] = useState<UsagePayload | null>(null);
  const refreshSeq = useRef(0);

  const setQuota = useCallback((next: UsagePayload | null) => {
    setQuotaState(next);
  }, []);

  const applyQuota = useCallback(
    (incoming: Partial<UsagePayload> | AiQuotaStatus | null | undefined) => {
      if (!incoming) return;
      // Invalidate in-flight refreshes so they cannot overwrite a fresher AI response.
      refreshSeq.current += 1;
      setQuotaState((prev) => normalizeQuota(incoming, prev, userId));
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setQuotaState(null);
      return;
    }
    const seq = ++refreshSeq.current;
    try {
      const res = await fetch("/api/ai/usage", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as UsagePayload;
      if (seq !== refreshSeq.current) return;
      setQuotaState((prev) => normalizeQuota(data, prev, userId));
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, refresh]);

  const value = useMemo(
    () => ({ quota, setQuota, applyQuota, refresh }),
    [quota, setQuota, applyQuota, refresh],
  );

  return (
    <AiQuotaContext.Provider value={value}>{children}</AiQuotaContext.Provider>
  );
}

export function useAiQuota() {
  const ctx = useContext(AiQuotaContext);
  if (!ctx) {
    throw new Error("useAiQuota must be used within AiQuotaProvider");
  }
  return ctx;
}

function UsageMeter({
  used,
  limit,
  exhausted,
}: {
  used: number;
  limit: number;
  exhausted: boolean;
}) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-border/80"
      role="progressbar"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-label={`${used} of ${limit} AI queries used`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          exhausted ? "bg-coral" : pct >= 66 ? "bg-coral/80" : "bg-aqua",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Compact chip for the site header */
export function AiQuotaNavChip({ className = "" }: { className?: string }) {
  const { isLoaded, userId } = useAuth();
  const { quota } = useAiQuota();

  if (!isLoaded || !userId || !quota) return null;

  if (quota.unlimited) {
    return (
      <Link
        href="/pricing"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-aqua/35 bg-aqua/10 px-2.5 py-1 text-xs font-semibold text-ocean-deep transition hover:bg-aqua/20",
          className,
        )}
        title="Trail Plus — unlimited AI"
      >
        <Sparkles className="h-3.5 w-3.5 text-aqua" />
        Plus
      </Link>
    );
  }

  const used = quota.used;
  const limit = quota.limit ?? FREE_AI_QUOTA;
  const exhausted = used >= limit;

  return (
    <Link
      href="/pricing"
      className={cn(
        "group flex min-w-[7.5rem] flex-col gap-1 rounded-full border px-2.5 py-1.5 transition",
        exhausted
          ? "border-coral/40 bg-coral/10 hover:bg-coral/15"
          : "border-border bg-surface/80 hover:border-aqua/40",
        className,
      )}
      title={`${used} of ${limit} free AI uses this month`}
    >
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <span>AI</span>
        <span className={exhausted ? "text-coral" : "text-ocean-deep"}>
          {used}/{limit}
        </span>
      </div>
      <UsageMeter used={used} limit={limit} exhausted={exhausted} />
    </Link>
  );
}

export function AiQuotaBanner({
  className,
  quota,
}: {
  className?: string;
  quota: UsagePayload | null;
}) {
  if (!quota) return null;

  if (quota.unlimited) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-aqua/30 bg-aqua/10 px-3.5 py-2.5 text-sm text-ocean-deep",
          className,
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-aqua" />
        <span>
          <span className="font-semibold">Trail Plus</span> — unlimited AI this
          month
        </span>
      </div>
    );
  }

  const used = quota.used;
  const remaining = quota.remaining ?? 0;
  const limit = quota.limit ?? FREE_AI_QUOTA;
  const exhausted = remaining <= 0;

  return (
    <div
      className={cn(
        "rounded-2xl border px-3.5 py-3 text-sm text-ocean-deep",
        exhausted
          ? "border-coral/40 bg-coral/10"
          : "border-border bg-foam/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {used}/{limit} AI queries used
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {exhausted
              ? `Limit reached — Trail Plus is $${quota.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD}/mo`
              : `${remaining} free ${remaining === 1 ? "use" : "uses"} left this month`}
          </p>
        </div>
        <Link
          href="/pricing"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
            exhausted
              ? "bg-coral text-white hover:brightness-110"
              : "border border-border bg-surface text-ocean-deep hover:border-aqua/40",
          )}
        >
          {exhausted ? "Upgrade" : "Trail Plus"}
        </Link>
      </div>
      <div className="mt-2.5">
        <UsageMeter used={used} limit={limit} exhausted={exhausted} />
      </div>
    </div>
  );
}

export function aiQuotaErrorMessage(data: {
  error?: string;
  code?: string;
  priceUsdPerMonth?: number;
}) {
  if (data.code === "AI_QUOTA_EXCEEDED") {
    return (
      data.error ||
      `Free AI limit reached. Upgrade to Trail Plus ($${data.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD}/mo) for unlimited uses.`
    );
  }
  return data.error || "Request failed";
}
