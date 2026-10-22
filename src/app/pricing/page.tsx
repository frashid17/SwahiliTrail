"use client";

import { Show } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AiQuotaBanner, useAiQuota } from "@/components/ai-quota-banner";
import { PaymentReceipt } from "@/components/motion/payment-receipt";
import { PaystackUpgradeButton } from "@/components/paystack-upgrade-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TrailAiMark } from "@/components/ui/trail-ai-mark";
import {
  AI_CAPS,
  FREE_AI_QUOTA,
  TRAIL_PLUS_DAILY_CAP,
  TRAIL_PLUS_MONTHLY_CAP,
  TRAIL_PLUS_PRICE_USD,
} from "@/lib/ai/quota";
import { cn } from "@/lib/utils";

const freeFeatures = [
  `${FREE_AI_QUOTA} AI uses per month`,
  `Abuse caps: ${AI_CAPS.free.perMinute}/min · ${AI_CAPS.free.perHour}/hour`,
  "Guide, Planner, and Stay & Eat",
  "Explore places and events",
];

const plusFeatures = [
  `Up to ${TRAIL_PLUS_DAILY_CAP} AI uses per day`,
  `Up to ${TRAIL_PLUS_MONTHLY_CAP} AI uses per month`,
  `Burst protection: ${AI_CAPS.trail_plus.perMinute}/min · ${AI_CAPS.trail_plus.perHour}/hour`,
  "Priority fair-use across Guide, Planner, Stay & Eat",
];

const cardVariants = {
  hidden: { opacity: 0, y: 56 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.14,
      duration: 0.55,
      ease: "easeOut" as const,
    },
  }),
};

function BillingNotice() {
  const params = useSearchParams();
  const billing = params.get("billing");
  if (!billing) return null;

  const messages: Record<string, { ok: boolean; text: string }> = {
    success: {
      ok: true,
      text: "Payment confirmed. Trail Plus is active - sign in if you were logged out during checkout.",
    },
    pending_confirm: {
      ok: true,
      text: "Payment received. We are confirming with the bank - this page will refresh your plan shortly. Sign in if needed.",
    },
    failed: {
      ok: false,
      text: "Payment was not completed. You can try again when ready - we will reuse the same checkout reference.",
    },
    error: {
      ok: false,
      text: "We could not confirm the payment yet. If you were charged, sign in and refresh - or contact support with your receipt.",
    },
    missing_ref: { ok: false, text: "Missing payment reference." },
    missing_user: {
      ok: false,
      text: "Payment succeeded but we could not link it to your account. Contact support with your Paystack receipt.",
    },
    not_configured: {
      ok: false,
      text: "Checkout is not available yet. Please try again later.",
    },
  };

  const msg = messages[billing];
  if (!msg) return null;

  if (billing === "success" || billing === "pending_confirm") {
    return (
      <div className="mt-8 space-y-4">
        <PaymentReceipt
          planLabel="Trail Plus"
          amountFormatted={`≈ $${TRAIL_PLUS_PRICE_USD}`}
        />
        <div className="border border-aqua/35 bg-aqua/10 px-4 py-3 text-sm text-ocean-deep">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        msg.ok
          ? "mt-8 border border-aqua/35 bg-aqua/10 px-4 py-3 text-sm text-ocean-deep"
          : "mt-8 border border-coral/35 bg-coral/10 px-4 py-3 text-sm text-ocean-deep"
      }
    >
      {msg.text}
    </div>
  );
}

function FeatureList({
  features,
  onDark = false,
}: {
  features: string[];
  onDark?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => (
        <li
          key={feature}
          className={cn(
            "flex items-start gap-3 text-sm sm:text-base",
            onDark ? "text-on-brand/90" : "text-ocean-deep",
          )}
        >
          <Check
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              onDark ? "text-aqua" : "text-coral",
            )}
            aria-hidden
          />
          {feature}
        </li>
      ))}
    </ul>
  );
}

function PricingContent() {
  const { quota, refresh } = useAiQuota();
  const params = useSearchParams();

  useEffect(() => {
    const billing = params.get("billing");
    const reference = params.get("ref");
    if (
      !reference ||
      (billing !== "success" &&
        billing !== "pending_confirm" &&
        billing !== "error")
    ) {
      if (billing === "success") void refresh();
      return;
    }

    let cancelled = false;
    async function reconcile() {
      try {
        const res = await fetch("/api/billing/paystack/reconcile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        if (!cancelled && res.ok) await refresh();
      } catch {
        /* webhook may still settle */
      }
    }
    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [params, refresh]);

  const isPlus = quota?.plan === "trail_plus";

  return (
    <div className="paper-grain coastal-grid min-h-[80vh] overflow-x-clip">
      <section className="relative overflow-hidden border-b border-border/80">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,color-mix(in_oklab,var(--sand)_55%,transparent),transparent_48%),radial-gradient(ellipse_at_88%_20%,color-mix(in_oklab,var(--aqua)_14%,transparent),transparent_42%)]"
        />
        <div className="relative mx-auto max-w-[90rem] px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-10">
          <Badge
            variant="outline"
            className="inline-flex h-auto items-center gap-2 border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold"
          >
            <TrailAiMark className="h-3.5 w-3.5 text-gold" />
            Pricing
          </Badge>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[0.98] tracking-tight text-ocean-deep">
            Pick the plan that fits your Kenya itinerary
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Free gets you started. Trail Plus raises fair-use limits on Guide,
            Planner, and Stay &amp; Eat for 30 days - M-Pesa or card.
          </p>

          <BillingNotice />

          <Show when="signed-in">
            <div className="mt-8 max-w-lg">
              <AiQuotaBanner quota={quota} />
            </div>
          </Show>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="flex flex-col items-stretch justify-center gap-6 lg:flex-row">
          <motion.article
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="relative w-full grow overflow-hidden rounded-2xl bg-brand-deep text-on-brand ring-1 ring-brand-deep/40 lg:max-w-xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,color-mix(in_oklab,var(--aqua)_28%,transparent),transparent_45%)]"
            />
            <div className="relative flex h-full flex-col gap-8 p-7 sm:flex-row sm:gap-10 sm:p-10">
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <p className="inline-flex w-fit items-center gap-2 rounded-full bg-on-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua">
                    <TrailAiMark className="h-3.5 w-3.5 text-aqua" />
                    Trail Plus
                  </p>
                  <p className="max-w-xs text-sm leading-relaxed text-on-brand/70">
                    Higher fair-use AI when you are deep in a Kenya itinerary.
                    Pay with M-Pesa or card; renew when the period ends.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="font-display text-5xl tracking-tight sm:text-6xl">
                    ${TRAIL_PLUS_PRICE_USD}
                    <span className="ml-1 text-base font-normal text-on-brand/55">
                      /mo
                    </span>
                  </p>
                  {isPlus ? (
                    <p className="border border-on-brand/25 bg-on-brand/10 px-5 py-3 text-center text-sm font-semibold text-on-brand">
                      You are on Trail Plus
                    </p>
                  ) : (
                    <Show
                      when="signed-in"
                      fallback={
                        <ButtonLink
                          href="/sign-in?redirect_url=/pricing"
                          variant="solid"
                          className="w-full sm:w-fit"
                        >
                          Sign in to upgrade
                        </ButtonLink>
                      }
                    >
                      <PaystackUpgradeButton className="sm:w-fit" />
                    </Show>
                  )}
                  <p className="text-[11px] leading-snug text-on-brand/50">
                    30-day access · extend anytime
                  </p>
                </div>
              </div>

              <div
                aria-hidden
                className="hidden w-px shrink-0 bg-on-brand/15 sm:block"
              />
              <div className="h-px w-full bg-on-brand/15 sm:hidden" />

              <div className="flex min-w-[11rem] flex-1 flex-col gap-3">
                <p className="text-base font-medium text-on-brand sm:text-xl">
                  Features
                </p>
                <FeatureList features={plusFeatures} onDark />
              </div>
            </div>
          </motion.article>

          <motion.article
            custom={1}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="w-full grow overflow-hidden rounded-2xl bg-sand/45 ring-1 ring-border lg:max-w-xl"
          >
            <div className="relative flex h-full flex-col gap-8 p-7 sm:flex-row sm:gap-10 sm:p-10">
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <p className="inline-flex w-fit rounded-full bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted ring-1 ring-border">
                    Free trail
                  </p>
                  <p className="max-w-xs text-sm leading-relaxed text-muted">
                    Enough AI to plan a weekend - Guide, Planner, Stay &amp; Eat
                    included.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="font-display text-5xl tracking-tight text-ocean-deep sm:text-6xl">
                    $0
                    <span className="ml-1 text-base font-normal text-muted">
                      /mo
                    </span>
                  </p>
                  <Show
                    when="signed-out"
                    fallback={
                      <ButtonLink
                        href="/guide"
                        variant="outline"
                        className="w-full sm:w-fit"
                      >
                        Continue free
                      </ButtonLink>
                    }
                  >
                    <ButtonLink
                      href="/sign-up"
                      variant="outline"
                      className="w-full sm:w-fit"
                    >
                      Create free account
                    </ButtonLink>
                  </Show>
                </div>
              </div>

              <div
                aria-hidden
                className="hidden w-px shrink-0 bg-border sm:block"
              />
              <div className="h-px w-full bg-border sm:hidden" />

              <div className="flex min-w-[11rem] flex-1 flex-col gap-3">
                <p className="text-base font-medium text-ocean-deep sm:text-xl">
                  Features
                </p>
                <FeatureList features={freeFeatures} />
              </div>
            </div>
          </motion.article>
        </div>

        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted">
          Trail Plus unlocks for 30 days after payment (M-Pesa or card). Paying
          again extends your period. Card auto-renew only when Paystack can save
          a reusable card authorization.{" "}
          <Link href="/account?tab=billing" className="font-semibold text-ocean">
            Manage billing
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[90rem] px-4 py-16 text-muted lg:px-10">
          Loading pricing…
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
