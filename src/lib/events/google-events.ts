import type { CoastEvent } from "@/lib/data/coast-events";
import { DESTINATION } from "@/lib/destination";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";

type PlaceHit = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
  photos?: { name?: string }[];
};

/**
 * Google Places does not expose a dated events calendar.
 * We surface live venues / nightlife / culture spots as "happening around"
 * discovery cards, linked to Google Maps, so the feed stays useful without
 * inventing fake showtimes.
 */
export async function fetchGoogleVenueHighlights(): Promise<CoastEvent[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return [];

  const queries = [
    "live music venue Nairobi Kenya",
    "concert hall Nairobi Kenya",
    "nightlife club Westlands Nairobi",
    "events venue Mombasa Kenya",
    "cultural centre Nairobi Kenya",
  ];

  const results = await Promise.all(
    queries.map(async (textQuery) => {
      try {
        const res = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.photos",
            },
            body: JSON.stringify({
              textQuery,
              regionCode: "KE",
              maxResultCount: 4,
              locationBias: {
                circle: {
                  center: {
                    latitude: DESTINATION.coords.lat,
                    longitude: DESTINATION.coords.lon,
                  },
                  radius: 120000,
                },
              },
            }),
            next: { revalidate: 1800 },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!res.ok) return [] as PlaceHit[];
        const json = (await res.json()) as { places?: PlaceHit[] };
        return json.places ?? [];
      } catch {
        return [] as PlaceHit[];
      }
    }),
  );

  const seen = new Set<string>();
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 12 * 60 * 60 * 1000);

  const events: CoastEvent[] = [];
  for (const place of results.flat()) {
    const id = place.id?.replace(/^places\//, "");
    const name = place.displayName?.text?.trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);

    const address = place.formattedAddress || "Kenya";
    const area =
      address
        .split(",")
        .map((s) => s.trim())
        .find((p) =>
          /nairobi|mombasa|diani|westlands|kilimani|karen|nyali|kisumu/i.test(
            p,
          ),
        ) || address.split(",")[0]?.trim() || "Kenya";

    // Do not embed Places photo URLs with the API key in the client.
    const imageUrl = FALLBACK_IMAGE;

    const typeLabel =
      place.primaryTypeDisplayName?.text || "Venue · Culture";
    const ratingNote =
      typeof place.rating === "number"
        ? ` · ${place.rating.toFixed(1)}★ on Google`
        : "";

    events.push({
      id: `gplace-${id}`,
      title: name,
      venue: name,
      area,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      imageUrl,
      category: `Google · ${typeLabel}`,
      summary: `Live venue on Google Maps${ratingNote}. Check their page for tonight's lineup.`,
      about: `${name} is a Google-listed venue in Kenya (${address}). Use Maps for directions and the venue site for current shows.`,
      priceFromKes: null,
      isFree: false,
      ticketPlatform: "Google Maps",
      ticketUrl:
        place.websiteUri ||
        place.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " Kenya")}`,
      bookingSteps: [
        "Open the Google Maps / venue link.",
        "Confirm tonight's show times on the venue page or socials.",
        "Book tickets on the venue's preferred platform when listed.",
        "Allow time for Nairobi / coast traffic.",
      ],
      organizer: name,
      mapsUrl:
        place.googleMapsUri ||
        `https://maps.google.com/?q=${encodeURIComponent(address)}`,
      source: "google",
    });
  }

  return events.slice(0, 16);
}
