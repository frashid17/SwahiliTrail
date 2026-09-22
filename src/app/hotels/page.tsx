"use client";

import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  BedDouble,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CoastalOrbs } from "@/components/coastal-accents";
import { COAST_AREAS, hydrateHotels, hotelPrimaryLink } from "@/lib/data/hotels";
import type { Hotel } from "@/lib/data/hotels";
import {
  hydrateRestaurants,
  type Restaurant,
} from "@/lib/data/restaurants";
import { loadHotelSearch, saveHotelSearch } from "@/lib/hotel-history";
import { addTripItem } from "@/lib/trip-cart";
import { cn } from "@/lib/utils";

const hotelMustHaves = [
  "Wi-Fi",
  "Pool",
  "Beach access",
  "Spa",
  "Breakfast",
  "Family friendly",
];

const restaurantMustHaves = [
  "Seafood",
  "Family friendly",
  "Views",
  "Cafe",
  "Local Swahili",
  "Budget eats",
];

type Mode = "hotels" | "restaurants";

export default function HotelsPage() {
  const { userId, isLoaded } = useAuth();
  const [mode, setMode] = useState<Mode>("hotels");
  const [budgetMax, setBudgetMax] = useState(20000);
  const [vibe, setVibe] = useState("Relaxed beach luxury near the water");
  const [travelers, setTravelers] = useState<
    "solo" | "couple" | "family" | "friends"
  >("couple");
  const [mustHaves, setMustHaves] = useState<string[]>(["Wi-Fi", "Pool"]);
  const [areaPreference, setAreaPreference] = useState("whole-coast");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [hotelRationale, setHotelRationale] = useState<string | null>(null);
  const [hotelTips, setHotelTips] = useState<string[]>([]);
  const [restaurantRationale, setRestaurantRationale] = useState<string | null>(
    null,
  );
  const [restaurantTips, setRestaurantTips] = useState<string[]>([]);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [cartNote, setCartNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const saved = loadHotelSearch(userId);
    if (!saved) return;
    setBudgetMax(saved.budgetMax);
    setVibe(saved.vibe);
    setTravelers(saved.travelers);
    setMustHaves(saved.mustHaves);
    const area = COAST_AREAS.some((a) => a.value === saved.areaPreference)
      ? saved.areaPreference
      : "whole-coast";
    setAreaPreference(area);
    setHotels(hydrateHotels(saved.hotels));
    setHotelRationale(saved.rationale);
    setHotelTips(saved.tips);
    setRestoredAt(saved.savedAt);
  }, [isLoaded, userId]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMustHaves(next === "hotels" ? ["Wi-Fi", "Pool"] : ["Seafood", "Views"]);
    setBudgetMax(next === "hotels" ? 20000 : 3000);
    setVibe(
      next === "hotels"
        ? "Relaxed beach luxury near the water"
        : "Seafood with sunset views",
    );
  }

  function toggleMustHave(value: string) {
    setMustHaves((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value],
    );
  }

  async function match() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          budgetMax,
          vibe,
          travelers,
          mustHaves,
          areaPreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const nextHotels = hydrateHotels((data.hotels ?? []) as Hotel[]);
      const nextRestaurants = hydrateRestaurants(
        (data.restaurants ?? []) as Restaurant[],
      );
      const nextRationale = data.rationale as string;
      const nextTips = (data.tips ?? []) as string[];
      const savedAt = new Date().toISOString();

      if (mode === "hotels") {
        setHotels(nextHotels);
        setHotelRationale(nextRationale);
        setHotelTips(nextTips);
        setRestoredAt(savedAt);
        if (userId) {
          saveHotelSearch(userId, {
            budgetMax,
            vibe,
            travelers,
            mustHaves,
            areaPreference,
            hotels: nextHotels,
            rationale: nextRationale,
            tips: nextTips,
            savedAt,
          });
        }
      } else {
        setRestaurants(nextRestaurants);
        setRestaurantRationale(nextRationale);
        setRestaurantTips(nextTips);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function addHotelToTrip(hotel: Hotel) {
    if (!userId) {
      setCartNote("Sign in to save items to your trip.");
      return;
    }
    addTripItem(userId, {
      id: hotel.id,
      type: "hotel",
      name: hotel.name,
      area: hotel.area,
      estCostKes: hotel.pricePerNight,
    });
    setCartNote(`Added ${hotel.name} to your trip planner.`);
  }

  function addRestaurantToTrip(restaurant: Restaurant) {
    if (!userId) {
      setCartNote("Sign in to save items to your trip.");
      return;
    }
    addTripItem(userId, {
      id: restaurant.id,
      type: "restaurant",
      name: restaurant.name,
      area: restaurant.area,
      estCostKes: restaurant.avgMealKes,
    });
    setCartNote(`Added ${restaurant.name} to your trip planner.`);
  }

  const resultCount =
    mode === "hotels" ? hotels.length : restaurants.length;
  const chips = mode === "hotels" ? hotelMustHaves : restaurantMustHaves;
  const rationale = mode === "hotels" ? hotelRationale : restaurantRationale;
  const tips = mode === "hotels" ? hotelTips : restaurantTips;

  return (
    <div className="coastal-grid min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:grid lg:h-full lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-6 lg:overflow-hidden lg:px-10 lg:py-5">
        <aside className="relative flex shrink-0 flex-col rounded-2xl border border-border bg-surface/85 shadow-sm backdrop-blur sm:rounded-3xl lg:min-h-0 lg:overflow-hidden">
          <CoastalOrbs />
          <div className="relative z-[1] space-y-3.5 p-4 sm:space-y-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua sm:text-xs">
                Stay & eat
              </p>
              <h1 className="mt-1.5 font-display text-2xl leading-tight text-ocean-deep sm:mt-2 sm:text-3xl">
                Match coastal stays & tables
              </h1>
              <p className="mt-1.5 text-sm text-muted lg:hidden">
                Tune budget and vibe, then match. Ranked results appear below.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-foam p-1">
              {(
                [
                  ["hotels", "Hotels", BedDouble],
                  ["restaurants", "Restaurants", UtensilsCrossed],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    mode === value
                      ? "bg-ocean text-on-brand"
                      : "text-muted hover:text-ocean-deep",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">
                {mode === "hotels"
                  ? `Max per night: KES ${budgetMax.toLocaleString()}`
                  : `Max per meal: KES ${budgetMax.toLocaleString()}`}
              </span>
              <input
                type="range"
                min={mode === "hotels" ? 5000 : 500}
                max={mode === "hotels" ? 40000 : 6000}
                step={mode === "hotels" ? 500 : 100}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="mt-2 w-full accent-ocean"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">Desired vibe</span>
              <textarea
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                rows={2}
                className="mt-1 min-h-[4.5rem] w-full resize-y rounded-xl border border-border bg-foam px-3 py-2.5 text-ocean-deep"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">Area preference</span>
              <select
                value={areaPreference}
                onChange={(e) => setAreaPreference(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2"
              >
                {COAST_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted">
                {COAST_AREAS.find((a) => a.value === areaPreference)?.hint}
              </span>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-ocean-deep">Travelers</span>
              <select
                value={travelers}
                onChange={(e) =>
                  setTravelers(e.target.value as typeof travelers)
                }
                className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2"
              >
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
              </select>
            </label>

            <div>
              <p className="text-sm font-medium text-ocean-deep">Must-haves</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((option) => {
                  const active = mustHaves.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMustHave(option)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        active
                          ? "bg-ocean text-on-brand"
                          : "bg-foam text-muted hover:bg-sand"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={match}
              disabled={loading || !vibe.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "hotels" ? (
                <BedDouble className="h-4 w-4" />
              ) : (
                <UtensilsCrossed className="h-4 w-4" />
              )}
              {loading
                ? "Matching…"
                : mode === "hotels"
                  ? "Match hotels with AI"
                  : "Match restaurants with AI"}
            </button>
            {error ? <p className="text-sm text-coral">{error}</p> : null}
            {cartNote ? <p className="text-sm text-aqua">{cartNote}</p> : null}
          </div>
        </aside>

        <section className="relative flex min-h-[min(18rem,50dvh)] flex-col rounded-2xl border border-border bg-surface shadow-sm sm:rounded-3xl lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <CoastalOrbs className="opacity-50" />
          <div className="relative z-[1] shrink-0 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="font-display text-xl text-ocean-deep sm:text-2xl">
              {mode === "hotels" ? "Matched stays" : "Matched restaurants"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {resultCount > 0
                ? `${resultCount} ranked option${resultCount === 1 ? "" : "s"}`
                : "Run the matcher to see ranked results here."}
              {restoredAt && mode === "hotels" && hotels.length > 0
                ? ` · last hotel search ${new Date(restoredAt).toLocaleString()}`
                : ""}
            </p>
          </div>

          <div className="relative z-[1] space-y-3 p-3 sm:space-y-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            {rationale ? (
              <div className="rounded-2xl border border-border bg-foam/70 p-4 sm:rounded-3xl sm:p-5">
                <h3 className="font-display text-lg text-ocean-deep sm:text-xl">
                  Why these matches
                </h3>
                <p className="mt-2 text-sm text-muted">{rationale}</p>
                {tips.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted">
                    {tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {mode === "hotels" && hotels.length === 0 ? (
              <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-dashed border-ocean/30 bg-foam/40 p-5 text-center text-sm text-muted sm:min-h-[10rem] sm:rounded-3xl sm:p-8 sm:text-base lg:min-h-[280px]">
                Matched hotels will rank here after you run the AI matcher.
              </div>
            ) : null}

            {mode === "restaurants" && restaurants.length === 0 ? (
              <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-dashed border-ocean/30 bg-foam/40 p-5 text-center text-sm text-muted sm:min-h-[10rem] sm:rounded-3xl sm:p-8 sm:text-base lg:min-h-[280px]">
                Matched restaurants will rank here after you run the AI matcher.
              </div>
            ) : null}

            {mode === "hotels"
              ? hotels.map((hotel, index) => {
                  const primary = hotelPrimaryLink(hotel);
                  return (
                    <motion.article
                      key={hotel.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
                    >
                      <div className="relative h-44 sm:h-52">
                        <Image
                          src={hotel.imageUrl}
                          alt={hotel.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 60vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 via-brand-deep/20 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                              #{index + 1} · {hotel.area}
                            </p>
                            <h3 className="font-display text-xl text-on-brand sm:text-2xl">
                              {hotel.name}
                            </h3>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-ocean-deep backdrop-blur">
                            <Star className="h-3.5 w-3.5 fill-coral text-coral" />
                            {hotel.rating}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <p className="text-sm text-muted">{hotel.description}</p>
                        <p className="mt-3 text-sm font-semibold text-ocean">
                          From KES {hotel.pricePerNight.toLocaleString()} / night
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hotel.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-foam px-2.5 py-1 text-xs text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href={primary.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-ocean px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-deep"
                          >
                            {primary.label}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {hotel.websiteUrl ? (
                            <a
                              href={hotel.bookingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                            >
                              Book on Booking.com
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => addHotelToTrip(hotel)}
                            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep hover:border-aqua/40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add to trip
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              : restaurants.map((restaurant, index) => (
                  <motion.article
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
                  >
                    <div className="relative h-44 sm:h-52">
                      <Image
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 via-brand-deep/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                            #{index + 1} · {restaurant.area}
                          </p>
                          <h3 className="font-display text-xl text-on-brand sm:text-2xl">
                            {restaurant.name}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-ocean-deep backdrop-blur">
                          <Star className="h-3.5 w-3.5 fill-coral text-coral" />
                          {restaurant.rating}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-sm text-muted">
                        {restaurant.description}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-ocean">
                        {restaurant.cuisine} · {restaurant.priceLevel} · avg KES{" "}
                        {restaurant.avgMealKes.toLocaleString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {restaurant.websiteUrl ? (
                          <a
                            href={restaurant.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-ocean px-4 py-2.5 text-sm font-semibold text-on-brand"
                          >
                            Visit website
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        <a
                          href={restaurant.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-foam px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Open in Maps
                        </a>
                        <button
                          type="button"
                          onClick={() => addRestaurantToTrip(restaurant)}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep hover:border-aqua/40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add to trip
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
