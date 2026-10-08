"use client";

import {
  Download,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaystackUpgradeButton } from "@/components/paystack-upgrade-button";
import { FREE_AI_QUOTA, TRAIL_PLUS_PRICE_USD } from "@/lib/ai/quota";

type PaymentItem = {
  id: string;
  reference: string;
  amountFormatted: string;
  status: string;
  paidAt: string | null;
  description: string | null;
  receiptNumber: string | null;
  receiptUrl: string;
};

type BillingPayload = {
  plan: "free" | "trail_plus";
  planLabel: string;
  unlimited: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  priceUsdPerMonth: number;
  freeAiQuota: number;
  quota: {
    used: number;
    limit: number | null;
    remaining: number | null;
  };
  upcomingInvoice: {
    description: string;
    amountFormatted: string;
    dueDate: string;
    status: string;
  } | null;
  cancelledNotice: { message: string; endsAt: string } | null;
  payments: PaymentItem[];
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AccountBilling({
  highlightSuccess = false,
}: {
  highlightSuccess?: boolean;
}) {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [note, setNote] = useState<string | null>(
    highlightSuccess ? "Payment received. Trail Plus is active." : null,
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/account", { cache: "no-store" });
      const json = (await res.json()) as BillingPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load billing");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load billing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function cancelPlan() {
    if (!data?.unlimited) return;
    if (
      !window.confirm(
        "Cancel Trail Plus? You keep Plus fair-use limits until the end of the current period.",
      )
    ) {
      return;
    }
    setCancelling(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(json.error || "Cancel failed");
      setNote(json.message || "Plan cancelled.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading plan & billing…
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-sm text-coral">{error}</p>;
  }

  if (!data) return null;

  const used = data.quota.used;
  const limit = data.quota.limit ?? data.freeAiQuota ?? FREE_AI_QUOTA;

  return (
    <div className="space-y-6">
      {note ? <p className="text-sm text-aqua">{note}</p> : null}
      {error ? <p className="text-sm text-coral">{error}</p> : null}

      <div className="rounded-2xl border border-border bg-foam/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-deep">
              <Sparkles className="h-4 w-4 text-aqua" />
              Current plan
            </p>
            <p className="mt-2 font-display text-3xl text-ocean-deep">
              {data.planLabel}
            </p>
            <p className="mt-1 text-sm text-muted">
              {data.plan === "trail_plus"
                ? `$${data.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD}/month · fair-use AI caps`
                : `${limit} AI uses per month · $${TRAIL_PLUS_PRICE_USD}/mo for Trail Plus`}
            </p>
          </div>
          <span
            className={
              data.plan === "trail_plus"
                ? "rounded-full bg-aqua/15 px-3 py-1 text-xs font-semibold text-ocean"
                : "rounded-full bg-border/60 px-3 py-1 text-xs font-semibold text-muted"
            }
          >
            {data.cancelAtPeriodEnd
              ? "Cancels at period end"
              : data.plan === "trail_plus"
                ? "Active"
                : "Free"}
          </span>
        </div>

        {data.plan !== "trail_plus" ? (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">
              AI used this month: {used} / {limit}
            </p>
            <PaystackUpgradeButton label="Upgrade to Trail Plus" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">
              AI today: {data.quota?.used ?? used} /{" "}
              {data.quota?.limit ?? limit} (fair use)
            </p>
            {data.currentPeriodEnd ? (
              <p className="text-sm text-muted">
                Current period ends {formatDate(data.currentPeriodEnd)}
              </p>
            ) : null}
            {data.cancelledNotice ? (
              <p className="text-sm text-ocean-deep">
                {data.cancelledNotice.message}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void cancelPlan()}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full border border-coral/40 bg-surface px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Cancel Trail Plus
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-foam/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ocean-deep">
          <FileText className="h-4 w-4 text-aqua" />
          Upcoming invoice
        </p>
        {data.upcomingInvoice ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-medium text-ocean-deep">
                {data.upcomingInvoice.description}
              </p>
              <p className="text-muted">
                Due {formatDate(data.upcomingInvoice.dueDate)}
              </p>
            </div>
            <p className="font-semibold text-ocean-deep">
              {data.upcomingInvoice.amountFormatted}
            </p>
          </div>
        ) : data.cancelAtPeriodEnd ? (
          <p className="mt-2 text-sm text-muted">
            No upcoming invoice — renewal is turned off.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No upcoming invoice on the free plan.{" "}
            <Link href="/pricing" className="font-semibold text-aqua">
              View plans
            </Link>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-foam/60 p-4 sm:p-5">
        <p className="text-sm font-semibold text-ocean-deep">Payment history</p>
        {data.payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No payments yet. Receipts appear here after you upgrade.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ocean-deep">
                    {p.description || "Trail Plus"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(p.paidAt)} · {p.receiptNumber || p.reference} ·{" "}
                    {p.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ocean-deep">
                    {p.amountFormatted}
                  </span>
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ocean-deep transition hover:border-aqua/40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Receipt
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
