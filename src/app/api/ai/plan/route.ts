import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson, sanitizeAiStrings } from "@/lib/ai/gemini";
import { ATTRACTIONS } from "@/lib/data/attractions";
import { carHiresForMode, type TransportMode } from "@/lib/data/car-hires";
import { HOTELS } from "@/lib/data/hotels";
import { RESTAURANTS } from "@/lib/data/restaurants";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import { createClient } from "@/lib/supabase/server";

const cartItemSchema = z.object({
  id: z.string(),
  type: z.enum(["attraction", "wildlife", "hotel", "restaurant"]),
  name: z.string(),
  area: z.string(),
  estCostKes: z.number().optional(),
});

const bodySchema = z.object({
  days: z.number().int().min(1).max(10),
  interests: z.array(z.string()).min(1).max(10),
  budget: z.enum(["budget", "mid", "luxury"]),
  pace: z.enum(["relaxed", "balanced", "packed"]),
  companions: z.enum(["solo", "couple", "family", "friends"]),
  stayPreference: z.string().max(120).optional(),
  stayArea: z.string().max(80).optional(),
  partySize: z.number().int().min(1).max(12).default(2),
  transportMode: z
    .enum(["none", "airport-pickup", "car-hire", "chauffeur", "airport-and-car"])
    .default("none"),
  cart: z.array(cartItemSchema).max(24).optional(),
});

type DayPlan = {
  day: number;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  foodTip: string;
  transportTip: string;
  estimatedDayCostKes: number;
};

type PlanResult = {
  title: string;
  summary: string;
  recommendedStay: string;
  days: DayPlan[];
  packingTips: string[];
  localEtiquette: string[];
  budgetBreakdown: {
    lodgingKes: number;
    activitiesKes: number;
    foodKes: number;
    transportKes: number;
    contingencyKes: number;
    totalKes: number;
    notes: string;
  };
};

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());

    const attractions = ATTRACTIONS.map(
      (a) =>
        `${a.id} | ${a.name} (${a.category}, ${a.area}) ~${a.durationHours}h ~KES ${a.estCostKes}: ${a.blurb}`,
    ).join("\n");

    const wildlife = WILDLIFE_SITES.map(
      (w) =>
        `${w.id} | ${w.name} (${w.type}, ${w.region}) ~KES ${w.estEntryKes}: ${w.blurb}`,
    ).join("\n");

    const hotels = HOTELS.map(
      (h) =>
        `${h.id} | ${h.name} | ${h.area} | KES ${h.pricePerNight}/night | ${h.vibe}`,
    ).join("\n");

    const restaurants = RESTAURANTS.map(
      (r) =>
        `${r.id} | ${r.name} | ${r.area} | avg KES ${r.avgMealKes} | ${r.cuisine}`,
    ).join("\n");

    const cartText =
      input.cart && input.cart.length > 0
        ? input.cart
            .map(
              (c) =>
                `${c.type}:${c.id} | ${c.name} | ${c.area}${c.estCostKes != null ? ` | ~KES ${c.estCostKes}` : ""}`,
            )
            .join("\n")
        : "(none selected)";

    const budgetGuide =
      input.budget === "budget"
        ? "Keep lodging under ~KES 9,000/night when possible and favor free/low-cost activities."
        : input.budget === "luxury"
          ? "Allow nicer resorts, seafood dinners, and private transfers where useful."
          : "Balance comfortable lodging with a mix of paid attractions and local meals.";

    const transportMode = input.transportMode as TransportMode;
    const hires = carHiresForMode(transportMode);
    const transportGuide =
      transportMode === "none"
        ? "Traveler prefers Uber/Bolt, taxis, and walking. Mention those in transport tips."
        : transportMode === "airport-pickup"
          ? "Include Moi International Airport (MBA) pickup on day 1 and drop-off on the last day. Suggest booking ahead."
          : transportMode === "car-hire"
            ? "Assume self-drive car hire for the trip. Factor fuel, parking, and Likoni ferry into tips and costs."
            : transportMode === "chauffeur"
              ? "Assume a hired car with driver for daily touring. Factor daily chauffeur rates into transport costs."
              : "Include airport pickup plus multi-day car hire (self-drive or chauffeur). Factor both into the budget.";

    const carHireText =
      hires.length > 0
        ? hires
            .map(
              (c) =>
                `${c.name} | ${c.phoneDisplay} | ${c.websiteUrl} | ${c.areas}`,
            )
            .join("\n")
        : "(none)";

    const plan = await generateJson<PlanResult>(
      `Create a ${input.days}-day Mombasa / Kenyan coast trip plan for ${input.partySize} traveler(s).
Companions: ${input.companions}
Interests: ${input.interests.join(", ")}
Budget tier: ${input.budget}
Pace: ${input.pace}
Stay base area: ${
      input.stayArea === "whole-coast" || !input.stayArea
        ? "Whole Kenyan coast around Mombasa (island, north coast, Diani, Kilifi). Recommend the best base for their interests."
        : `${input.stayArea} — prefer lodging and day plans that work well from this base.`
    }
${input.stayPreference ? `Extra stay note: ${input.stayPreference}` : ""}
Transport preference: ${transportMode}
${transportGuide}
${budgetGuide}

Saved wishlist items (prioritize weaving these in when sensible):
${cartText}

Trusted car hire / transfer contacts (mention by name when relevant; do not invent other phone numbers):
${carHireText}

Known attractions:
${attractions}

Wildlife / KWS options:
${wildlife}

Hotels:
${hotels}

Restaurants:
${restaurants}

Return JSON:
{
  "title": string,
  "summary": string,
  "recommendedStay": string,
  "days": [{
    "day": number,
    "theme": string,
    "morning": string,
    "afternoon": string,
    "evening": string,
    "foodTip": string,
    "transportTip": string,
    "estimatedDayCostKes": number
  }],
  "packingTips": string[],
  "localEtiquette": string[],
  "budgetBreakdown": {
    "lodgingKes": number,
    "activitiesKes": number,
    "foodKes": number,
    "transportKes": number,
    "contingencyKes": number,
    "totalKes": number,
    "notes": string
  }
}

Rules:
- Cover all ${input.days} days with concrete places and timing.
- Include realistic KES cost estimates for the whole party when possible.
- Mention ferries, heat, and cash/M-Pesa practicalities.
- Tone: warm and inviting for travelers - short vivid phrases, not dry encyclopedic text.
- Day themes may include 1-2 relevant emojis (beach, wildlife, food, sunset).
- Packing and etiquette tips can start with a fitting emoji.
- Plain text only inside strings (no markdown, no em dashes).`,
      "You are Swahili Trail's expert coastal trip curator for Mombasa tourism. Be specific, local, budget-aware, and make the traveler excited for each day.",
    );

    const cleanPlan = sanitizeAiStrings(plan);

    const supabase = await createClient();
    if (supabase) {
      await supabase.from("itineraries").insert({
        user_id: userId,
        title: cleanPlan.title,
        days: input.days,
        interests: input.interests,
        budget: input.budget,
        plan: cleanPlan,
      });
    }

    return NextResponse.json({ plan: cleanPlan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
