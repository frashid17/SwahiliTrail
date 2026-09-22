import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson, sanitizeAiStrings } from "@/lib/ai/gemini";
import { hotelsForArea, HOTELS } from "@/lib/data/hotels";
import {
  RESTAURANTS,
  restaurantsForArea,
} from "@/lib/data/restaurants";
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
  rankedIds: string[];
  rationale: string;
  tips: string[];
};

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const area = input.areaPreference || "whole-coast";
    const isHotels = input.mode === "hotels";

    const catalogueSource = isHotels
      ? hotelsForArea(area)
      : restaurantsForArea(area);

    const catalogue = isHotels
      ? (catalogueSource as typeof HOTELS)
          .map(
            (h) =>
              `${h.id} | ${h.name} | ${h.area} | ${h.pricePerNight} KES/night | rating ${h.rating} | tags: ${h.tags.join(", ")} | vibe: ${h.vibe} | ${h.description}`,
          )
          .join("\n")
      : (catalogueSource as typeof RESTAURANTS)
          .map(
            (r) =>
              `${r.id} | ${r.name} | ${r.area} | ${r.cuisine} | avg meal ${r.avgMealKes} KES | rating ${r.rating} | tags: ${r.tags.join(", ")} | vibe: ${r.vibe} | ${r.description}`,
          )
          .join("\n");

    const areaInstruction =
      area === "whole-coast"
        ? "Traveler wants options from the whole Kenyan coast around Mombasa."
        : `Traveler prefers the ${area} area.`;

    const match = await generateJson<MatchResult>(
      `Match ${isHotels ? "hotels" : "restaurants"} for a Mombasa / Kenyan coast traveler.
Budget max ${isHotels ? "per night" : "per meal"}: ${input.budgetMax} KES
Desired vibe: ${input.vibe}
Travelers: ${input.travelers}
Must-haves: ${input.mustHaves.join(", ") || "none"}
Area preference: ${area}
${areaInstruction}

Catalogue (only use these ids):
${catalogue}

Return JSON:
{
  "rankedIds": string[],
  "rationale": string,
  "tips": string[]
}
Rank as many good fits as possible from the catalogue (aim for 5 to 8 ids when available).
Use exact names from the catalogue in rationale/tips.`,
      `You are a ${isHotels ? "hotel" : "restaurant"} matching engine for Swahili Trail. Only recommend items from the provided catalogue.`,
    );

    const validIds = new Set(catalogueSource.map((item) => item.id));
    let rankedIds = match.rankedIds.filter((id) => validIds.has(id));

    if (isHotels) {
      const inBudget = (catalogueSource as typeof HOTELS).filter(
        (h) => h.pricePerNight <= input.budgetMax,
      );
      const rankedInBudget = rankedIds
        .map((id) => inBudget.find((h) => h.id === id)!)
        .filter(Boolean);
      const extras = inBudget.filter(
        (h) => !rankedInBudget.some((r) => r.id === h.id),
      );
      const hotels = [...rankedInBudget, ...extras].slice(0, 8);

      const clean = sanitizeAiStrings({
        rationale: match.rationale,
        tips: match.tips,
      });

      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from("hotel_matches").insert({
          user_id: userId,
          preferences: input,
          matched_hotel_ids: hotels.map((h) => h.id),
          rationale: clean.rationale,
        });
      }

      return NextResponse.json({
        mode: "hotels",
        hotels,
        restaurants: [],
        rationale: clean.rationale,
        tips: clean.tips,
      });
    }

    const inBudget = (catalogueSource as typeof RESTAURANTS).filter(
      (r) => r.avgMealKes <= input.budgetMax,
    );
    const rankedInBudget = rankedIds
      .map((id) => inBudget.find((r) => r.id === id)!)
      .filter(Boolean);
    const extras = inBudget.filter(
      (r) => !rankedInBudget.some((x) => x.id === r.id),
    );
    const restaurants = [...rankedInBudget, ...extras].slice(0, 8);

    const clean = sanitizeAiStrings({
      rationale: match.rationale,
      tips: match.tips,
    });

    return NextResponse.json({
      mode: "restaurants",
      hotels: [],
      restaurants,
      rationale: clean.rationale,
      tips: clean.tips,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to match places";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
