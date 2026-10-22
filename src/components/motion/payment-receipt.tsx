"use client";

/**
 * Receipt printer — layout + stepped feed matched to dqnamo.
 * Machine screen on top, paper feeds from the slot below.
 * https://www.dqnamo.com/experiments/receipt-printer
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { DynamicButton } from "@/components/motion/dynamic-button";
import { downloadReceiptPdf } from "@/lib/receipt-pdf";
import { cn } from "@/lib/utils";

export type ReceiptStage = "processing" | "printing" | "complete";

export type PaymentReceiptProps = {
  planLabel?: string;
  planDetail?: string;
  amountFormatted?: string;
  subtotalFormatted?: string | null;
  taxFormatted?: string | null;
  reference?: string | null;
  paidAt?: string | null;
  paidWith?: string | null;
  className?: string;
  autoPlay?: boolean;
  downloadUrl?: string | null;
  downloadLabel?: string;
  onDownload?: () => void;
};

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

const receiptToothCount = 40;
const receiptToothDepth = 4;
const receiptToothPoints = Array.from(
  { length: receiptToothCount * 2 },
  (_, index) => {
    const x = 100 - ((index + 1) * 100) / (receiptToothCount * 2);
    const y =
      index % 2 === 0 ? "100%" : `calc(100% - ${receiptToothDepth}px)`;
    return `${x}% ${y}`;
  },
).join(", ");
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${receiptToothDepth}px), ${receiptToothPoints})`;

const printingTransformKeyframes = [
  "translateY(calc(-100% + 2px))",
  "translateY(-91%)",
  "translateY(-91%)",
  "translateY(-81%)",
  "translateY(-81%)",
  "translateY(-70%)",
  "translateY(-70%)",
  "translateY(-58%)",
  "translateY(-58%)",
  "translateY(-45%)",
  "translateY(-45%)",
  "translateY(-32%)",
  "translateY(-32%)",
  "translateY(-20%)",
  "translateY(-20%)",
  "translateY(-10%)",
  "translateY(-10%)",
  "translateY(-3%)",
  "translateY(-3%)",
  "translateY(0%)",
];

const printingKeyframeTimes = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
];

const statusLabels: Record<ReceiptStage, string> = {
  processing: "Processing your order",
  printing: "Printing your receipt",
  complete: "Order complete",
};

export function PaymentReceipt({
  planLabel = "Trail Plus",
  planDetail = "Monthly access",
  amountFormatted = "KES 520",
  subtotalFormatted,
  taxFormatted,
  reference,
  paidAt,
  paidWith,
  className,
  autoPlay = true,
  downloadUrl: _downloadUrl,
  downloadLabel = "Download receipt",
  onDownload,
}: PaymentReceiptProps) {
  const reduce = useReducedMotion();
  const shouldMove = !reduce && autoPlay;
  const [stage, setStage] = useState<ReceiptStage>(
    autoPlay && !reduce ? "processing" : "complete",
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoPlay || reduce) {
      const done = window.setTimeout(() => setStage("complete"), 0);
      return () => window.clearTimeout(done);
    }
    const start = window.setTimeout(() => setStage("processing"), 0);
    const t1 = window.setTimeout(() => setStage("printing"), 900);
    const t2 = window.setTimeout(() => setStage("complete"), 3200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [autoPlay, reduce, amountFormatted, reference]);

  const when = paidAt
    ? new Date(paidAt).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const orderCode = reference
    ? reference.replace(/^st_/i, "").slice(-8).toUpperCase()
    : "TRAIL";

  function handleDownload() {
    setDownloadError(null);
    if (onDownload) {
      onDownload();
      return;
    }
    setDownloading(true);
    try {
      downloadReceiptPdf(
        {
          planLabel,
          planDetail,
          amountFormatted,
          subtotalFormatted,
          taxFormatted,
          reference,
          paidAt,
          paidWith,
        },
        `swahili-trail-receipt-${orderCode}.pdf`,
      );
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Download failed",
      );
    } finally {
      setDownloading(false);
    }
  }

  const isReceiptVisible = stage !== "processing";
  const shouldUseSteppedFeed = stage === "printing" && shouldMove;

  return (
    <section
      aria-label="Receipt printer"
      data-stage={stage}
      className={cn(
        "relative isolate mx-auto flex w-full max-w-sm flex-col items-center",
        className,
      )}
    >
      {/* Machine */}
      <div
        className={cn(
          "relative isolate w-full overflow-hidden rounded-[1.5rem] border border-white/10",
          "bg-[color-mix(in_oklab,var(--brand-deep)_88%,#1a1a1a)] p-3 pb-8",
          "shadow-[0_20px_36px_-20px_rgba(0,0,0,0.55),0_6px_14px_-8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]",
        )}
      >
        <div className="relative z-10 flex h-11 items-start justify-between px-1">
          <BrandMark tone="onDark" className="h-8 w-8" />
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-on-brand/70">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M4 10.5V20h16v-9.5" />
              <path d="M4 10.5 12 4l8 6.5" />
              <path d="M9 20v-5h6v5" />
            </svg>
          </span>
        </div>

        <div
          className={cn(
            "relative z-10 isolate overflow-hidden rounded-[calc(1.5rem-0.75rem)] border border-black/40",
            "bg-[#0a0a0a] p-4 text-white shadow-inner",
          )}
        >
          <div className="relative z-10 space-y-4">
            <div>
              <p className="text-lg font-semibold tracking-tight">{planLabel}</p>
              <p className="mt-0.5 text-sm text-white/45">{planDetail}</p>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Total
                </p>
                <p className="font-display text-2xl font-semibold tracking-tight">
                  {amountFormatted}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 border-t border-white/10 pt-3">
              <span className="relative grid size-5 shrink-0 place-items-center">
                <AnimatePresence initial={false} mode="sync">
                  {stage === "complete" ? (
                    <motion.span
                      key="complete"
                      className="col-start-1 row-start-1 text-emerald-400"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: easeOut }}
                    >
                      <CheckCircle2 className="h-[18px] w-[18px]" fill="currentColor" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="working"
                      className="col-start-1 row-start-1 text-white/55"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: easeOut }}
                    >
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <div className="grid min-w-0 flex-1" role="status" aria-live="polite">
                <AnimatePresence initial={false} mode="sync">
                  <motion.p
                    key={stage}
                    className="col-start-1 row-start-1 truncate text-xs font-medium text-white/70"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: easeOut }}
                  >
                    {statusLabels[stage]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Slot */}
        <div
          aria-hidden
          className="absolute inset-x-6 bottom-3 z-40 h-2 rounded-[0.25rem] border border-black/80 bg-black shadow-inner"
        />
      </div>

      {/* Output / paper feed */}
      <div className="relative z-50 -mt-4 h-[28rem] w-[calc(80%+3rem)] max-w-full overflow-hidden px-4">
        {isReceiptVisible ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-black/50 blur-[6px]"
          />
        ) : null}

        <motion.div
          initial={false}
          animate={{
            opacity: isReceiptVisible ? 1 : 0,
            transform: shouldUseSteppedFeed
              ? printingTransformKeyframes
              : isReceiptVisible || !shouldMove
                ? "translateY(0%)"
                : "translateY(calc(-100% + 2px))",
          }}
          transition={{
            opacity: { duration: shouldMove ? 0.16 : 0, ease: easeOut },
            transform: {
              duration: shouldMove ? (shouldUseSteppedFeed ? 1.75 : 0.55) : 0,
              ease: shouldUseSteppedFeed ? "linear" : easeInOut,
              times: shouldUseSteppedFeed ? printingKeyframeTimes : undefined,
            },
          }}
          className="relative isolate"
          aria-hidden={stage !== "complete"}
        >
          <article
            className="relative z-10 min-h-80 bg-[#f7f4ee] px-6 pb-8 pt-7 font-mono text-[#111]"
            style={{ clipPath: receiptClipPath }}
          >
            <div className="flex flex-col items-center text-center">
              <BrandMark tone="app" className="h-10 w-10" />
              <p className="mt-3 font-sans text-sm font-semibold tracking-tight text-[#0c3d42]">
                Swahili Trail
              </p>
            </div>

            <div className="mt-6 space-y-1 text-[11px] leading-relaxed">
              <div className="flex justify-between gap-3">
                <span className="uppercase tracking-wide">{planLabel}</span>
                <span>{subtotalFormatted ?? amountFormatted}</span>
              </div>
              <p className="text-[10px] text-black/45">{planDetail}</p>
            </div>

            <div className="my-4 border-t border-dashed border-black/25" />

            <div className="space-y-1.5 text-[11px]">
              {subtotalFormatted ? (
                <div className="flex justify-between gap-3 text-black/60">
                  <span>Subtotal</span>
                  <span>{subtotalFormatted}</span>
                </div>
              ) : null}
              {taxFormatted ? (
                <div className="flex justify-between gap-3 text-black/60">
                  <span>Tax</span>
                  <span>{taxFormatted}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 text-sm font-semibold">
                <span>TOTAL PAID</span>
                <span>{amountFormatted}</span>
              </div>
            </div>

            <div className="my-4 border-t border-dashed border-black/25" />

            <div className="space-y-1.5 text-[10px] text-black/55">
              {reference ? (
                <div className="flex justify-between gap-3">
                  <span>Order</span>
                  <span className="truncate">{orderCode}</span>
                </div>
              ) : null}
              {paidWith ? (
                <div className="flex justify-between gap-3">
                  <span>Paid with</span>
                  <span>{paidWith}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <span>Date</span>
                <span>{when}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-1.5" aria-hidden>
              <div className="flex h-10 items-end justify-center gap-[1.5px]">
                {Array.from({ length: 42 }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block w-[2px] bg-black"
                    style={{ height: 10 + ((i * 11) % 22) }}
                  />
                ))}
              </div>
              <p className="text-[9px] tracking-[0.2em] text-black/50">
                {orderCode}
              </p>
            </div>
          </article>
        </motion.div>
      </div>

      {stage === "complete" ? (
        <div className="relative z-[60] -mt-8 flex w-full flex-col items-center gap-2 px-4">
          <DynamicButton
            variant="coral"
            size="md"
            width="full"
            stateKey={downloading ? "busy" : "idle"}
            disabled={downloading}
            icon={
              downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )
            }
            onClick={handleDownload}
          >
            {downloading ? "Downloading…" : downloadLabel}
          </DynamicButton>
          {downloadError ? (
            <p className="text-center text-xs text-coral">{downloadError}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export type ReceiptJob = {
  title: string;
  amountFormatted: string;
  planDetail?: string;
  reference?: string | null;
  paidAt?: string | null;
  paidWith?: string | null;
  downloadUrl?: string | null;
  kind?: "receipt" | "invoice";
};

export function ReceiptPrinterModal({
  open,
  job,
  onClose,
}: {
  open: boolean;
  job: ReceiptJob | null;
  onClose: () => void;
}) {
  if (!open || !job) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close receipt printer"
        className="fixed inset-0 bg-[#0a0a0a]/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] my-6 w-full max-w-md"
      >
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--brand-deep)_92%,black)] px-4 py-3 shadow-lg">
          <BrandLogo variant="full" onDark />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-on-brand hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <PaymentReceipt
          planLabel={job.title}
          planDetail={
            job.planDetail ??
            (job.kind === "invoice" ? "Upcoming invoice" : "Monthly access")
          }
          amountFormatted={job.amountFormatted}
          reference={job.reference}
          paidAt={job.paidAt}
          paidWith={job.paidWith}
          downloadUrl={job.downloadUrl}
          downloadLabel={
            job.kind === "invoice" ? "Download invoice" : "Download receipt"
          }
          autoPlay
        />
      </motion.div>
    </div>
  );
}
