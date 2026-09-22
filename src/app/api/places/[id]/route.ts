import { NextResponse } from "next/server";
import { getExplorePlace } from "@/lib/data/explore-places";
import {
  normalizePlaceResourceId,
  resolveGooglePlaceId,
} from "@/lib/google-places";
import type { GoogleReview, PlaceLivePayload } from "@/lib/place-live";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const place = getExplorePlace(id);
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const mapsFallback =
    place.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.googleQuery)}`;

  if (!apiKey) {
    const payload: PlaceLivePayload = {
      placeId: place.id,
      source: "links-only",
      googleMapsUri: mapsFallback,
      websiteUri: place.websiteUrl ?? undefined,
      reviews: [],
      note: "Add GOOGLE_PLACES_API_KEY to fetch live Google reviews. Until then we deep-link to Google Maps and TripAdvisor.",
    };
    return NextResponse.json(payload);
  }

  try {
    const resolved = await resolveGooglePlaceId(apiKey, place);
    if (!resolved) {
      return NextResponse.json({
        placeId: place.id,
        source: "links-only",
        googleMapsUri: mapsFallback,
        reviews: [],
        note: "Google Places found no match for this venue yet. Try the Google Maps link below.",
      } satisfies PlaceLivePayload);
    }

    const placeResourceId = normalizePlaceResourceId(resolved.id);

    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeResourceId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,rating,userRatingCount,googleMapsUri,websiteUri,reviews",
        },
        next: { revalidate: 3600 },
      },
    );

    if (!detailsRes.ok) {
      const errText = await detailsRes.text();
      console.error("[places details]", placeResourceId, detailsRes.status, errText);
      throw new Error(`Places details ${detailsRes.status}`);
    }

    const details = (await detailsRes.json()) as {
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      websiteUri?: string;
      reviews?: {
        authorAttribution?: { displayName?: string; uri?: string };
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
      }[];
    };

    const reviews: GoogleReview[] = (details.reviews ?? []).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Google user",
      rating: r.rating ?? 0,
      text: r.text?.text ?? "",
      relativeTime: r.relativePublishTimeDescription ?? "",
      authorUri: r.authorAttribution?.uri,
    }));

    const payload: PlaceLivePayload = {
      placeId: place.id,
      source: "google-places",
      displayName: details.displayName?.text ?? resolved.matchedName,
      rating: details.rating,
      userRatingCount: details.userRatingCount,
      googleMapsUri: details.googleMapsUri ?? mapsFallback,
      websiteUri: details.websiteUri ?? place.websiteUrl ?? undefined,
      reviews,
      note: "Reviews from Google Places (max 5, relevance-sorted). Attribution: Google.",
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[places live]", error);
    return NextResponse.json({
      placeId: place.id,
      source: "links-only",
      googleMapsUri: mapsFallback,
      reviews: [],
      note: "Google Places request failed. Use Google Maps / TripAdvisor links below.",
    } satisfies PlaceLivePayload);
  }
}
