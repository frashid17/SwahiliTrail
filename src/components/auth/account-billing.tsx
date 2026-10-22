"use client";

import {
  Download,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PaymentReceipt,
  ReceiptPrinterModal,
  type ReceiptJob,
} from "@/components/motion/payment-receipt";
import { PaystackUpgradeButton } from "@/components/paystack-upgrade-button";
import { Badge } from "@/components/ui/badge";
import { TrailAiMark } from "@/components/ui/trail-ai-mark";
import { FREE_AI_QUOTA, TRAIL_PLUS_PRICE_USD } from "@/lib/ai/quota";
import { cn } from "@/lib/utils";

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
  autoRenew: boolean;
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
  periodAccessNotice: { message: string; endsAt: string } | null;
  cancelledNotice: { message: string; endsAt: string } | null;
  payments: PaymentItem[];
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
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
  const [receiptJob, setReceiptJob] = useState<ReceiptJob | null>(null);

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
    const boot = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(boot);
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

  const latestPayment = data.payments[0] ?? null;

  return (
    <div className="space-y-6">
      {highlightSuccess ? (
        <PaymentReceipt
          planLabel={data.planLabel}
          amountFormatted={
            latestPayment?.amountFormatted ??
            `≈ $${data.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD}`
          }
          reference={latestPayment?.reference ?? null}
          paidAt={latestPayment?.paidAt ?? null}
        />
      ) : null}
      {note ? <p className="text-sm text-aqua">{note}</p> : null}
      {error ? <p className="text-sm text-coral">{error}</p> : null}

      <div className="rounded-2xl border border-border bg-foam/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-deep">
              <TrailAiMark className="h-4 w-4 text-aqua" />
              Current plan
            </p>
            <p className="mt-2 font-display text-3xl text-ocean-deep">
              {data.planLabel}
            </p>
            <p className="mt-1 text-sm text-muted">
              {data.plan === "trail_plus"
                ? `$${data.priceUsdPerMonth ?? TRAIL_PLUS_PRICE_USD}/mo · 30-day access · fair-use AI`
                : `${limit} AI uses per month · $${TRAIL_PLUS_PRICE_USD}/mo for Trail Plus`}
            </p>
          </div>
          <span
            className={
              data.plan === "trail_plus"
                ? "rounded-[0.3rem] bg-aqua/15 px-3 py-1 text-xs font-semibold text-ocean"
                : "rounded-[0.3rem] bg-border/60 px-3 py-1 text-xs font-semibold text-muted"
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
            {data.periodAccessNotice ? (
              <p className="text-sm text-ocean-deep">
                {data.periodAccessNotice.message}
              </p>
            ) : null}
            {data.cancelledNotice ? (
              <p className="text-sm text-ocean-deep">
                {data.cancelledNotice.message}
              </p>
            ) : data.autoRenew ? (
              <button
                type="button"
                onClick={() => void cancelPlan()}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-[0.3rem] border border-coral/40 bg-surface px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Cancel auto-renew
              </button>
            ) : (
              <PaystackUpgradeButton label="Extend another 30 days" />
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-foam/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ocean-deep">
          <FileText className="h-4 w-4 text-aqua" />
          {data.autoRenew ? "Upcoming invoice" : "Renewal"}
        </p>
        {data.upcomingInvoice ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-ocean-deep">
                {data.upcomingInvoice.description}
              </p>
              <p className="text-muted">
                Due {formatDate(data.upcomingInvoice.dueDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold text-ocean-deep">
                {data.upcomingInvoice.amountFormatted}
              </p>
              <button
                type="button"
                onClick={() =>
                  setReceiptJob({
                    title: data.upcomingInvoice!.description,
                    amountFormatted: data.upcomingInvoice!.amountFormatted,
                    paidAt: data.upcomingInvoice!.dueDate,
                    kind: "invoice",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ocean-deep transition hover:border-aqua/40"
              >
                <Printer className="h-3.5 w-3.5" />
                Print preview
              </button>
            </div>
          </div>
        ) : data.plan === "trail_plus" && !data.autoRenew ? (
          <p className="mt-2 text-sm text-muted">
            Paid with a one-time method (e.g. M-Pesa). No automatic charge -
            extend from Account or Pricing when you want another 30 days.
          </p>
        ) : data.cancelAtPeriodEnd ? (
          <p className="mt-2 text-sm text-muted">
            No upcoming invoice - renewal is turned off.
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
            {data.payments.map((p) => {
              const isSuccess = p.status === "success";
              const isPending = p.status === "pending";
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-ocean-deep">
                      {p.description || "Trail Plus"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(p.paidAt)} · {p.receiptNumber || p.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "font-normal capitalize",
                        isSuccess &&
                          "bg-[color-mix(in_oklab,var(--aqua)_14%,transparent)] text-ocean",
                        isPending &&
                          "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color-mix(in_oklab,var(--ocean-deep)_80%,var(--gold))]",
                        !isSuccess &&
                          !isPending &&
                          "bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-coral",
                      )}
                    >
                      {p.status}
                    </Badge>
                    <span className="font-semibold text-ocean-deep">
                      {p.amountFormatted}
                    </span>
                    {isSuccess ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptJob({
                            title: p.description || "Trail Plus",
                            amountFormatted: p.amountFormatted,
                            reference: p.reference,
                            paidAt: p.paidAt,
                            downloadUrl: p.receiptUrl,
                            kind: "receipt",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ocean-deep transition hover:border-aqua/40"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                    ) : isPending ? (
                      <span className="text-xs text-muted">Awaiting Paystack</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ReceiptPrinterModal
        open={Boolean(receiptJob)}
        job={receiptJob}
        onClose={() => setReceiptJob(null)}
      />
    </div>
  );
}
