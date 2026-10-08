import type { ExplorePlace } from "@/lib/data/explore-places";

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
      textQuery: `${textQuery}, Kenya`,
      regionCode: "KE",
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

/**
 * Resolve a unique Google Places photo URL for a named venue in Kenya.
 * Used for AI-matched stays/restaurants that are not in our photo catalogue.
 */
export async function fetchGooglePlacePhotoUrl(
  name: string,
  area: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !name.trim()) return null;

  const query = `${name.trim()} ${area.trim()} Kenya`.replace(/\s+/g, " ");

  try {
    const searchRes = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.photos,places.userRatingCount",
        },
        body: JSON.stringify({
          textQuery: query,
          regionCode: "KE",
          maxResultCount: 3,
        }),
        cache: "no-store",
      },
    );

    if (!searchRes.ok) {
      console.error(
        "[google-places photo search]",
        query,
        searchRes.status,
        await searchRes.text(),
      );
      return null;
    }

    const searchJson = (await searchRes.json()) as {
      places?: {
        id?: string;
        displayName?: { text?: string };
        photos?: { name?: string }[];
        userRatingCount?: number;
      }[];
    };

    const ranked = [...(searchJson.places ?? [])].sort(
      (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0),
    );

    let photoName: string | undefined;
    for (const hit of ranked) {
      const candidate = hit.photos?.[0]?.name;
      if (candidate) {
        photoName = candidate;
        break;
      }
    }

    // Some text-search hits omit photos - fetch place details.
    if (!photoName && ranked[0]?.id) {
      const placeId = normalizePlaceResourceId(ranked[0].id);
      const detailRes = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,photos",
          },
          cache: "no-store",
        },
      );
      if (detailRes.ok) {
        const detail = (await detailRes.json()) as {
          photos?: { name?: string }[];
        };
        photoName = detail.photos?.[0]?.name;
      }
    }

    if (!photoName) return null;

    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true`,
      {
        headers: { "X-Goog-Api-Key": apiKey },
        cache: "no-store",
      },
    );
    if (!mediaRes.ok) return null;

    const media = (await mediaRes.json()) as { photoUri?: string };
    return media.photoUri || null;
  } catch (err) {
    console.error(
      "[google-places photo]",
      name,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/** Attach unique Google photos to a list of named places (parallel, capped). */
export async function attachGooglePhotos<T extends { name: string; area: string; imageUrl: string; id: string }>(
  items: T[],
): Promise<T[]> {
  return Promise.all(
    items.map(async (item, index) => {
      const needsPhoto =
        item.id.startsWith("ai-") ||
        item.imageUrl.includes("unsplash.com") ||
        item.imageUrl.includes("wikimedia.org");

      if (!needsPhoto) return item;

      const photoUrl = await fetchGooglePlacePhotoUrl(item.name, item.area);
      if (!photoUrl) return item;

      // Tiny delay stagger is unnecessary with Promise.all; keep unique URLs as returned.
      void index;
      return { ...item, imageUrl: photoUrl };
    }),
  );
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
