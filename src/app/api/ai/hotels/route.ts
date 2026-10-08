import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fireAndForget,
  sanitizeAiStrings,
  streamGenerateContent,
} from "@/lib/ai/gemini";
import { ndjsonResponse } from "@/lib/ai/ndjson-stream";
import {
  aiPlaceToHotel,
  aiPlaceToRestaurant,
  type AiMatchedPlace,
} from "@/lib/ai/place-matches";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  assertAiQuota,
  consumeAiQuota,
  type AiQuotaStatus,
} from "@/lib/ai/quota";
import { hotelsForArea, HOTELS, type Hotel } from "@/lib/data/hotels";
import {
  RESTAURANTS,
  restaurantsForArea,
  type Restaurant,
} from "@/lib/data/restaurants";
import { attachGooglePhotos } from "@/lib/google-places";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  mode: z.enum(["hotels", "restaurants"]).default("hotels"),
  budgetMax: z.number().int().min(500).max(100000),
  vibe: z.string().min(2).max(120),
  travelers: z.enum(["solo", "couple", "family", "friends"]),
  mustHaves: z.array(z.string()).max(8),
  areaPreference: z.string().optional(),
});

type MatchResult = {
  rationale: string;
  tips: string[];
  places: AiMatchedPlace[];
};

function quotaPayload(quota: AiQuotaStatus) {
  return {
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  };
}

function areaLabel(area: string) {
  return area === "whole-coast" ? "Kenya (any region)" : area;
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const fingerprint = [
      input.mode,
      input.budgetMax,
      input.vibe,
      input.travelers,
      input.areaPreference ?? "",
      input.mustHaves.join(","),
    ].join("|");
    const quota = await assertAiQuota(userId, "hotels", fingerprint);
    if (!quota.ok) {
      return NextResponse.json(quota.responseBody, {
        status: quota.httpStatus,
      });
    }

    const area = input.areaPreference || "whole-coast";
    const isHotels = input.mode === "hotels";
    const areaLocked = area !== "whole-coast";
    const region = areaLabel(area);

    const catalogueSource = isHotels
      ? hotelsForArea(area)
      : restaurantsForArea(area);

    const catalogueText =
      catalogueSource.length > 0
        ? isHotels
          ? (catalogueSource as typeof HOTELS)
              .map(
                (h) =>
                  `${h.id}|${h.name}|${h.area}|KES ${h.pricePerNight}|${h.rating}|${h.tags.slice(0, 4).join(",")}`,
              )
              .join("\n")
          : (catalogueSource as typeof RESTAURANTS)
              .map(
                (r) =>
                  `${r.id}|${r.name}|${r.area}|${r.cuisine}|KES ${r.avgMealKes}|${r.rating}`,
              )
              .join("\n")
        : "(empty — recommend real well-known places in this area from your knowledge)";

    const areaRule = areaLocked
      ? `HARD RULE: Every place MUST be in ${area} / ${region}. Never recommend the coast when the traveler chose inland (or vice versa). If vibe mentions beach but area is inland, adapt (pool, spa, views) inside ${area}.`
      : "Pick the best Kenya fits and state which region each place is in.";

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `Recommend ${isHotels ? "hotels / lodges / camps" : "restaurants"} for a Kenya traveler.

Budget max ${isHotels ? "per night" : "per meal"}: ${input.budgetMax} KES
Vibe: ${input.vibe}
Travelers: ${input.travelers}
Must-haves: ${input.mustHaves.join(", ") || "none"}
Area preference: ${region}
${areaRule}

Optional Swahili Trail catalogue (prefer these when they fit — set catalogueId to the id):
${catalogueText}

You MAY and SHOULD recommend real places not in the catalogue when needed (e.g. Maasai Mara lodges, Amboseli camps, Nanyuki ranches). Use real property names travelers can book.

Return JSON:
{
  "rationale": string,
  "tips": string[],
  "places": [{
    "catalogueId": string|null,
    "name": string,
    "area": string,
    "rating": number,
    "priceKes": number,
    "vibe": string,
    "description": string,
    "tags": string[],
    "amenities": string[],
    "cuisine": string|null,
    "websiteUrl": string|null
  }]
}

Rules:
- Return 5 to 8 places, ranked best-first.
- priceKes = estimated ${isHotels ? "nightly" : "per-person meal"} cost in KES near the budget when possible.
- Keep names accurate. Short descriptions (1-2 sentences). Tips max 3.
- Stay inside the selected area.`,
        `You recommend ${isHotels ? "stays" : "restaurants"} for Swahili Trail across Kenya. Prefer catalogue ids when they fit; otherwise suggest real places from knowledge. Plain language.`,
        { maxOutputTokens: 1600, temperature: 0.4, json: true },
      )) {
        accumulated += chunk;
        emit({ type: "delta", text: chunk });
      }

      let match: MatchResult;
      try {
        match = JSON.parse(accumulated) as MatchResult;
      } catch {
        throw new Error("Could not parse match results. Please try again.");
      }

      const places = Array.isArray(match.places) ? match.places : [];
      const cleanMeta = sanitizeAiStrings({
        rationale: match.rationale,
        tips: (match.tips ?? []).slice(0, 3),
      });

      if (isHotels) {
        const hotels: Hotel[] = [];
        const seen = new Set<string>();

        for (const place of places) {
          const catalogueId =
            typeof place.catalogueId === "string" ? place.catalogueId : null;
          const fromCatalogue = catalogueId
            ? (catalogueSource as typeof HOTELS).find(
                (h) => h.id === catalogueId,
              ) || HOTELS.find((h) => h.id === catalogueId)
            : null;

          const byName =
            fromCatalogue ||
            (catalogueSource as typeof HOTELS).find(
              (h) =>
                h.name.toLowerCase() ===
                (place.name || "").trim().toLowerCase(),
            );

          const hotel = aiPlaceToHotel(place, byName ?? null);
          if (seen.has(hotel.id)) continue;
          if (
            areaLocked &&
            !byName &&
            place.area &&
            !place.area
              .toLowerCase()
              .includes(
                area.toLowerCase().split(/[\/,]/)[0]!.trim().toLowerCase(),
              ) &&
            !area.toLowerCase().includes(place.area.toLowerCase().slice(0, 6))
          ) {
            const areaKey = area.toLowerCase();
            const placeArea = place.area.toLowerCase();
            const ok =
              placeArea.includes("mara") && areaKey.includes("mara")
                ? true
                : placeArea.includes("nairobi") && areaKey.includes("nairobi")
                  ? true
                  : placeArea.includes(areaKey.split(" ")[0]!) ||
                    areaKey
                      .split(" ")
                      .some((w) => w.length > 3 && placeArea.includes(w));
            if (!ok) continue;
          }
          seen.add(hotel.id);
          hotels.push(hotel);
          if (hotels.length >= 8) break;
        }

        for (const h of catalogueSource as typeof HOTELS) {
          if (hotels.length >= 8) break;
          if (seen.has(h.id)) continue;
          if (h.pricePerNight > input.budgetMax * 1.35) continue;
          seen.add(h.id);
          hotels.push(h);
        }

        emit({ type: "delta", text: "" });
        const hotelsWithPhotos = await attachGooglePhotos(hotels);

        const nextQuota = await consumeAiQuota(userId, "hotels", {
          requestHash: quota.requestHash,
          plan: quota.plan,
        });

        const supabase = createAdminClient();
        if (supabase) {
          fireAndForget(
            Promise.resolve(
              supabase.from("hotel_matches").insert({
                user_id: userId,
                preferences: input,
                matched_hotel_ids: hotelsWithPhotos.map((h) => h.id),
                rationale: cleanMeta.rationale,
              }),
            ),
          );
        }

        emit({
          type: "done",
          mode: "hotels",
          hotels: hotelsWithPhotos,
          restaurants: [],
          rationale:
            cleanMeta.rationale ||
            `Suggested stays for ${region} based on your preferences.`,
          tips: cleanMeta.tips,
          quota: quotaPayload(nextQuota),
        });
        return;
      }

      const restaurants: Restaurant[] = [];
      const seen = new Set<string>();

      for (const place of places) {
        const catalogueId =
          typeof place.catalogueId === "string" ? place.catalogueId : null;
        const fromCatalogue = catalogueId
          ? (catalogueSource as typeof RESTAURANTS).find(
              (r) => r.id === catalogueId,
            ) || RESTAURANTS.find((r) => r.id === catalogueId)
          : null;
        const byName =
          fromCatalogue ||
          (catalogueSource as typeof RESTAURANTS).find(
            (r) =>
              r.name.toLowerCase() ===
              (place.name || "").trim().toLowerCase(),
          );

        const restaurant = aiPlaceToRestaurant(place, byName ?? null);
        if (seen.has(restaurant.id)) continue;
        seen.add(restaurant.id);
        restaurants.push(restaurant);
        if (restaurants.length >= 8) break;
      }

      for (const r of catalogueSource as typeof RESTAURANTS) {
        if (restaurants.length >= 8) break;
        if (seen.has(r.id)) continue;
        if (r.avgMealKes > input.budgetMax * 1.35) continue;
        seen.add(r.id);
        restaurants.push(r);
      }

      const restaurantsWithPhotos = await attachGooglePhotos(restaurants);

      const nextQuota = await consumeAiQuota(userId, "hotels", {
        requestHash: quota.requestHash,
        plan: quota.plan,
      });

      emit({
        type: "done",
        mode: "restaurants",
        hotels: [],
        restaurants: restaurantsWithPhotos,
        rationale:
          cleanMeta.rationale ||
          `Suggested restaurants for ${region} based on your preferences.`,
        tips: cleanMeta.tips,
        quota: quotaPayload(nextQuota),
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to match places";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
