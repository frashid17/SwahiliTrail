import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson, sanitizeAiStrings } from "@/lib/ai/gemini";
import { ATTRACTIONS } from "@/lib/data/attractions";
import { carHiresForMode, type TransportMode } from "@/lib/data/car-hires";
import { HOTELS } from "@/lib/data/hotels";
import { RESTAURANTS } from "@/lib/data/restaurants";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import { createAdminClient } from "@/lib/supabase/admin";
import { AI_REGION_CONTEXT, DESTINATION, SUMMIT } from "@/lib/destination";

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
      `Create a ${input.days}-day trip plan centered on ${DESTINATION.regionLong} for ${input.partySize} traveler(s).
Context: ${AI_REGION_CONTEXT}
Summit backdrop: ${SUMMIT.shortName} (${SUMMIT.datesLabel}) in ${SUMMIT.town} - theme "${SUMMIT.theme}".
Companions: ${input.companions}
Interests: ${input.interests.join(", ")}
Budget tier: ${input.budget}
Pace: ${input.pace}
Stay base area: ${
        input.stayArea === "whole-coast" || !input.stayArea
          ? "Tana River County (Hola / delta / Garsen) with optional Jumuiya coast day trips. Recommend the best base for their interests."
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
- Prefer Tana River / delta experiences; use wider coast only when it clearly helps.
- Include realistic KES cost estimates for the whole party when possible.
- Mention heat, road conditions, river/delta practicalities, and cash/M-Pesa.
- Tone: clear and local - like a county tourism officer writing notes, not marketing copy.
- No emojis in titles or day themes unless necessary for clarity.
- Plain text only inside strings (no markdown, no em dashes).
- Avoid buzzwords like "unlock", "journey", "curate", "seamless", or "elevate".`,
      "You plan trips for Swahili Trail across Tana River County and nearby coast towns. Be specific, local, and budget-aware.",
    );

    const cleanPlan = sanitizeAiStrings(plan);

    const supabase = createAdminClient();
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
