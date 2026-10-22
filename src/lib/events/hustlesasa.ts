import type { CoastEvent } from "@/lib/data/coast-events";

const MARKETPLACE_URL = "https://www.hustle.events/en";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80";

type ParsedHustleEvent = {
  id: string;
  title: string;
  slug: string;
  venue: string;
  country: string;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  category: string;
  priceKes: number | null;
  imageUrl: string;
  description: string;
  organizer: string;
};

function decodeFlightPayload(html: string) {
  const parts = [
    ...html.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g),
  ].map((m) => m[1]);
  if (!parts.length) return "";
  return parts
    .map((part) => {
      try {
        return JSON.parse(`"${part}"`) as string;
      } catch {
        return part
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    })
    .join("");
}

function padTime(raw: string | null) {
  if (!raw) return "18:00:00";
  const cleaned = raw.trim().replace(/\./g, ":");
  const m = cleaned.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return "18:00:00";
  const hh = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const ss = (m[3] ?? "0").padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function toIso(date: string, time: string | null) {
  return `${date}T${padTime(time)}+03:00`;
}

function firstNumber(hay: string, pattern: RegExp) {
  const m = hay.match(pattern);
  return m ? Number(m[1]) : null;
}

function firstString(hay: string, pattern: RegExp) {
  const m = hay.match(pattern);
  return m?.[1] ?? null;
}

/** Parse HustleSasa marketplace SSR for live event listings. */
export function parseHustleSasaMarketplace(html: string): ParsedHustleEvent[] {
  const joined = decodeFlightPayload(html);
  if (!joined.includes("product_type")) return [];

  const blocks = joined.split(/(?=\{"marketplace_categories")/);
  const out: ParsedHustleEvent[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (!block.includes('"product_type":"event"')) continue;

    const head = block.match(
      /"marketplace_categories"\s*:\s*\[([\s\S]*?)\]\s*,\s*"id"\s*:\s*"([^"]+)"\s*,\s*"title"\s*:\s*"([^"]+)"/,
    );
    if (!head) continue;

    const categoriesBlob = head[1];
    const id = head[2];
    const title = head[3].trim();
    if (!title || seen.has(id)) continue;

    const category =
      firstString(categoriesBlob, /"title"\s*:\s*"([^"]+)"/) || "Live event";
    const categorySlugs = [
      ...categoriesBlob.matchAll(/"slug"\s*:\s*"([^"]+)"/g),
    ].map((m) => m[1]);

    const allSlugs = [...block.matchAll(/"slug"\s*:\s*"([^"]+)"/g)].map(
      (m) => m[1],
    );
    const slug =
      allSlugs.find((s) => !categorySlugs.includes(s)) ||
      allSlugs[allSlugs.length - 1] ||
      id;

    const country = firstString(block, /"country"\s*:\s*"([A-Z]{2})"/) || "KE";
    const venue =
      firstString(block, /"venue"\s*:\s*"([^"]+)"/) || "Kenya venue";
    const startDate = firstString(
      block,
      /"start_date"\s*:\s*"(20\d{2}-\d{2}-\d{2})"/,
    );
    if (!startDate) continue;
    const startTime = firstString(block, /"start_time"\s*:\s*"([^"]+)"/);
    const endDate = firstString(
      block,
      /"end_date"\s*:\s*"(20\d{2}-\d{2}-\d{2})"/,
    );
    const priceKes =
      firstNumber(block, /"selling_price"\s*:\s*\{\s*"KES"\s*:\s*(\d+)/) ??
      firstNumber(block, /"minimum_price"[\s\S]{0,120}"KES"\s*:\s*(\d+)/);
    const imageUrl =
      firstString(block, /"cdn_url"\s*:\s*"(https:\/\/[^"]+)"/) ||
      firstString(block, /"url"\s*:\s*"(https:\/\/firebasestorage[^"]+)"/) ||
      FALLBACK_IMAGE;
    const description =
      firstString(block, /"description"\s*:\s*"([^"]*)"/)?.replace(
        /\\n/g,
        " ",
      ) || "";
    const organizer =
      firstString(block, /"hustle"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/) ||
      "HustleSasa organizer";

    seen.add(id);
    out.push({
      id,
      title,
      slug,
      venue,
      country,
      startDate,
      startTime,
      endDate,
      category,
      priceKes,
      imageUrl: imageUrl.replace(/\\u0026/g, "&"),
      description,
      organizer,
    });
  }

  return out;
}

function normalizeArea(venue: string, country: string) {
  const hay = venue.toLowerCase();
  if (/uganda|kampala|nyege/.test(hay)) return "Uganda";
  if (/mombasa|nyali|diani|malindi|watamu|kilifi|lamu/.test(hay)) {
    return "Mombasa";
  }
  if (
    /nairobi|westlands|parklands|kilimani|karen|runda|tigoni|athi|ngara|mpaka|kiambu/.test(
      hay,
    )
  ) {
    return "Nairobi";
  }
  if (/nakuru|naivasha/.test(hay)) return "Nakuru";
  if (/kisumu/.test(hay)) return "Kisumu";
  const parts = venue.split(",").map((s) => s.trim()).filter(Boolean);
  const withoutCountry = parts.filter(
    (p) => !/^(kenya|ke)$/i.test(p) && p.toLowerCase() !== country.toLowerCase(),
  );
  return withoutCountry[withoutCountry.length - 1] || parts[0] || "Kenya";
}

function mapParsed(ev: ParsedHustleEvent): CoastEvent {
  const area = normalizeArea(ev.venue, ev.country);

  const ticketUrl = `https://www.hustle.events/events/${encodeURIComponent(ev.slug)}`;
  const summary =
    ev.description.slice(0, 160) ||
    `${ev.title} on HustleSasa · ${ev.category}`;

  return {
    id: `hs-${ev.id}`,
    title: ev.title,
    venue: ev.venue,
    area,
    startsAt: toIso(ev.startDate, ev.startTime),
    endsAt: ev.endDate ? toIso(ev.endDate, "23:59:00") : undefined,
    imageUrl: ev.imageUrl || FALLBACK_IMAGE,
    category: ev.category,
    summary,
    about:
      ev.description ||
      `${ev.title} is listed on HustleSasa. Check the ticket page for lineup, age rules, and entry.`,
    priceFromKes: ev.priceKes,
    isFree: ev.priceKes === 0,
    ticketPlatform: "HustleSasa",
    ticketUrl,
    bookingSteps: [
      "Open the HustleSasa event page.",
      "Pick a ticket tier and quantity.",
      "Pay with M-Pesa or card.",
      "Keep the QR / WhatsApp ticket ready at the door.",
    ],
    organizer: ev.organizer,
    mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(ev.venue)}`,
    source: "hustlesasa",
  };
}

export async function fetchHustleSasaEvents(): Promise<CoastEvent[]> {
  const res = await fetch(MARKETPLACE_URL, {
    headers: {
      "User-Agent": "SwahiliTrail/1.0 (kenya travel platform; events feed)",
      Accept: "text/html",
    },
    next: { revalidate: 120 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HustleSasa ${res.status}`);
  const html = await res.text();
  return parseHustleSasaMarketplace(html).map(mapParsed);
}
