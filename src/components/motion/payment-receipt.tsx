"use client";

/**
 * Payment receipt — inspired by dqnamo Receipt Printer.
 * Stages: processing → printing → complete, with stepped paper feed.
 * https://www.dqnamo.com/experiments/receipt-printer
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Download, Loader2, Printer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { DynamicButton } from "@/components/motion/dynamic-button";
import { cn } from "@/lib/utils";

export type ReceiptStage = "processing" | "printing" | "complete";

export type PaymentReceiptProps = {
  planLabel?: string;
  amountFormatted?: string;
  reference?: string | null;
  paidAt?: string | null;
  statusLabel?: string;
  className?: string;
  autoPlay?: boolean;
  /** When set, shows Download after print completes */
  downloadUrl?: string | null;
  onDownload?: () => void;
};

const easeOut = [0.23, 1, 0.32, 1] as const;

const printingTransformKeyframes = [
  "translateY(calc(-100% + 2px))",
  "translateY(-88%)",
  "translateY(-88%)",
  "translateY(-72%)",
  "translateY(-72%)",
  "translateY(-55%)",
  "translateY(-55%)",
  "translateY(-38%)",
  "translateY(-38%)",
  "translateY(-20%)",
  "translateY(-20%)",
  "translateY(-6%)",
  "translateY(-6%)",
  "translateY(0%)",
];

const printingKeyframeTimes = [
  0, 0.08, 0.12, 0.2, 0.24, 0.34, 0.38, 0.5, 0.54, 0.68, 0.72, 0.86, 0.9, 1,
];

export function PaymentReceipt({
  planLabel = "Trail Plus",
  amountFormatted = "KES 520",
  reference,
  paidAt,
  statusLabel,
  className,
  autoPlay = true,
  downloadUrl,
  onDownload,
}: PaymentReceiptProps) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<ReceiptStage>(
    autoPlay && !reduce ? "processing" : "complete",
  );

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

  const status =
    statusLabel ??
    (stage === "processing"
      ? "Processing"
      : stage === "printing"
        ? "Printing receipt"
        : "Ready");

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

  function handleDownload() {
    if (onDownload) {
      onDownload();
      return;
    }
    if (downloadUrl) {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section
      className={cn(
        "relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-[color-mix(in_oklab,var(--ocean-deep)_8%,var(--surface))] p-3 shadow-[0_20px_40px_-24px_rgba(6,42,46,0.55)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-brand-deep px-4 py-3 text-on-brand">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrandMark tone="onDark" className="h-7 w-7" />
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gold">
              <span className="flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Trail till
              </span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="flex items-center gap-1.5 text-xs text-on-brand/80"
            >
              {stage === "complete" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-aqua" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              )}
              {status}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-3 h-[260px] overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--brand-deep)_12%,transparent)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 z-10 h-3 rounded-b-sm bg-brand-deep/80 shadow-md"
        />
        <motion.article
          className="absolute inset-x-4 top-2 origin-top rounded-sm bg-[#f4f1ea] px-4 pb-5 pt-4 text-[#1a1a1a] shadow-lg"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 4px), 97.5% 100%, 95% calc(100% - 4px), 92.5% 100%, 90% calc(100% - 4px), 87.5% 100%, 85% calc(100% - 4px), 82.5% 100%, 80% calc(100% - 4px), 77.5% 100%, 75% calc(100% - 4px), 72.5% 100%, 70% calc(100% - 4px), 67.5% 100%, 65% calc(100% - 4px), 62.5% 100%, 60% calc(100% - 4px), 57.5% 100%, 55% calc(100% - 4px), 52.5% 100%, 50% calc(100% - 4px), 47.5% 100%, 45% calc(100% - 4px), 42.5% 100%, 40% calc(100% - 4px), 37.5% 100%, 35% calc(100% - 4px), 32.5% 100%, 30% calc(100% - 4px), 27.5% 100%, 25% calc(100% - 4px), 22.5% 100%, 20% calc(100% - 4px), 17.5% 100%, 15% calc(100% - 4px), 12.5% 100%, 10% calc(100% - 4px), 7.5% 100%, 5% calc(100% - 4px), 2.5% 100%, 0 calc(100% - 4px))",
          }}
          initial={false}
          animate={
            reduce || stage === "complete"
              ? { transform: "translateY(0%)" }
              : stage === "printing"
                ? { transform: printingTransformKeyframes }
                : { transform: "translateY(calc(-100% + 2px))" }
          }
          transition={
            stage === "printing" && !reduce
              ? {
                  duration: 2.1,
                  ease: "linear",
                  times: printingKeyframeTimes,
                }
              : { duration: reduce ? 0 : 0.45, ease: easeOut }
          }
        >
          <div className="flex items-center gap-2">
            <BrandMark tone="light" className="h-8 w-8" />
            <div>
              <p className="font-display text-sm font-semibold leading-tight text-[#0c3d42]">
                Swahili Trail
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-black/45">
                Kenya travel
              </p>
            </div>
          </div>
          <p className="mt-3 font-display text-lg font-semibold">{planLabel}</p>
          <div className="my-3 border-t border-dashed border-black/25" />
          <div className="flex justify-between font-mono text-xs">
            <span>Total</span>
            <span className="font-semibold">{amountFormatted}</span>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-black/55">
            <span>Date</span>
            <span>{when}</span>
          </div>
          {reference ? (
            <div className="mt-1 flex justify-between gap-2 font-mono text-[10px] text-black/55">
              <span>Ref</span>
              <span className="truncate">{reference}</span>
            </div>
          ) : null}
          <div className="mt-4 flex justify-center gap-0.5" aria-hidden>
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-0.5 bg-black/80"
                style={{ height: 8 + ((i * 7) % 14) }}
              />
            ))}
          </div>
        </motion.article>
      </div>

      {(downloadUrl || onDownload) && stage === "complete" ? (
        <div className="mt-3 flex justify-center">
          <DynamicButton
            variant="coral"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={handleDownload}
          >
            Download PDF
          </DynamicButton>
        </div>
      ) : null}
    </section>
  );
}

export type ReceiptJob = {
  title: string;
  amountFormatted: string;
  reference?: string | null;
  paidAt?: string | null;
  downloadUrl?: string | null;
  kind?: "receipt" | "invoice";
};

/** Modal that runs the till animation, then unlocks download. */
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close receipt printer"
        className="absolute inset-0 bg-brand-deep/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] w-full max-w-md"
      >
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <BrandLogo variant="full" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-ocean-deep hover:bg-foam"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <PaymentReceipt
          planLabel={job.title}
          amountFormatted={job.amountFormatted}
          reference={job.reference}
          paidAt={job.paidAt}
          downloadUrl={job.downloadUrl}
          statusLabel={
            job.kind === "invoice" ? "Printing invoice" : undefined
          }
          autoPlay
        />
      </motion.div>
    </div>
  );
}
