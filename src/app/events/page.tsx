"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import type { CoastEvent } from "@/lib/data/coast-events";

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

export default function EventsPage() {
  const [events, setEvents] = useState<CoastEvent[]>([]);
  const [sources, setSources] = useState<
    { label: string; live: boolean; note: string }[]
  >([]);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const json = (await res.json()) as {
        events: CoastEvent[];
        sources: { label: string; live: boolean; note: string }[];
        refreshedAt: string;
      };
      setEvents(json.events);
      setSources(json.sources);
      setRefreshedAt(json.refreshedAt);
    }
    void load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
            Coast events
          </p>
          <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
            What&apos;s on across the coast
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Open an event for venue details and a clear path to book tickets
            (Quicket, eGotickets, Ticketmaster when connected).
          </p>
          {refreshedAt ? (
            <p className="mt-2 text-xs text-muted">
              Refreshed{" "}
              {new Date(refreshedAt).toLocaleTimeString("en-GB", {
                timeZone: "Africa/Nairobi",
              })}{" "}
              · EAT
            </p>
          ) : null}
        </FadeIn>

        <div className="mt-6 flex flex-wrap gap-2">
          {sources.map((s) => (
            <span
              key={s.label}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                s.live
                  ? "bg-ocean/15 text-ocean"
                  : "bg-surface text-muted ring-1 ring-border"
              }`}
              title={s.note}
            >
              {s.label}
              {s.live ? " · live" : " · optional"}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <StaggerItem key={event.id} index={index}>
              <Link
                href={`/events/${event.id}`}
                className="block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-aqua/35"
              >
                <div className="relative h-44">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/70 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-aqua">
                    {event.category}
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-muted">
                    {formatWhen(event.startsAt)}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-ocean-deep">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{event.venue}</p>
                  <p className="mt-3 text-sm font-semibold text-coral">
                    View & book →
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </div>
      </div>
    </div>
  );
}
