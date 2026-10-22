"use client";

import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Calendar,
  Check,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AiTypingPanel } from "@/components/ai-typing-panel";
import { TripSharePanel } from "@/components/trip/trip-share-panel";
import { TrailAiMark } from "@/components/ui/trail-ai-mark";
import {
  consumeAiNdjsonStream,
  extractStreamingJsonString,
} from "@/lib/ai/ndjson-stream";
import {
  carHiresForMode,
  type TransportMode,
} from "@/lib/data/car-hires";
import {
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  planToIcs,
} from "@/lib/plan-export";
import { downloadTripPdf } from "@/lib/plan-pdf";
import {
  addSavedTrip,
  removeSavedTrip,
  syncSavedTripsFromCloud,
  type PlanPlaceLink,
  type SavedTrip,
} from "@/lib/saved-trips";
import {
  clearTripCart,
  loadTripCart,
  removeTripItem,
  type TripCartItem,
} from "@/lib/trip-cart";
import {
  AiQuotaBanner,
  aiQuotaErrorMessage,
  useAiQuota,
} from "@/components/ai-quota-banner";
import {
  WorkspaceEmpty,
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceSectionLabel,
  WorkspaceStage,
} from "@/components/workspace/workspace-frame";
import type { AiQuotaStatus } from "@/lib/ai/quota";
import {
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
} from "@/lib/maps-link";
import { asPlainText } from "@/lib/plan-normalize";
import {
  clearPlannerDraft,
  loadPlannerDraft,
  savePlannerDraft,
} from "@/lib/planner-draft";
import {
  defaultTripStops,
  formatStopsSummary,
  MAX_STOP_DAYS,
  MAX_TRIP_DAYS,
  MAX_TRIP_STOPS,
  STOP_LOCATIONS,
  sumStopDays,
  type TripStop,
} from "@/lib/trip-stops";
import { cn } from "@/lib/utils";

const interestOptions = [
  "Wildlife & safari",
  "Beaches & coast",
  "Culture & heritage",
  "Nairobi city",
  "Rift Valley lakes",
  "Mountains & hiking",
  "Food & local cuisine",
  "Photography",
  "Family activities",
];

const transportOptions: {
  value: TransportMode;
  label: string;
  hint: string;
}[] = [
  {
    value: "none",
    label: "No hire",
    hint: "Uber, Bolt, taxis & walking",
  },
  {
    value: "airport-pickup",
    label: "Airport pickup",
    hint: "Moi International (MBA) transfer",
  },
  {
    value: "car-hire",
    label: "Self-drive",
    hint: "Hire a car for the trip",
  },
  {
    value: "chauffeur",
    label: "Car + driver",
    hint: "Chauffeur for daily touring",
  },
  {
    value: "airport-and-car",
    label: "Pickup + hire",
    hint: "Airport transfer and car for days",
  },
];

type DayPlan = {
  day: number;
  theme: string;
  location?: string;
  morning: string;
  afternoon: string;
  evening: string;
  foodTip: string;
  transportTip: string;
  estimatedDayCostKes: number;
  localIntel?: string;
  timingNote?: string;
  insiderTip?: string;
  places?: PlanPlaceLink[];
};

type Plan = {
  title: string;
  summary: string;
  recommendedStay: string;
  days: DayPlan[];
  packingTips: string[];
  localEtiquette: string[];
  budgetBreakdown: {
    lodgingKes: number;
    activitiesKes: number;
    foodKes: number;
    transportKes: number;
    contingencyKes: number;
    totalKes: number;
    notes: string;
  };
  stops?: TripStop[];
};

function typeLabel(type: TripCartItem["type"]) {
  switch (type) {
    case "attraction":
      return "Attraction";
    case "wildlife":
      return "Wildlife";
    case "hotel":
      return "Stay";
    case "restaurant":
      return "Eat";
  }
}

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function PlannerPage() {
  const { userId, isLoaded } = useAuth();
  const { quota, applyQuota } = useAiQuota();
  const [stops, setStops] = useState<TripStop[]>(defaultTripStops);
  const [interests, setInterests] = useState<string[]>([
    "Wildlife & safari",
    "Culture & heritage",
    "Beaches & coast",
  ]);
  const [budget, setBudget] = useState<"budget" | "mid" | "luxury">("mid");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">(
    "balanced",
  );
  const [companions, setCompanions] = useState<
    "solo" | "couple" | "family" | "friends"
  >("family");
  const [partySize, setPartySize] = useState(3);
  const [transportMode, setTransportMode] =
    useState<TransportMode>("airport-pickup");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [cart, setCart] = useState<TripCartItem[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [streamDraft, setStreamDraft] = useState<{
    title: string;
    summary: string;
    stay: string;
  } | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    setCart(loadTripCart(userId));
    void syncSavedTripsFromCloud(userId).then(setSavedTrips);
    const draft = loadPlannerDraft(userId);
    if (!draft) return;
    setPlan(draft.plan);
    if (draft.stops?.length) setStops(draft.stops);
    if (draft.interests?.length) setInterests(draft.interests);
    if (draft.budget) setBudget(draft.budget);
    if (draft.pace) setPace(draft.pace);
    if (draft.companions) setCompanions(draft.companions);
    if (draft.partySize) setPartySize(draft.partySize);
    if (draft.transportMode) setTransportMode(draft.transportMode);
    if (draft.startDate) setStartDate(draft.startDate);
    setDraftRestoredAt(draft.savedAt);
  }, [isLoaded, userId]);

  function persistDraft(nextPlan: Plan) {
    if (!userId) return;
    const savedAt = new Date().toISOString();
    savePlannerDraft(userId, {
      plan: nextPlan,
      stops,
      interests,
      budget,
      pace,
      companions,
      partySize,
      transportMode,
      startDate,
      savedAt,
    });
    setDraftRestoredAt(savedAt);
  }

  const suggestedHires = useMemo(
    () => carHiresForMode(transportMode).slice(0, 4),
    [transportMode],
  );

  const days = sumStopDays(stops);
  const routeSummary = formatStopsSummary(stops);
  const canAddStop =
    stops.length < MAX_TRIP_STOPS && days < MAX_TRIP_DAYS;

  const transportLabel =
    transportOptions.find((t) => t.value === transportMode)?.label ?? "Transport";

  const alreadySaved =
    !!plan &&
    savedTrips.some((t) => t.plan.title === plan.title && t.days === days);

  function updateStop(index: number, patch: Partial<TripStop>) {
    setStops((prev) => {
      const others = sumStopDays(prev.filter((_, i) => i !== index));
      const maxForThis = Math.min(
        MAX_STOP_DAYS,
        Math.max(1, MAX_TRIP_DAYS - others),
      );
      return prev.map((stop, i) => {
        if (i !== index) return stop;
        const next = { ...stop, ...patch };
        next.days = Math.min(
          maxForThis,
          Math.max(1, Number(next.days) || 1),
        );
        return next;
      });
    });
  }

  function addStop() {
    if (!canAddStop) return;
    const remaining = Math.max(1, Math.min(MAX_STOP_DAYS, MAX_TRIP_DAYS - days));
    const used = new Set(stops.map((s) => s.location));
    const nextLocation =
      STOP_LOCATIONS.find((a) => !used.has(a.value))?.value ??
      STOP_LOCATIONS[0]?.value ??
      "Nairobi";
    setStops((prev) => [...prev, { location: nextLocation, days: remaining }]);
  }

  function removeStop(index: number) {
    setStops((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function moveStop(index: number, direction: -1 | 1) {
    setStops((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : prev.length < 6
          ? [...prev, value]
          : prev,
    );
  }

  function removeFromCart(item: TripCartItem) {
    if (!userId) return;
    setCart(removeTripItem(userId, item.id, item.type));
  }

  function clearCart() {
    if (!userId) return;
    clearTripCart(userId);
    setCart([]);
  }

  async function generate() {
    if (days < 1 || days > MAX_TRIP_DAYS) {
      setError(`Total days must be between 1 and ${MAX_TRIP_DAYS}.`);
      return;
    }
    setLoading(true);
    setError(null);
    setSaveNote(null);
    setShowCalendarMenu(false);
    setPlan(null);
    setStreamDraft({ title: "", summary: "", stay: "" });
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          stops,
          interests,
          budget,
          pace,
          companions,
          partySize,
          transportMode,
          cart,
        }),
      });
      const data = await consumeAiNdjsonStream<{
        type: "done";
        plan: Plan;
        quota?: AiQuotaStatus;
      }>(res, {
        onDelta: (_chunk, full) => {
          setStreamDraft({
            title: extractStreamingJsonString(full, "title") ?? "",
            summary: extractStreamingJsonString(full, "summary") ?? "",
            stay: extractStreamingJsonString(full, "recommendedStay") ?? "",
          });
        },
      });
      if (data.quota) applyQuota(data.quota);
      const nextPlan = { ...data.plan, stops: data.plan.stops ?? stops };
      setPlan(nextPlan);
      persistDraft(nextPlan);
      setStreamDraft(null);
    } catch (err) {
      const payload =
        err && typeof err === "object"
          ? (err as {
              error?: string;
              message?: string;
              code?: string;
              priceUsdPerMonth?: number;
            })
          : {};
      setError(
        payload.code
          ? aiQuotaErrorMessage(payload)
          : payload.message || payload.error || "Something went wrong",
      );
      setStreamDraft(null);
    } finally {
      setLoading(false);
    }
  }

  function addToMyTrips() {
    if (!userId || !plan) {
      setSaveNote("Sign in to save trips.");
      return;
    }
    if (alreadySaved) {
      setSaveNote("This plan is already in My Trips.");
      return;
    }
    const next = addSavedTrip(userId, {
      startDate,
      days,
      partySize,
      companions,
      budget,
      transportMode,
      plan: { ...plan, stops: plan.stops ?? stops },
    });
    setSavedTrips(next);
    setSaveNote("Saved to My Trips.");
  }

  function deleteSaved(id: string) {
    if (!userId) return;
    setSavedTrips(removeSavedTrip(userId, id));
  }

  function downloadPlan() {
    if (!plan) return;
    const slug = plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
    downloadTripPdf(
      plan,
      {
        startDate,
        partySize,
        transportLabel,
        carHires: suggestedHires,
      },
      `${slug || "mombasa-trip"}.pdf`,
    );
  }

  function downloadAppleCalendar() {
    if (!plan) return;
    const ics = planToIcs(plan, new Date(startDate), { transportLabel });
    downloadIcs("swahili-trail-trip.ics", ics);
    setShowCalendarMenu(false);
  }

  function openGoogleCalendar() {
    if (!plan) return;
    window.open(googleCalendarUrl(plan, new Date(startDate)), "_blank");
    setShowCalendarMenu(false);
  }

  function openOutlookCalendar() {
    if (!plan) return;
    window.open(outlookCalendarUrl(plan, new Date(startDate)), "_blank");
    setShowCalendarMenu(false);
  }

  return (
    <WorkspaceFrame>
      <WorkspacePanel>
          <div className="space-y-4">
            <WorkspaceHeader
              eyebrow="Trip Planner"
              title="Plan days in Kenya"
              description={
                <>
                  <span className="lg:hidden">
                    Set days, stay, and transport. The plan writes below.
                  </span>
                  <span className="hidden lg:inline">
                    Configure on the left - your itinerary appears on the right.
                  </span>
                </>
              }
            />

            <AiQuotaBanner quota={quota} />

            <WorkspaceSectionLabel step="1">Wishlist</WorkspaceSectionLabel>
            <div className="rounded-xl border border-border/80 bg-foam/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ocean-deep">
                  Wishlist ({cart.length})
                </p>
                {cart.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center gap-1 text-xs font-medium text-coral"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </button>
                ) : null}
              </div>
              {cart.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Add from{" "}
                  <Link href="/attractions" className="font-semibold text-ocean">
                    Attractions
                  </Link>
                  ,{" "}
                  <Link href="/wildlife" className="font-semibold text-ocean">
                    Wildlife
                  </Link>
                  , or{" "}
                  <Link href="/hotels" className="font-semibold text-ocean">
                    Stay & Eat
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
                  {cart.map((item) => (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="flex items-start justify-between gap-2 rounded-xl bg-surface px-2.5 py-1.5"
                    >
                      <div>
                        <p className="text-xs font-medium text-ocean-deep">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {typeLabel(item.type)} · {item.area}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item)}
                        className="text-muted hover:text-coral"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <WorkspaceSectionLabel step="2">Trip basics</WorkspaceSectionLabel>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">Trip start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2.5 text-ocean-deep [color-scheme:light] dark:[color-scheme:dark]"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ocean-deep">
                    Places & nights
                  </p>
                  <p className="text-xs text-muted">
                    Add stops in visit order · {days} day
                    {days === 1 ? "" : "s"} total
                    {days > MAX_TRIP_DAYS ? ` (max ${MAX_TRIP_DAYS})` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStop}
                  disabled={!canAddStop}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-foam px-2.5 py-1 text-[11px] font-semibold text-ocean-deep transition hover:border-aqua/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                  Add stop
                </button>
              </div>

              <ul className="space-y-2">
                {stops.map((stop, index) => {
                  const area = STOP_LOCATIONS.find(
                    (a) => a.value === stop.location,
                  );
                  return (
                    <li
                      key={`${stop.location}-${index}`}
                      className="rounded-xl border border-border bg-surface p-2.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foam text-[11px] font-bold text-ocean">
                          {index + 1}
                        </span>
                        <select
                          value={stop.location}
                          onChange={(e) =>
                            updateStop(index, { location: e.target.value })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-border bg-foam px-2 py-1.5 text-sm text-ocean-deep"
                          aria-label={`Stop ${index + 1} location`}
                        >
                          {STOP_LOCATIONS.map((loc) => (
                            <option key={loc.value} value={loc.value}>
                              {loc.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex shrink-0 items-center gap-1 text-xs text-muted">
                          <span className="sr-only">Days</span>
                          <input
                            type="number"
                            min={1}
                            max={MAX_STOP_DAYS}
                            value={stop.days}
                            onChange={(e) =>
                              updateStop(index, {
                                days: Number(e.target.value),
                              })
                            }
                            className="w-12 rounded-lg border border-border bg-foam px-1.5 py-1.5 text-center text-sm font-semibold text-ocean-deep"
                          />
                          d
                        </label>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] text-muted">
                          {area?.hint ?? "Kenya stop"}
                        </p>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveStop(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1 text-muted hover:bg-foam hover:text-ocean-deep disabled:opacity-30"
                            aria-label="Move stop up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStop(index, 1)}
                            disabled={index === stops.length - 1}
                            className="rounded p-1 text-muted hover:bg-foam hover:text-ocean-deep disabled:opacity-30"
                            aria-label="Move stop down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            disabled={stops.length <= 1}
                            className="rounded p-1 text-muted hover:bg-foam hover:text-coral disabled:opacity-30"
                            aria-label="Remove stop"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] text-muted">
                Route: {routeSummary}
              </p>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">
                Party size: {partySize}
              </span>
              <input
                type="range"
                min={1}
                max={12}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="mt-2 w-full accent-coral"
              />
            </label>

            <WorkspaceSectionLabel step="3">Transport</WorkspaceSectionLabel>
            <div>
              <div className="flex flex-wrap gap-1.5">
                {transportOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.hint}
                    onClick={() => setTransportMode(option.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                      transportMode === option.value
                        ? "bg-brand-deep text-on-brand"
                        : "bg-foam text-muted hover:bg-sand hover:text-ocean-deep",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {transportOptions.find((o) => o.value === transportMode)?.hint}
              </p>
              {suggestedHires.length > 0 ? (
                <div className="mt-2 space-y-1.5 rounded-xl bg-foam p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-aqua">
                    Authentic operators
                  </p>
                  {suggestedHires.map((hire) => (
                    <div
                      key={hire.id}
                      className="rounded-lg bg-surface px-2.5 py-2 text-xs"
                    >
                      <p className="font-semibold text-ocean-deep">{hire.name}</p>
                      <a
                        href={`tel:${hire.phone}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-muted hover:text-ocean"
                      >
                        <Phone className="h-3 w-3" />
                        {hire.phoneDisplay}
                      </a>
                      <a
                        href={hire.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 flex items-center gap-1 font-medium text-ocean"
                      >
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <WorkspaceSectionLabel step="4">Interests & budget</WorkspaceSectionLabel>
            <div>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((option) => {
                  const active = interests.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleInterest(option)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "bg-coral text-white"
                          : "bg-foam text-muted hover:bg-sand hover:text-ocean-deep",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["budget", "Budget"],
                  ["mid", "Mid"],
                  ["luxury", "Luxury"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBudget(value)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-xs font-semibold transition",
                    budget === value
                      ? "border-brand-deep bg-brand-deep text-on-brand"
                      : "border-border bg-foam text-ocean-deep hover:border-gold/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                <span className="font-medium text-ocean-deep">Pace</span>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value as typeof pace)}
                  className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2 text-sm"
                >
                  <option value="relaxed">Relaxed</option>
                  <option value="balanced">Balanced</option>
                  <option value="packed">Packed</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="font-medium text-ocean-deep">Companions</span>
                <select
                  value={companions}
                  onChange={(e) =>
                    setCompanions(e.target.value as typeof companions)
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2 text-sm"
                >
                  <option value="solo">Solo</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void generate()}
              disabled={
                loading ||
                interests.length === 0 ||
                (quota != null && (quota.remaining ?? 0) <= 0)
              }
              className="btn-solid w-full disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrailAiMark className="h-4 w-4" />
              )}
              {loading ? "Writing your trip…" : "Generate full trip + budget"}
            </button>
            {error ? <p className="text-sm text-coral">{error}</p> : null}

            <div className="rounded-2xl border border-border bg-foam/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ocean-deep">
                  My Trips ({savedTrips.length})
                </p>
                <Link
                  href="/trips"
                  className="text-xs font-semibold text-ocean"
                >
                  View all
                </Link>
              </div>
              {savedTrips.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  After you generate a plan, tap Add to My Trips. Saved schedules
                  also appear on the{" "}
                  <Link href="/trips" className="font-semibold text-ocean">
                    My Trips
                  </Link>{" "}
                  page.
                </p>
              ) : (
                <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                  {savedTrips.map((trip) => (
                    <li
                      key={trip.id}
                      className="flex items-start justify-between gap-2 rounded-xl bg-surface px-2.5 py-2"
                    >
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => {
                          const nextStops = trip.plan.stops?.length
                            ? trip.plan.stops
                            : [
                                {
                                  location: "Nairobi",
                                  days: trip.days,
                                },
                              ];
                          setPlan(trip.plan);
                          setStops(nextStops);
                          setPartySize(trip.partySize);
                          setStartDate(trip.startDate);
                          setTransportMode(
                            trip.transportMode as TransportMode,
                          );
                          setSaveNote(null);
                          if (userId) {
                            const savedAt = new Date().toISOString();
                            savePlannerDraft(userId, {
                              plan: trip.plan,
                              stops: nextStops,
                              interests,
                              budget,
                              pace,
                              companions,
                              partySize: trip.partySize,
                              transportMode:
                                trip.transportMode as TransportMode,
                              startDate: trip.startDate,
                              savedAt,
                            });
                            setDraftRestoredAt(savedAt);
                          }
                        }}
                      >
                        <p className="truncate text-xs font-semibold text-ocean-deep">
                          {trip.plan.title}
                        </p>
                        <p className="text-[11px] text-muted">
                          {trip.days} days · starts {trip.startDate}
                          {trip.plan.stops && trip.plan.stops.length > 1
                            ? ` · ${trip.plan.stops.length} stops`
                            : ""}
                          {trip.status === "completed" ? " · done" : ""}
                        </p>
                      </button>
                      <Link
                        href={`/trips/${trip.id}`}
                        className="shrink-0 text-[11px] font-semibold text-ocean"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteSaved(trip.id)}
                        className="text-muted hover:text-coral"
                        aria-label="Delete saved trip"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      </WorkspacePanel>

      <WorkspaceStage>
          <div className="relative z-[1] flex flex-col p-3 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            {loading && streamDraft ? (
              <div className="space-y-4">
                <AiTypingPanel
                  title="Writing your itinerary"
                  text={[
                    streamDraft.title && `Title: ${streamDraft.title}`,
                    streamDraft.summary && `\n${streamDraft.summary}`,
                    streamDraft.stay && `\nStay: ${streamDraft.stay}`,
                  ]
                    .filter(Boolean)
                    .join("")}
                />
                <p className="text-xs text-muted">
                  Days and budget fill in as the draft finishes…
                </p>
              </div>
            ) : !plan ? (
              <WorkspaceEmpty
                title="Your itinerary appears here"
                body="Set stops, transport, and interests — then generate. Swahili Trail builds operator-style days with named places, Maps links, local intel, and a KES damage estimate."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:rounded-3xl sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl text-ocean-deep sm:text-3xl">
                        {plan.title}
                      </h2>
                      {draftRestoredAt ? (
                        <p className="mt-1 text-[11px] text-muted">
                          Draft kept on this device · restored{" "}
                          {new Date(draftRestoredAt).toLocaleString("en-KE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          <button
                            type="button"
                            className="font-semibold text-coral underline-offset-2 hover:underline"
                            onClick={() => {
                              if (!userId) return;
                              clearPlannerDraft(userId);
                              setPlan(null);
                              setDraftRestoredAt(null);
                            }}
                          >
                            Clear draft
                          </button>
                        </p>
                      ) : null}
                      <p className="mt-2 text-muted">{plan.summary}</p>
                      <p className="mt-3 rounded-2xl bg-foam px-4 py-3 text-sm text-ocean-deep">
                        <span className="font-semibold">Recommended stay:</span>{" "}
                        {asPlainText(plan.recommendedStay)}
                      </p>
                      {(plan.stops ?? stops).length > 0 ? (
                        <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-muted">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aqua" />
                          <span>
                            Route:{" "}
                            {formatStopsSummary(plan.stops ?? stops)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addToMyTrips}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold",
                          alreadySaved
                            ? "bg-ocean text-on-brand"
                            : "bg-coral text-white",
                        )}
                      >
                        {alreadySaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                        {alreadySaved ? "In My Trips" : "Add to My Trips"}
                      </button>
                      <TripSharePanel
                        compact
                        payload={{
                          plan,
                          startDate,
                          partySize,
                          transportMode: transportLabel,
                        }}
                      />
                      <button
                        type="button"
                        onClick={downloadPlan}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                      >
                        <Download className="h-4 w-4" />
                        PDF only
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCalendarMenu((v) => !v)}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                        >
                          <Calendar className="h-4 w-4" />
                          Add to calendar
                        </button>
                        {showCalendarMenu ? (
                          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
                            <button
                              type="button"
                              onClick={openGoogleCalendar}
                              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-foam"
                            >
                              Google Calendar
                            </button>
                            <button
                              type="button"
                              onClick={downloadAppleCalendar}
                              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-foam"
                            >
                              Apple Calendar (.ics)
                            </button>
                            <button
                              type="button"
                              onClick={openOutlookCalendar}
                              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-foam"
                            >
                              Outlook Calendar
                            </button>
                            <button
                              type="button"
                              onClick={downloadAppleCalendar}
                              className="block w-full border-t border-border px-4 py-2.5 text-left text-sm text-muted hover:bg-foam"
                            >
                              Other apps (.ics)
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {saveNote ? (
                    <p className="mt-3 text-sm text-aqua">
                      {saveNote}{" "}
                      <Link href="/trips" className="font-semibold underline">
                        Open My Trips
                      </Link>
                    </p>
                  ) : null}
                </div>

                {suggestedHires.length > 0 ? (
                  <div className="rounded-3xl border border-border bg-surface p-5">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aqua">
                      <Plane className="h-3.5 w-3.5" />
                      {transportLabel} contacts
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {suggestedHires.map((hire) => (
                        <div
                          key={hire.id}
                          className="rounded-2xl bg-foam px-4 py-3"
                        >
                          <p className="font-semibold text-ocean-deep">
                            {hire.name}
                          </p>
                          <p className="mt-1 text-xs text-muted">{hire.note}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm">
                            <a
                              href={`tel:${hire.phone}`}
                              className="inline-flex items-center gap-1.5 font-medium text-ocean"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {hire.phoneDisplay}
                            </a>
                            <a
                              href={hire.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-medium text-ocean"
                            >
                              Website
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {plan.budgetBreakdown ? (
                  <div className="rounded-3xl border border-border bg-brand-deep p-6 text-on-brand">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-aqua" />
                      <h3 className="font-display text-2xl">
                        Damage cost estimate
                      </h3>
                    </div>
                    <p className="mt-1 text-3xl font-semibold text-aqua">
                      ~KES {plan.budgetBreakdown.totalKes.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-on-brand/70">
                      For {partySize} traveler(s) · {days} days
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["Lodging", plan.budgetBreakdown.lodgingKes],
                          ["Activities", plan.budgetBreakdown.activitiesKes],
                          ["Food", plan.budgetBreakdown.foodKes],
                          ["Transport", plan.budgetBreakdown.transportKes],
                          ["Contingency", plan.budgetBreakdown.contingencyKes],
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm"
                        >
                          <span className="text-on-brand/80">{label}</span>
                          <span className="font-medium">
                            KES {value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-on-brand/75">
                      {plan.budgetBreakdown.notes}
                    </p>
                  </div>
                ) : null}

                {plan.days.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-2xl border border-border bg-surface p-4 sm:rounded-3xl sm:p-7"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                          Day {day.day}
                        </p>
                        {day.location ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-foam px-2.5 py-0.5 text-[11px] font-medium text-ocean-deep">
                            <MapPin className="h-3 w-3 text-aqua" />
                            {day.location}
                          </span>
                        ) : null}
                      </div>
                      {day.estimatedDayCostKes != null ? (
                        <p className="rounded-md bg-foam px-3 py-1 text-xs font-medium text-ocean-deep">
                          ~KES {day.estimatedDayCostKes.toLocaleString()} / day
                        </p>
                      ) : null}
                    </div>
                    <h3 className="mt-2 font-display text-2xl text-ocean-deep">
                      {day.theme}
                    </h3>
                    {day.timingNote ? (
                      <p className="mt-2 text-sm font-medium text-ocean">
                        Timing: {day.timingNote}
                      </p>
                    ) : null}
                    <div className="mt-5 space-y-4 text-[15px] leading-7 text-muted">
                      {(
                        [
                          ["🌅 Morning", day.morning],
                          ["☀️ Afternoon", day.afternoon],
                          ["🌙 Evening", day.evening],
                          ["🍽️ Food", day.foodTip],
                          ["🚗 Transport", day.transportTip],
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-border/70 bg-foam/50 px-4 py-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-ocean-deep">
                            {label}
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap">{value}</p>
                        </div>
                      ))}
                    </div>

                    {day.places && day.places.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                          Places & directions
                        </p>
                        <ul className="mt-2 space-y-2">
                          {day.places.map((place) => (
                            <li
                              key={`${place.name}-${place.mapsQuery}`}
                              className="flex flex-col gap-2 rounded-2xl border border-border bg-foam/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-ocean-deep">
                                  {place.name}
                                  {place.kind ? (
                                    <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                                      {place.kind}
                                    </span>
                                  ) : null}
                                </p>
                                {place.why ? (
                                  <p className="mt-0.5 text-sm text-muted">
                                    {place.why}
                                  </p>
                                ) : null}
                                {place.estCostKes != null ? (
                                  <p className="mt-1 text-xs font-medium text-ocean">
                                    ~KES {place.estCostKes.toLocaleString()}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-1.5">
                                <a
                                  href={googleMapsSearchUrl(place.mapsQuery)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-ocean-deep hover:border-aqua/40"
                                >
                                  <MapPin className="h-3 w-3 text-aqua" />
                                  Map
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <a
                                  href={googleMapsDirectionsUrl(place.mapsQuery)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-ocean-deep hover:border-aqua/40"
                                >
                                  <Navigation className="h-3 w-3 text-coral" />
                                  Directions
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {day.localIntel ? (
                      <div className="mt-4 rounded-2xl border border-aqua/25 bg-aqua/5 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-aqua">
                          Local intel
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ocean-deep">
                          {day.localIntel}
                        </p>
                      </div>
                    ) : null}
                    {day.insiderTip ? (
                      <div className="mt-3 rounded-2xl border border-gold/30 bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ocean-deep">
                          Insider tip
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {day.insiderTip}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-brand-deep p-6 text-on-brand">
                    <h4 className="font-display text-xl">🎒 Packing</h4>
                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-on-brand/85">
                      {plan.packingTips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <span className="text-aqua">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-border bg-surface p-6 text-ocean-deep">
                    <h4 className="font-display text-xl">🤝 Local etiquette</h4>
                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                      {plan.localEtiquette.map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <span className="text-aqua">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
      </WorkspaceStage>
    </WorkspaceFrame>
  );
}
