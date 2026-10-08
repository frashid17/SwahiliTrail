"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import type { CoastEvent } from "@/lib/data/coast-events";
import { filterByKenyaRegion } from "@/lib/kenya-regions";

function formatEventWhen(iso: string) {
  const d = new Date(iso);
  const day = d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: "Africa/Nairobi",
    })
    .toUpperCase();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });
  return `${day} · ${time}`;
}

export function CoastEventsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { regionId, region } = useKenyaLocation();
  const [events, setEvents] = useState<CoastEvent[]>([]);
  const [sourceNote, setSourceNote] = useState("Loading events…");

  const filtered = useMemo(
    () =>
      filterByKenyaRegion(
        events,
        regionId,
        (e) => `${e.area} ${e.venue} ${e.title} ${e.category}`,
      ).slice(0, 12),
    [events, regionId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) throw new Error("fail");
        const json = (await res.json()) as {
          events: CoastEvent[];
          sources: { label: string; live: boolean; note: string }[];
        };
        if (cancelled) return;
        setEvents(json.events);
        const live = json.sources.filter((s) => s.live).map((s) => s.label);
        setSourceNote(
          live.length ? live.join(" · ") : "Local calendar only",
        );
      } catch {
        if (!cancelled) setSourceNote("Events unavailable right now");
      }
    }
    void load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(340, el.clientWidth * 0.8),
      behavior: "smooth",
    });
  }

  return (
    <section className="border-y border-border/70 bg-foam/80">
      <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl tracking-tight text-ocean-deep sm:text-4xl">
              {region
                ? `What’s on in ${region.label}`
                : "What’s on across Kenya"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Focus the list by region - Nairobi, Nanyuki, the Mara, the coast,
              and more.
            </p>
            <p className="mt-2 text-xs text-muted/80">{sourceNote}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="text-sm font-semibold text-coral transition hover:text-ocean"
            >
              View all events →
            </Link>
            <button
              type="button"
              aria-label="Previous events"
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-ocean-deep transition hover:border-ocean/30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next events"
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-ocean-deep transition hover:border-ocean/30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <KenyaLocationFilter label="Show events in" />
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">
              No events in this region right now. Try All Kenya.
            </p>
          ) : (
            filtered.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex w-[min(85vw,18.5rem)] shrink-0 snap-start flex-col sm:w-72"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-md">
                  <Image
                    src={event.imageUrl}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col pt-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {formatEventWhen(event.startsAt)}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 font-display text-lg leading-snug text-ocean-deep group-hover:text-ocean">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{event.venue}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="text-xs text-muted">
                      {event.area?.split(",")[0]?.trim() || "Kenya"}
                    </span>
                    <span className="text-sm font-semibold text-coral">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
