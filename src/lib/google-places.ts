import type { ExplorePlace } from "@/lib/data/explore-places";

const MOMBASA = { latitude: -4.0435, longitude: 39.6682 };
/** Places API (New) max radius for location bias circle (meters). */
const MAX_BIAS_RADIUS_M = 50_000;

type SearchHit = {
  id: string;
  name: string;
  rating?: number;
  reviewCount?: number;
};

function normalizePlaceResourceId(id: string) {
  return id.startsWith("places/") ? id.slice("places/".length) : id;
}

function scoreHit(hit: SearchHit, place: ExplorePlace) {
  const target = place.name.toLowerCase();
  const name = hit.name.toLowerCase();
  let score = 0;
  if (name === target) score += 100;
  if (name.includes(target) || target.includes(name)) score += 40;
  for (const word of place.name.split(/\s+/)) {
    if (word.length > 3 && name.includes(word.toLowerCase())) score += 8;
  }
  for (const tag of place.tags) {
    if (name.includes(tag.toLowerCase())) score += 4;
  }
  score += Math.min(hit.reviewCount ?? 0, 500) / 50;
  score += (hit.rating ?? 0) * 2;
  return score;
}

async function searchText(
  apiKey: string,
  textQuery: string,
): Promise<SearchHit[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      textQuery,
      regionCode: "KE",
      locationBias: {
        circle: {
          center: MOMBASA,
          radius: MAX_BIAS_RADIUS_M,
        },
      },
      maxResultCount: 5,
    }),
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[google-places search]", textQuery, res.status, errText);
    return [];
  }

  const json = (await res.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
    }[];
  };

  return (json.places ?? [])
    .filter((p) => p.id && p.displayName?.text)
    .map((p) => ({
      id: normalizePlaceResourceId(p.id!),
      name: p.displayName!.text!,
      rating: p.rating,
      reviewCount: p.userRatingCount,
    }));
}

export async function resolveGooglePlaceId(
  apiKey: string,
  place: ExplorePlace,
): Promise<{ id: string; matchedName: string } | null> {
  if (place.googlePlaceId) {
    return {
      id: normalizePlaceResourceId(place.googlePlaceId),
      matchedName: place.name,
    };
  }

  const queries = [
    place.googleQuery,
    `${place.name} Mombasa Kenya`,
    place.name,
  ].filter((q, i, arr) => arr.indexOf(q) === i);

  const seen = new Set<string>();
  const hits: SearchHit[] = [];

  for (const query of queries) {
    const batch = await searchText(apiKey, query);
    for (const hit of batch) {
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      hits.push(hit);
    }
    if (hits.length > 0) break;
  }

  if (hits.length === 0) return null;

  hits.sort((a, b) => scoreHit(b, place) - scoreHit(a, place));
  const best = hits[0];
  return { id: best.id, matchedName: best.name };
}

export { normalizePlaceResourceId };
