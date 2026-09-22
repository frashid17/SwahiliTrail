"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CoastEvent } from "@/lib/data/coast-events";

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
  const [events, setEvents] = useState<CoastEvent[]>([]);
  const [sourceNote, setSourceNote] = useState("Loading coast events…");

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
        setEvents(json.events.slice(0, 12));
        const live = json.sources.filter((s) => s.live).map((s) => s.label);
        setSourceNote(
          live.length
            ? `Live feed · ${live.join(" · ")}`
            : "Coast calendar · add Ticketmaster key for more live listings",
        );
      } catch {
        if (!cancelled) setSourceNote("Events temporarily unavailable");
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
    <section className="bg-brand-deep">
      <div className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-coral">
              <span aria-hidden className="h-px w-8 bg-coral" />
              This week on the coast
            </p>
            <h2 className="mt-3 font-display text-3xl text-on-brand sm:text-4xl md:text-5xl">
              The plans worth leaving the house for.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-brand/65 sm:text-base">
              Concerts, festivals, markets, and community events. Open any card
              for full details and how to book tickets.
            </p>
            <p className="mt-2 text-xs text-on-brand/45">{sourceNote}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="text-sm font-semibold text-coral transition hover:brightness-110"
            >
              View all events →
            </Link>
            <button
              type="button"
              aria-label="Previous events"
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-on-brand transition hover:border-coral/50 hover:text-coral"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next events"
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-on-brand transition hover:border-coral/50 hover:text-coral"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex w-[min(85vw,18.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-black/25 ring-1 ring-white/10 transition hover:ring-coral/40 sm:w-72"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={event.imageUrl}
                  alt=""
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-on-brand/45">
                  {formatEventWhen(event.startsAt)}
                </p>
                <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-on-brand">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-on-brand/55">{event.venue}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="text-xs text-on-brand/45">
                    {event.source === "ticketmaster" ? "Live listing" : "Upcoming"}
                  </span>
                  <span className="text-sm font-semibold text-coral">
                    View event →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
