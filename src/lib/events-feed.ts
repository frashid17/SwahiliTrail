import type { CoastEvent } from "@/lib/data/coast-events";
import { COAST_EVENTS } from "@/lib/data/coast-events";
import { DESTINATION } from "@/lib/destination";

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  images?: { url?: string; width?: number }[];
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
  };
  priceRanges?: { min?: number; currency?: string }[];
  _embedded?: {
    venues?: {
      name?: string;
      city?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
  };
  classifications?: { segment?: { name?: string } }[];
  pleaseNote?: string;
  info?: string;
};

function pickImage(images?: { url?: string; width?: number }[]) {
  if (!images?.length) {
    return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";
  }
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? images[0].url!;
}

function mapTicketmaster(ev: TicketmasterEvent): CoastEvent | null {
  if (!ev.id || !ev.name) return null;
  const venue = ev._embedded?.venues?.[0];
  const start =
    ev.dates?.start?.dateTime ??
    (ev.dates?.start?.localDate
      ? `${ev.dates.start.localDate}T${ev.dates.start.localTime ?? "18:00:00"}+03:00`
      : null);
  if (!start) return null;

  const min = ev.priceRanges?.[0]?.min;
  const ticketUrl = ev.url ?? "https://www.ticketmaster.co.ke/";
  const city = venue?.city?.name ?? "Kenya";

  return {
    id: `tm-${ev.id}`,
    title: ev.name,
    venue: venue?.name ?? "Kenya venue",
    area: city,
    startsAt: start,
    imageUrl: pickImage(ev.images),
    category: ev.classifications?.[0]?.segment?.name ?? "Live event",
    summary: ev.info?.slice(0, 160) ?? "Listed on Ticketmaster Kenya.",
    about:
      ev.info ||
      ev.pleaseNote ||
      `${ev.name} is on Ticketmaster. Check the ticket page for lineup, age rules, and entry.`,
    priceFromKes: typeof min === "number" ? Math.round(min) : null,
    isFree: false,
    ticketPlatform: "Ticketmaster",
    ticketUrl,
    bookingSteps: [
      "Open the Ticketmaster event page.",
      "Sign in or create an account.",
      "Pick tickets and pay.",
      "Keep the mobile ticket ready at the door.",
    ],
    organizer: "Ticketmaster listing",
    mapsUrl: venue?.name
      ? `https://maps.google.com/?q=${encodeURIComponent(`${venue.name} ${city}`)}`
      : `https://maps.google.com/?q=${encodeURIComponent(DESTINATION.hubTown + " Kenya")}`,
    source: "ticketmaster",
  };
}

export type EventsFeed = {
  events: CoastEvent[];
  sources: { id: string; label: string; live: boolean; note: string }[];
  refreshedAt: string;
};

/** Curated calendar / Kenya-focused listings vs noisy international imports */
export function isKenyaFocusEvent(event: CoastEvent) {
  if (event.source === "coast-calendar") return true;
  const hay = `${event.area} ${event.venue} ${event.title} ${event.category}`.toLowerCase();
  return /kenya|nairobi|mombasa|diani|nakuru|naivasha|kisumu|lamu|malindi|watamu|kilifi|tsavo|mara|amboseli|tana|hola|garsen|kipini|jumuiya|nyali|bamburi/.test(
    hay,
  );
}

/** @deprecated use isKenyaFocusEvent */
export const isTanaRiverEvent = isKenyaFocusEvent;

function eventEndMs(event: CoastEvent) {
  if (event.endsAt) return new Date(event.endsAt).getTime();
  return new Date(event.startsAt).getTime() + 8 * 60 * 60 * 1000;
}

/** Keep ongoing + upcoming; drop finished events. */
export function isActiveOrUpcoming(event: CoastEvent, nowMs = Date.now()) {
  return eventEndMs(event) >= nowMs - 6 * 60 * 60 * 1000;
}

function isHappeningNow(event: CoastEvent, nowMs: number) {
  const start = new Date(event.startsAt).getTime();
  return start <= nowMs && eventEndMs(event) >= nowMs;
}

export function rankEvents(events: CoastEvent[], nowMs = Date.now()) {
  const active = [...events].filter((e) => isActiveOrUpcoming(e, nowMs));
  active.sort((a, b) => {
    // 1) Happening right now
    const aLive = isHappeningNow(a, nowMs) ? 0 : 1;
    const bLive = isHappeningNow(b, nowMs) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    // 2) Kenya-focused listings before sparse imports
    const aKe = isKenyaFocusEvent(a) ? 0 : 1;
    const bKe = isKenyaFocusEvent(b) ? 0 : 1;
    if (aKe !== bKe) return aKe - bKe;
    // 3) Soonest start
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  // Keep curated Kenya dates; trim dense Ticketmaster noise.
  const kenya = active.filter(isKenyaFocusEvent);
  const other = active.filter((e) => !isKenyaFocusEvent(e)).slice(0, 8);
  return [...kenya, ...other];
}

async function fetchTicketmasterNear(
  key: string,
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<CoastEvent[]> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("countryCode", "KE");
  url.searchParams.set("latlong", `${lat},${lon}`);
  url.searchParams.set("radius", String(radiusKm));
  url.searchParams.set("unit", "km");
  url.searchParams.set("size", "20");
  url.searchParams.set("sort", "date,asc");

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);
  const json = (await res.json()) as {
    _embedded?: { events?: TicketmasterEvent[] };
  };
  return (json._embedded?.events ?? [])
    .map(mapTicketmaster)
    .filter((e): e is CoastEvent => Boolean(e));
}

export async function fetchEventsFeed(): Promise<EventsFeed> {
  const sources: EventsFeed["sources"] = [
    {
      id: "coast-calendar",
      label: "Kenya events calendar",
      live: true,
      note: "Curated Kenya dates first, then live Ticketmaster listings.",
    },
  ];

  const live: CoastEvent[] = [...COAST_EVENTS];
  const key = process.env.TICKETMASTER_API_KEY;
  const { lat, lon } = DESTINATION.coords;

  if (key) {
    try {
      // Nairobi hub + Mombasa coast coverage across the country.
      const [nairobiHits, coastHits] = await Promise.all([
        fetchTicketmasterNear(key, lat, lon, 250),
        fetchTicketmasterNear(key, -4.0435, 39.6682, 120),
      ]);
      const seen = new Set(live.map((e) => e.id));
      for (const ev of [...nairobiHits, ...coastHits]) {
        if (seen.has(ev.id)) continue;
        seen.add(ev.id);
        live.push(ev);
      }
      sources.push({
        id: "ticketmaster",
        label: "Ticketmaster",
        live: true,
        note: "Live listings near Nairobi and the coast.",
      });
    } catch {
      sources.push({
        id: "ticketmaster",
        label: "Ticketmaster",
        live: false,
        note: "Ticketmaster unavailable right now. Showing the local calendar.",
      });
    }
  } else {
    sources.push({
      id: "ticketmaster",
      label: "Ticketmaster",
      live: false,
      note: "Add TICKETMASTER_API_KEY for more live listings.",
    });
  }

  return {
    events: rankEvents(live),
    sources,
    refreshedAt: new Date().toISOString(),
  };
}

export function findEventInFeed(feed: EventsFeed, id: string) {
  return feed.events.find((e) => e.id === id) ?? getCoastEventFallback(id);
}

function getCoastEventFallback(id: string) {
  return COAST_EVENTS.find((e) => e.id === id) ?? null;
}
