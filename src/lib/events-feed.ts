import type { CoastEvent } from "@/lib/data/coast-events";
import { COAST_EVENTS } from "@/lib/data/coast-events";
import { DESTINATION } from "@/lib/destination";
import { fetchGoogleVenueHighlights } from "@/lib/events/google-events";
import { fetchHustleSasaEvents } from "@/lib/events/hustlesasa";

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  images?: { url?: string; width?: number }[];
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
    end?: { dateTime?: string; localDate?: string; localTime?: string };
  };
  priceRanges?: { min?: number; currency?: string }[];
  _embedded?: {
    venues?: {
      name?: string;
      city?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
  };
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
  }[];
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

  const end =
    ev.dates?.end?.dateTime ??
    (ev.dates?.end?.localDate
      ? `${ev.dates.end.localDate}T${ev.dates.end.localTime ?? "23:00:00"}+03:00`
      : undefined);

  const min = ev.priceRanges?.[0]?.min;
  const ticketUrl = ev.url ?? "https://www.ticketmaster.co.ke/";
  const city = venue?.city?.name ?? "Kenya";
  const segment = ev.classifications?.[0]?.segment?.name;
  const genre = ev.classifications?.[0]?.genre?.name;
  const category = [segment, genre].filter(Boolean).join(" · ") || "Live event";

  return {
    id: `tm-${ev.id}`,
    title: ev.name,
    venue: venue?.name ?? "Kenya venue",
    area: city,
    startsAt: start,
    endsAt: end,
    imageUrl: pickImage(ev.images),
    category,
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
  categories: string[];
};

/** Curated calendar / Kenya-focused listings vs noisy international imports */
export function isKenyaFocusEvent(event: CoastEvent) {
  if (
    event.source === "coast-calendar" ||
    event.source === "hustlesasa" ||
    event.source === "google"
  ) {
    return true;
  }
  const hay =
    `${event.area} ${event.venue} ${event.title} ${event.category}`.toLowerCase();
  return /kenya|nairobi|mombasa|diani|nakuru|naivasha|kisumu|lamu|malindi|watamu|kilifi|tsavo|mara|amboseli|tana|hola|garsen|kipini|jumuiya|nyali|bamburi|westlands|parklands|kiambu|athi|tigoni|uganda|tanzania/.test(
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
    const aLive = isHappeningNow(a, nowMs) ? 0 : 1;
    const bLive = isHappeningNow(b, nowMs) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;

    // Prefer dated ticketed listings over venue highlights.
    const weight = (e: CoastEvent) => {
      if (e.source === "hustlesasa") return 0;
      if (e.source === "ticketmaster") return 1;
      if (e.source === "coast-calendar") return 2;
      return 3;
    };
    const aw = weight(a);
    const bw = weight(b);
    if (aw !== bw) return aw - bw;

    const aKe = isKenyaFocusEvent(a) ? 0 : 1;
    const bKe = isKenyaFocusEvent(b) ? 0 : 1;
    if (aKe !== bKe) return aKe - bKe;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  return active;
}

async function fetchTicketmaster(
  key: string,
  params: Record<string, string>,
): Promise<CoastEvent[]> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("countryCode", "KE");
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "date,asc");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  if (params.size) {
    url.searchParams.set("size", params.size);
  }
  const res = await fetch(url, {
    next: { revalidate: 120 },
    signal: AbortSignal.timeout(3500),
  });
  if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);
  const json = (await res.json()) as {
    _embedded?: { events?: TicketmasterEvent[] };
  };
  return (json._embedded?.events ?? [])
    .map(mapTicketmaster)
    .filter((e): e is CoastEvent => Boolean(e));
}

async function fetchAllTicketmaster(key: string): Promise<CoastEvent[]> {
  const { lat, lon } = DESTINATION.coords;

  // Keep this lean - many parallel Discovery calls stacked timeouts (~8s).
  const settled = await Promise.allSettled([
    fetchTicketmaster(key, { size: "50" }),
    fetchTicketmaster(key, {
      latlong: `${lat},${lon}`,
      radius: "400",
      unit: "km",
      size: "50",
    }),
    fetchTicketmaster(key, {
      latlong: "-4.0435,39.6682",
      radius: "200",
      unit: "km",
      size: "30",
    }),
  ]);

  const merged: CoastEvent[] = [];
  const seen = new Set<string>();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const ev of result.value) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      merged.push(ev);
    }
  }
  return merged;
}

function mergeUnique(base: CoastEvent[], extra: CoastEvent[]) {
  const seen = new Set(base.map((e) => e.id));
  for (const ev of extra) {
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);
    base.push(ev);
  }
  return base;
}

export async function fetchEventsFeed(): Promise<EventsFeed> {
  const sources: EventsFeed["sources"] = [
    {
      id: "coast-calendar",
      label: "Kenya calendar",
      live: true,
      note: "Curated Kenya dates across regions.",
    },
  ];

  const live: CoastEvent[] = [...COAST_EVENTS];

  const [hustleResult, ticketResult, googleResult] = await Promise.allSettled([
    fetchHustleSasaEvents(),
    process.env.TICKETMASTER_API_KEY
      ? fetchAllTicketmaster(process.env.TICKETMASTER_API_KEY)
      : Promise.reject(new Error("missing key")),
    fetchGoogleVenueHighlights(),
  ]);

  if (hustleResult.status === "fulfilled") {
    mergeUnique(live, hustleResult.value);
    sources.push({
      id: "hustlesasa",
      label: "HustleSasa",
      live: true,
      note: `Live marketplace · ${hustleResult.value.length} events`,
    });
  } else {
    sources.push({
      id: "hustlesasa",
      label: "HustleSasa",
      live: false,
      note: "HustleSasa marketplace unavailable right now.",
    });
  }

  if (
    ticketResult.status === "fulfilled" &&
    ticketResult.value.length > 0
  ) {
    mergeUnique(live, ticketResult.value);
    sources.push({
      id: "ticketmaster",
      label: "Ticketmaster",
      live: true,
      note: `Music, sports, arts & more · ${ticketResult.value.length} events`,
    });
  } else if (process.env.TICKETMASTER_API_KEY) {
    sources.push({
      id: "ticketmaster",
      label: "Ticketmaster",
      live: false,
      note: "Ticketmaster unavailable right now.",
    });
  } else {
    sources.push({
      id: "ticketmaster",
      label: "Ticketmaster",
      live: false,
      note: "Add TICKETMASTER_API_KEY for Ticketmaster Kenya inventory.",
    });
  }

  if (googleResult.status === "fulfilled" && googleResult.value.length) {
    mergeUnique(live, googleResult.value);
    sources.push({
      id: "google",
      label: "Google Places",
      live: true,
      note: `Venue discovery · ${googleResult.value.length} spots`,
    });
  } else {
    sources.push({
      id: "google",
      label: "Google Places",
      live: false,
      note: process.env.GOOGLE_PLACES_API_KEY
        ? "Google venue lookup unavailable right now."
        : "Add GOOGLE_PLACES_API_KEY for venue discovery.",
    });
  }

  const events = rankEvents(live);
  const categories = [
    ...new Set(events.map((e) => e.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return {
    events,
    sources,
    categories,
    refreshedAt: new Date().toISOString(),
  };
}

export function findEventInFeed(feed: EventsFeed, id: string) {
  return feed.events.find((e) => e.id === id) ?? getCoastEventFallback(id);
}

function getCoastEventFallback(id: string) {
  return COAST_EVENTS.find((e) => e.id === id) ?? null;
}
