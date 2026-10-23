"use client";

import { Show } from "@clerk/nextjs";
import { Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { PaystackUpgradeButton } from "@/components/paystack-upgrade-button";
import { ButtonLink } from "@/components/ui/button";
import { TrailAiMark } from "@/components/ui/trail-ai-mark";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_DAILY_CAP,
  TRAIL_PLUS_MONTHLY_CAP,
  TRAIL_PLUS_PRICE_USD,
} from "@/lib/ai/quota";

const PLUS_HIGHLIGHTS = [
  `Fair-use AI up to ${TRAIL_PLUS_DAILY_CAP}/day · ${TRAIL_PLUS_MONTHLY_CAP}/month`,
  "Catalogue-locked plans with real KES rates & Maps",
  "Edit saved trips with AI (swap days, rebuild budget)",
  "Trip-aware guide + operator briefs from shares",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UpgradeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <button
        type="button"
        aria-label="Close upgrade dialog"
        className="absolute inset-0 bg-ocean-deep/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        <div className="bg-brand-deep px-5 pb-6 pt-5 text-on-brand">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Free limit reached
              </p>
              <h2
                id="upgrade-modal-title"
                className="mt-2 font-display text-2xl font-semibold"
              >
                Upgrade to Trail Plus
              </h2>
              <p className="mt-1 text-sm text-on-brand/70">
                Your free plan includes {FREE_AI_QUOTA} AI{" "}
                {FREE_AI_QUOTA === 1 ? "query" : "queries"} per month. Unlock
                ongoing Guide, Planner, and trip edits.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-on-brand/20 p-1.5 text-on-brand/80 hover:bg-on-brand/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-5 font-display text-4xl tracking-tight">
            ${TRAIL_PLUS_PRICE_USD}
            <span className="ml-1 text-base font-normal text-on-brand/55">
              /mo
            </span>
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <ul className="space-y-2.5">
            {PLUS_HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-ocean-deep"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                {item}
              </li>
            ))}
          </ul>

          <Show
            when="signed-in"
            fallback={
              <ButtonLink
                href="/sign-in?redirect_url=/pricing"
                variant="solid"
                className="w-full"
              >
                Sign in to upgrade
              </ButtonLink>
            }
          >
            <PaystackUpgradeButton label={`Upgrade — $${TRAIL_PLUS_PRICE_USD}/mo`} />
          </Show>

          <Link
            href="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-ocean underline-offset-2 hover:underline"
          >
            <TrailAiMark className="h-3.5 w-3.5" />
            See full plan comparison
          </Link>
        </div>
      </div>
    </div>
  );
}

/** True when an AI error is a free-tier quota block. */
export function isAiQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "AI_QUOTA_EXCEEDED";
}
