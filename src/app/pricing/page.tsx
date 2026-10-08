"use client";

import { Show } from "@clerk/nextjs";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AiQuotaBanner, useAiQuota } from "@/components/ai-quota-banner";
import { PaystackUpgradeButton } from "@/components/paystack-upgrade-button";
import {
  AI_CAPS,
  FREE_AI_QUOTA,
  TRAIL_PLUS_DAILY_CAP,
  TRAIL_PLUS_MONTHLY_CAP,
  TRAIL_PLUS_PRICE_USD,
} from "@/lib/ai/quota";

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
  "Guide, Planner, and Stay & Eat",
];

function BillingNotice() {
  const params = useSearchParams();
  const billing = params.get("billing");
  if (!billing) return null;

  const messages: Record<string, { ok: boolean; text: string }> = {
    success: {
      ok: true,
      text: "Trail Plus is active. Higher fair-use AI limits are unlocked.",
    },
    failed: {
      ok: false,
      text: "Payment was not completed. You can try again when ready.",
    },
    error: {
      ok: false,
      text: "We could not confirm the payment. Contact support if you were charged.",
    },
    missing_ref: { ok: false, text: "Missing payment reference." },
    missing_user: {
      ok: false,
      text: "Payment succeeded but we could not link it to your account.",
    },
    not_configured: {
      ok: false,
      text: "Checkout is not available yet. Please try again later.",
    },
  };

  const msg = messages[billing];
  if (!msg) return null;

  return (
    <div
      className={
        msg.ok
          ? "mt-6 rounded-2xl border border-aqua/40 bg-aqua/10 px-4 py-3 text-sm text-ocean-deep"
          : "mt-6 rounded-2xl border border-coral/35 bg-coral/10 px-4 py-3 text-sm text-ocean-deep"
      }
    >
      {msg.text}
    </div>
  );
}

function PricingContent() {
  const { quota, refresh } = useAiQuota();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("billing") === "success") void refresh();
  }, [params, refresh]);

  const isPlus = quota?.plan === "trail_plus";

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
          Pricing
        </p>
        <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
          Simple plans for Kenya travel AI
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Start free with {FREE_AI_QUOTA} AI queries a month. Upgrade to Trail
          Plus for ${TRAIL_PLUS_PRICE_USD}/month for higher fair-use limits on
          Guide, Planner, and Stay &amp; Eat.
        </p>

        <BillingNotice />

        <Show when="signed-in">
          <div className="mt-8 max-w-lg">
            <AiQuotaBanner quota={quota} />
          </div>
        </Show>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Free
            </p>
            <p className="mt-2 font-display text-4xl text-ocean-deep">
              $0
              <span className="text-lg font-normal text-muted">/mo</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              Try the platform with a monthly AI allowance.
            </p>
            <ul className="mt-6 space-y-2.5">
              {freeFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-ocean-deep"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                  {f}
                </li>
              ))}
            </ul>
            <Show
              when="signed-out"
              fallback={
                <Link href="/guide" className="btn-outline mt-8 w-full">
                  Continue free
                </Link>
              }
            >
              <Link href="/sign-up" className="btn-outline mt-8 w-full">
                Create free account
              </Link>
            </Show>
          </div>

          <div className="rounded-md border border-brand-deep bg-brand-deep p-6 text-on-brand sm:p-8">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-aqua">
              <Sparkles className="h-3.5 w-3.5" />
              Trail Plus
            </p>
            <p className="mt-2 font-display text-4xl text-on-brand">
              ${TRAIL_PLUS_PRICE_USD}
              <span className="text-lg font-normal text-on-brand/65">/mo</span>
            </p>
            <p className="mt-2 text-sm text-on-brand/75">
              Higher fair-use AI across Guide, Planner, and Stay &amp; Eat.
            </p>
            <ul className="mt-6 space-y-2.5">
              {plusFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-on-brand/90"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {isPlus ? (
                <p className="rounded-md border border-on-brand/30 bg-on-brand/10 px-5 py-3 text-center text-sm font-semibold text-on-brand">
                  You are on Trail Plus
                </p>
              ) : (
                <Show
                  when="signed-in"
                  fallback={
                    <Link
                      href="/sign-in?redirect_url=/pricing"
                      className="btn-solid w-full"
                    >
                      Sign in to upgrade
                    </Link>
                  }
                >
                  <PaystackUpgradeButton />
                </Show>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          After a successful payment, Trail Plus unlocks for 30 days and renews
          when you stay subscribed.
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-16 text-muted">
          Loading pricing…
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
