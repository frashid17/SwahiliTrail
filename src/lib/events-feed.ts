import type { CoastEvent } from "@/lib/data/coast-events";
import { COAST_EVENTS } from "@/lib/data/coast-events";

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

  return {
    id: `tm-${ev.id}`,
    title: ev.name,
    venue: venue?.name ?? "Kenya venue",
    area: venue?.city?.name ?? "Kenya",
    startsAt: start,
    imageUrl: pickImage(ev.images),
    category: ev.classifications?.[0]?.segment?.name ?? "Live event",
    summary: ev.info?.slice(0, 160) ?? "Live listing from Ticketmaster Kenya.",
    about:
      ev.info ||
      ev.pleaseNote ||
      `${ev.name} is listed on Ticketmaster. Check the official ticket page for lineup, age policy, and entry rules.`,
    priceFromKes: typeof min === "number" ? Math.round(min) : null,
    isFree: false,
    ticketPlatform: "Ticketmaster",
    ticketUrl,
    bookingSteps: [
      "Open the Ticketmaster event page from the Book tickets button.",
      "Sign in or create a Ticketmaster account.",
      "Select quantity and seating / GA options.",
      "Pay and store your mobile tickets for venue scan.",
    ],
    organizer: "Ticketmaster listing",
    mapsUrl: venue?.name
      ? `https://maps.google.com/?q=${encodeURIComponent(`${venue.name} ${venue.city?.name ?? "Kenya"}`)}`
      : "https://maps.google.com/?q=Mombasa+Kenya",
    source: "ticketmaster",
  };
}

export type EventsFeed = {
  events: CoastEvent[];
  sources: { id: string; label: string; live: boolean; note: string }[];
  refreshedAt: string;
};

export async function fetchEventsFeed(): Promise<EventsFeed> {
  const sources: EventsFeed["sources"] = [
    {
      id: "coast-calendar",
      label: "Swahili Trail coast calendar",
      live: true,
      note: "Curated Mombasa / Kilifi listings with Quicket & eGotickets booking paths.",
    },
  ];

  const live: CoastEvent[] = [...COAST_EVENTS];
  const key = process.env.TICKETMASTER_API_KEY;

  if (key) {
    try {
      const url = new URL(
        "https://app.ticketmaster.com/discovery/v2/events.json",
      );
      url.searchParams.set("apikey", key);
      url.searchParams.set("countryCode", "KE");
      url.searchParams.set("latlong", "-4.0435,39.6682");
      url.searchParams.set("radius", "150");
      url.searchParams.set("unit", "km");
      url.searchParams.set("size", "20");
      url.searchParams.set("sort", "date,asc");

      const res = await fetch(url, { next: { revalidate: 900 } });
      if (res.ok) {
        const json = (await res.json()) as {
          _embedded?: { events?: TicketmasterEvent[] };
        };
        const mapped = (json._embedded?.events ?? [])
          .map(mapTicketmaster)
          .filter((e): e is CoastEvent => Boolean(e));
        live.push(...mapped);
        sources.push({
          id: "ticketmaster",
          label: "Ticketmaster Discovery",
          live: true,
          note: "Live commercial concerts & venue events near the coast.",
        });
      } else {
        sources.push({
          id: "ticketmaster",
          label: "Ticketmaster Discovery",
          live: false,
          note: `Upstream returned ${res.status}. Showing coast calendar only.`,
        });
      }
    } catch {
      sources.push({
        id: "ticketmaster",
        label: "Ticketmaster Discovery",
        live: false,
        note: "Could not reach Ticketmaster. Showing coast calendar only.",
      });
    }
  } else {
    sources.push({
      id: "ticketmaster",
      label: "Ticketmaster Discovery",
      live: false,
      note: "Add TICKETMASTER_API_KEY for live Ticketmaster Kenya listings.",
    });
  }

  live.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return {
    events: live,
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
