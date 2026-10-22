"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import type { CoastEvent } from "@/lib/data/coast-events";
import { filterByKenyaRegion } from "@/lib/kenya-regions";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
}

type SourceChip = { id?: string; label: string; live: boolean; note: string };

const CATEGORY_PRESETS = [
  { id: "all", label: "All types" },
  { id: "music", label: "Music", match: /music|concert|nightlife|party|dub|r&b|bashment/i },
  { id: "sports", label: "Sports", match: /sport|fight|bike|run|padel|gaming/i },
  { id: "arts", label: "Arts & culture", match: /art|theatre|film|culture|expo|summit/i },
  { id: "food", label: "Food & social", match: /food|brunch|social|hangout/i },
  { id: "venues", label: "Venues", match: /google|venue/i },
] as const;

export default function EventsPage() {
  const { regionId, region } = useKenyaLocation();
  const [events, setEvents] = useState<CoastEvent[]>([]);
  const [sources, setSources] = useState<SourceChip[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as {
        events: CoastEvent[];
        sources: SourceChip[];
        refreshedAt: string;
      };
      setEvents(json.events);
      setSources(json.sources);
      setRefreshedAt(json.refreshedAt);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await load();
    })();
    // Poll every 90s so HustleSasa / Ticketmaster updates feel live.
    const id = window.setInterval(() => {
      void load();
    }, 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load]);

  const filtered = useMemo(() => {
    let list = filterByKenyaRegion(
      events,
      regionId,
      (e) => `${e.area} ${e.venue} ${e.title} ${e.category}`,
    );
    if (sourceFilter !== "all") {
      const bySource = list.filter((e) => e.source === sourceFilter);
      // Don't leave the page blank when a source has 0 matches.
      list = bySource.length > 0 ? bySource : list;
    }
    const preset = CATEGORY_PRESETS.find((c) => c.id === categoryId);
    if (preset && "match" in preset && preset.match) {
      const byCat = list.filter(
        (e) =>
          preset.match.test(e.category) ||
          preset.match.test(e.title) ||
          preset.match.test(e.summary),
      );
      list = byCat.length > 0 ? byCat : list;
    }
    return list;
  }, [events, regionId, categoryId, sourceFilter]);

  return (
    <div className="paper-grain coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Events
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ocean-deep sm:text-5xl">
            What&apos;s on in Kenya
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Live listings from HustleSasa, Ticketmaster, Google venue discovery,
            and the Kenya calendar - music, sports, nightlife, arts, and more.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            {refreshedAt ? (
              <span>
                Updated{" "}
                {new Date(refreshedAt).toLocaleTimeString("en-GB", {
                  timeZone: "Africa/Nairobi",
                })}{" "}
                · EAT
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="font-semibold text-aqua hover:text-ocean"
            >
              Refresh now
            </button>
          </div>
        </FadeIn>

        <div className="mt-6">
          <KenyaLocationFilter />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSourceFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              sourceFilter === "all"
                ? "bg-brand-deep text-on-brand"
                : "bg-surface text-muted ring-1 ring-border hover:bg-foam",
            )}
          >
            All sources
          </button>
          {sources.map((s) => {
            const id =
              s.id ||
              s.label.toLowerCase().replace(/\s+/g, "-");
            return (
              <button
                key={s.label}
                type="button"
                title={s.note}
                onClick={() => setSourceFilter(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  sourceFilter === id
                    ? "bg-brand-deep text-on-brand"
                    : s.live
                      ? "bg-ocean/15 text-ocean hover:bg-ocean/20"
                      : "bg-surface text-muted ring-1 ring-border",
                )}
              >
                {s.label}
                {s.live ? " · live" : ""}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_PRESETS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "rounded-md px-3.5 py-2 text-sm font-medium transition",
                categoryId === c.id
                  ? "bg-coral text-white"
                  : "bg-surface text-muted ring-1 ring-border hover:bg-foam",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">
          {loading && events.length === 0
            ? "Loading live events…"
            : `Showing ${filtered.length} of ${events.length} events`}
          {region ? ` in ${region.label}` : " across Kenya"}
        </p>

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-muted">
            No events for this filter right now. Try All types or All Kenya.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((event, index) => (
              <StaggerItem key={event.id} index={index}>
                <Link
                  href={`/events/${event.id}`}
                  prefetch={false}
                  className="block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-aqua/35"
                >
                  <div className="relative h-44">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      unoptimized={
                        event.imageUrl.startsWith("http://") ||
                        event.imageUrl.startsWith("https://")
                      }
                      className="object-cover"
                      sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/70 to-transparent" />
                    <p className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-aqua">
                        {event.category}
                      </span>
                      <span className="rounded bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                        {event.ticketPlatform}
                      </span>
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-medium text-muted">
                      {formatWhen(event.startsAt)}
                    </p>
                    <h2 className="mt-1 font-display text-2xl text-ocean-deep">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {event.venue} · {event.area}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-coral">
                      View & book →
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
