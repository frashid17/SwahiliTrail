"use client";

import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  BookmarkPlus,
  Calendar,
  Car,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Phone,
  Plane,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoastalOrbs } from "@/components/coastal-accents";
import {
  carHiresForMode,
  type TransportMode,
} from "@/lib/data/car-hires";
import { COAST_AREAS } from "@/lib/data/hotels";
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
  type SavedTrip,
} from "@/lib/saved-trips";
import {
  clearTripCart,
  loadTripCart,
  removeTripItem,
  type TripCartItem,
} from "@/lib/trip-cart";
import { cn } from "@/lib/utils";

const interestOptions = [
  "Beach & sunsets",
  "Heritage & Old Town",
  "Food & Swahili cuisine",
  "Wildlife & nature",
  "Nightlife",
  "Family activities",
  "Photography",
  "Water sports",
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
  morning: string;
  afternoon: string;
  evening: string;
  foodTip: string;
  transportTip: string;
  estimatedDayCostKes: number;
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
  const [days, setDays] = useState(5);
  const [interests, setInterests] = useState<string[]>([
    "Beach & sunsets",
    "Heritage & Old Town",
    "Family activities",
  ]);
  const [budget, setBudget] = useState<"budget" | "mid" | "luxury">("mid");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">(
    "balanced",
  );
  const [companions, setCompanions] = useState<
    "solo" | "couple" | "family" | "friends"
  >("family");
  const [stayArea, setStayArea] = useState<string>("whole-coast");
  const [partySize, setPartySize] = useState(3);
  const [transportMode, setTransportMode] =
    useState<TransportMode>("airport-pickup");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [cart, setCart] = useState<TripCartItem[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    setCart(loadTripCart(userId));
    void syncSavedTripsFromCloud(userId).then(setSavedTrips);
  }, [isLoaded, userId]);

  const suggestedHires = useMemo(
    () => carHiresForMode(transportMode).slice(0, 4),
    [transportMode],
  );

  const transportLabel =
    transportOptions.find((t) => t.value === transportMode)?.label ?? "Transport";

  const alreadySaved =
    !!plan &&
    savedTrips.some((t) => t.plan.title === plan.title && t.days === days);

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
    setLoading(true);
    setError(null);
    setSaveNote(null);
    setShowCalendarMenu(false);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          interests,
          budget,
          pace,
          companions,
          stayArea,
          partySize,
          transportMode,
          cart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      plan,
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
    <div className="coastal-grid min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:grid lg:h-full lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-6 lg:overflow-hidden lg:px-10 lg:py-5">
        <aside className="relative flex shrink-0 flex-col rounded-2xl border border-border bg-surface/85 shadow-sm backdrop-blur sm:rounded-3xl lg:min-h-0 lg:overflow-hidden">
          <CoastalOrbs />
          <div className="relative z-[1] space-y-3.5 p-4 sm:space-y-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua sm:text-xs">
                AI Trip Planner
              </p>
              <h1 className="mt-1.5 font-display text-2xl text-ocean-deep sm:mt-2 sm:text-3xl">
                Curate a full coast trip
              </h1>
              <p className="mt-1.5 text-sm text-muted sm:mt-2">
                <span className="lg:hidden">
                  Set days, stay, transport, and activities. Your curated trip
                  appears below.
                </span>
                <span className="hidden lg:inline">
                  Set days, stay, transport, and activities. Results scroll on
                  the right while this panel stays put.
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-foam/70 p-3">
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

            <label className="block">
              <span className="text-sm font-medium text-ocean-deep">
                Days in Mombasa: {days}
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-2 w-full accent-ocean"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">Trip start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2.5 text-ocean-deep [color-scheme:light] dark:[color-scheme:dark]"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">
                Where to base your stay
              </span>
              <select
                value={stayArea}
                onChange={(e) => setStayArea(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2 text-sm"
              >
                {COAST_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted">
                {COAST_AREAS.find((a) => a.value === stayArea)?.hint ??
                  "Not sure? Pick whole coast and the AI will suggest a fit."}
              </span>
            </label>

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
                className="mt-2 w-full accent-ocean"
              />
            </label>

            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean-deep">
                <Car className="h-4 w-4 text-aqua" />
                Car hire & airport pickup
              </p>
              <div className="mt-2 grid gap-1.5">
                {transportOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTransportMode(option.value)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-left transition",
                      transportMode === option.value
                        ? "border-aqua bg-ocean text-white shadow-sm"
                        : "border-aqua/35 bg-surface text-ocean-deep hover:border-aqua hover:bg-sand/60",
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] leading-snug",
                        transportMode === option.value
                          ? "text-white/85"
                          : "text-ocean-deep/75",
                      )}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
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

            <div>
              <p className="text-sm font-medium text-ocean-deep">
                Activities you expect
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {interestOptions.map((option) => {
                  const active = interests.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleInterest(option)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        active
                          ? "border-aqua bg-ocean text-white"
                          : "border-aqua/30 bg-surface text-ocean-deep hover:border-aqua",
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
                    "rounded-xl border-2 px-2 py-2.5 text-xs font-semibold",
                    budget === value
                      ? "border-aqua bg-ocean text-white"
                      : "border-aqua/35 bg-surface text-ocean-deep hover:border-aqua",
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
              onClick={generate}
              disabled={loading || interests.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Building your trip…" : "Generate full trip + budget"}
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
                          setPlan(trip.plan);
                          setDays(trip.days);
                          setPartySize(trip.partySize);
                          setStartDate(trip.startDate);
                          setTransportMode(
                            trip.transportMode as TransportMode,
                          );
                          setSaveNote(null);
                        }}
                      >
                        <p className="truncate text-xs font-semibold text-ocean-deep">
                          {trip.plan.title}
                        </p>
                        <p className="text-[11px] text-muted">
                          {trip.days} days · starts {trip.startDate}
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
        </aside>

        <section className="relative flex min-h-[min(20rem,55dvh)] flex-col rounded-2xl border border-border bg-surface/70 shadow-sm sm:rounded-3xl lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <CoastalOrbs className="opacity-40" />
          <div className="relative z-[1] p-3 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            {!plan ? (
              <div className="flex min-h-[10rem] items-center justify-center rounded-2xl border border-dashed border-ocean/30 bg-foam/40 p-5 text-center text-sm text-muted sm:min-h-[12rem] sm:p-8 sm:text-base lg:min-h-[320px]">
                Your curated trip will land here - day plans, stay suggestion,
                car-hire contacts, and a damage cost estimate.
              </div>
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
                      <p className="mt-2 text-muted">{plan.summary}</p>
                      <p className="mt-3 rounded-2xl bg-foam px-4 py-3 text-sm text-ocean-deep">
                        <span className="font-semibold">Recommended stay:</span>{" "}
                        {plan.recommendedStay}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addToMyTrips}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold",
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
                      <button
                        type="button"
                        onClick={downloadPlan}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCalendarMenu((v) => !v)}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
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
                      <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                        Day {day.day}
                      </p>
                      {day.estimatedDayCostKes != null ? (
                        <p className="rounded-full bg-foam px-3 py-1 text-xs font-medium text-ocean-deep">
                          ~KES {day.estimatedDayCostKes.toLocaleString()} / day
                        </p>
                      ) : null}
                    </div>
                    <h3 className="mt-2 font-display text-2xl text-ocean-deep">
                      {day.theme}
                    </h3>
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
                          <p className="mt-1.5">{value}</p>
                        </div>
                      ))}
                    </div>
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
        </section>
      </div>
    </div>
  );
}
