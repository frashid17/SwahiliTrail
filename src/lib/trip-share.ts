import type { CarHire } from "@/lib/data/car-hires";
import { planToPlainText } from "@/lib/plan-export";
import { asPlainText } from "@/lib/plan-normalize";
import type { SavedPlan } from "@/lib/saved-trips";

export type ShareableTripPayload = {
  plan: SavedPlan;
  startDate: string;
  partySize: number;
  transportMode?: string;
  companions?: string;
  budget?: string;
  tripId?: string;
};

export function appOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://swahilitrail.com"
  );
}

export function sharePageUrl(token: string) {
  return `${appOrigin()}/s/${token}`;
}

export function buildTripShareText(
  payload: ShareableTripPayload,
  shareUrl?: string,
) {
  const body = planToPlainText(payload.plan, {
    startDate: payload.startDate,
    partySize: payload.partySize,
    transportLabel: payload.transportMode,
  });
  const cta = shareUrl
    ? `\n\nView the full plan & request a local operator quote: ${shareUrl}`
    : "\n\nPlanned with Swahili Trail";
  // WhatsApp has practical length limits; keep a punchy summary + link when sharing.
  if (shareUrl) {
    const budget = payload.plan.budgetBreakdown?.totalKes
      ? `~KES ${payload.plan.budgetBreakdown.totalKes.toLocaleString()}`
      : "";
    return [
      `🌴 ${payload.plan.title}`,
      payload.plan.summary.slice(0, 220),
      `Dates: ${payload.startDate} · ${payload.plan.days.length} days · ${payload.partySize} travelers`,
      budget ? `Est. budget: ${budget}` : "",
      `Stay idea: ${asPlainText(payload.plan.recommendedStay)}`,
      "",
      `Open the full plan (request a local operator quote): ${shareUrl}`,
      "",
      "via Swahili Trail",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return body + cta;
}

export function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function makeShareToken() {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `st_${rand.slice(0, 16)}`;
}

export type ShareCreateBody = ShareableTripPayload & {
  carHires?: CarHire[];
};
