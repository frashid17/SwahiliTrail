"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, Clock, Plus, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoastalOrbs } from "@/components/coastal-accents";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import { ATTRACTIONS } from "@/lib/data/attractions";
import type { CoastEvent } from "@/lib/data/coast-events";
import {
  addTripItem,
  loadTripCart,
  removeTripItem,
  type TripCartItem,
} from "@/lib/trip-cart";

export default function AttractionsPage() {
  const { userId, isLoaded } = useAuth();
  const [cart, setCart] = useState<TripCartItem[]>([]);
  const [events, setEvents] = useState<CoastEvent[]>([]);

  useEffect(() => {
    if (isLoaded && userId) setCart(loadTripCart(userId));
  }, [isLoaded, userId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { events: CoastEvent[] };
        if (!cancelled) setEvents(json.events.slice(0, 6));
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function isSaved(id: string) {
    return cart.some((c) => c.type === "attraction" && c.id === id);
  }

  function toggle(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent("/attractions")}`;
      return;
    }
    const attraction = ATTRACTIONS.find((a) => a.id === id);
    if (!attraction) return;
    if (isSaved(id)) {
      setCart(removeTripItem(userId, id, "attraction"));
    } else {
      setCart(
        addTripItem(userId, {
          id: attraction.id,
          type: "attraction",
          name: attraction.name,
          area: attraction.area,
          estCostKes: attraction.estCostKes,
        }),
      );
    }
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
              Tourist attractions
            </p>
            <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
              What to do on the coast
            </h1>
            <p className="mt-3 max-w-2xl text-muted">
              Open any place for full details and traveler reviews, or add it to
              your trip list for the AI Planner. Looking for clubs and nightlife?{" "}
              <Link href="/explore" className="font-semibold text-ocean">
                Explore Food & Nightlife
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-ocean-deep"
            >
              Events
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-ocean-deep"
            >
              Explore all
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
            >
              Plan trip with{" "}
              {cart.filter((c) => c.type === "attraction").length} saved
            </Link>
          </div>
        </FadeIn>

        {events.length > 0 ? (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                  Happening now
                </p>
                <h2 className="mt-1 font-display text-2xl text-ocean-deep sm:text-3xl">
                  Coast events
                </h2>
              </div>
              <Link
                href="/events"
                className="text-sm font-semibold text-ocean hover:text-aqua"
              >
                View all events →
              </Link>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="w-64 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-aqua/40"
                >
                  <div className="relative h-32">
                    <Image
                      src={event.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-medium uppercase text-muted">
                      {event.category}
                    </p>
                    <p className="mt-0.5 line-clamp-2 font-semibold text-ocean-deep">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-coral">Book tickets →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ATTRACTIONS.map((attraction, index) => {
            const saved = isSaved(attraction.id);
            return (
              <StaggerItem key={attraction.id} index={index}>
                <Link
                  href={`/attractions/${attraction.id}`}
                  className="relative block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-aqua/35"
                >
                  <CoastalOrbs className="opacity-40" />
                  <div className="relative h-44">
                    <Image
                      src={attraction.imageUrl}
                      alt={attraction.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/75 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-aqua">
                      {attraction.category} · {attraction.area}
                    </p>
                  </div>
                  <div className="relative p-5">
                    <h2 className="font-display text-2xl text-ocean-deep">
                      {attraction.name}
                    </h2>
                    <p className="mt-2 text-sm text-muted">{attraction.blurb}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-aqua" />~
                        {attraction.durationHours}h
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5 text-aqua" />
                        {attraction.estCostKes === 0
                          ? "Free / tip-based"
                          : `~KES ${attraction.estCostKes.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep">
                        View details
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggle(e, attraction.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                          saved
                            ? "bg-ocean text-white"
                            : "border border-border text-ocean-deep"
                        }`}
                      >
                        {saved ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {saved ? "Saved" : "Add to trip"}
                      </button>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </div>
      </div>
    </div>
  );
}
