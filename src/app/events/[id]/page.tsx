"use client";

import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import type { CoastEvent } from "@/lib/data/coast-events";
import { getCoastEvent } from "@/lib/data/coast-events";

function formatFull(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<CoastEvent | null>(
    () => getCoastEvent(params.id) ?? null,
  );
  const [sourceNote, setSourceNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          events: CoastEvent[];
          sources: { label: string; live: boolean; note: string }[];
        };
        if (cancelled) return;
        const found = json.events.find((e) => e.id === params.id);
        if (found) setEvent(found);
        setSourceNote(
          json.sources
            .map((s) => `${s.label}${s.live ? " (live)" : ""}: ${s.note}`)
            .join(" · "),
        );
      } catch {
        /* keep curated fallback */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (!event) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Event not found.</p>
        <Link href="/events" className="mt-4 inline-block text-ocean">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="relative h-[42vh] min-h-72 w-full overflow-hidden sm:h-[48vh]">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All events
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-aqua">
            {event.category} · {event.area}
          </p>
          <h1 className="mt-1 font-display text-3xl text-white sm:text-5xl">
            {event.title}
          </h1>
        </div>
      </div>

      <FadeIn className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-lg text-muted leading-relaxed">{event.summary}</p>
          <p className="leading-relaxed text-ocean-deep">{event.about}</p>

          <div className="space-y-3 text-sm text-muted">
            <p className="inline-flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
              <span>
                {formatFull(event.startsAt)}
                {event.endsAt ? ` → ${formatFull(event.endsAt)}` : null}
              </span>
            </p>
            <p className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
              <span>
                {event.venue}
                <a
                  href={event.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 font-semibold text-ocean"
                >
                  Map <ExternalLink className="h-3 w-3" />
                </a>
              </span>
            </p>
          </div>

          {sourceNote ? (
            <p className="rounded-2xl bg-foam px-4 py-3 text-xs text-muted">
              Data sources: {sourceNote}
            </p>
          ) : null}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-aqua">
            <Ticket className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">
              How to book
            </p>
          </div>
          <p className="font-display text-2xl text-ocean-deep">
            {event.isFree
              ? "Free entry / RSVP"
              : event.priceFromKes != null
                ? `From KES ${event.priceFromKes.toLocaleString()}`
                : "See ticket page"}
          </p>
          <p className="text-sm text-muted">
            Tickets via <strong>{event.ticketPlatform}</strong>
            {event.organizer ? ` · ${event.organizer}` : null}
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-ocean-deep">
            {event.bookingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {event.contactHint ? (
            <p className="text-xs text-muted">{event.contactHint}</p>
          ) : null}
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
          >
            Book tickets
            <ExternalLink className="h-4 w-4" />
          </a>
        </aside>
      </FadeIn>
    </div>
  );
}
