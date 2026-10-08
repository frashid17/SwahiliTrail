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
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  assertAiQuota,
  consumeAiQuota,
  type AiQuotaStatus,
} from "@/lib/ai/quota";
import { ATTRACTIONS } from "@/lib/data/attractions";
import { carHiresForMode, type TransportMode } from "@/lib/data/car-hires";
import { HOTELS } from "@/lib/data/hotels";
import { RESTAURANTS } from "@/lib/data/restaurants";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import { createAdminClient } from "@/lib/supabase/admin";
import { AI_REGION_CONTEXT, DESTINATION } from "@/lib/destination";

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

function quotaPayload(quota: AiQuotaStatus) {
  return {
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  };
}

function interestScore(text: string, interests: string[]) {
  const hay = text.toLowerCase();
  let score = 0;
  for (const interest of interests) {
    const needle = interest.toLowerCase().trim();
    if (needle && hay.includes(needle)) score += 2;
  }
  return score;
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const fingerprint = [
      input.days,
      input.budget,
      input.pace,
      input.companions,
      input.stayArea ?? "",
      input.interests.join(","),
      (input.cart ?? []).map((c) => c.id).join(","),
    ].join("|");
    const quota = await assertAiQuota(userId, "plan", fingerprint);
    if (!quota.ok) {
      return NextResponse.json(quota.responseBody, {
        status: quota.httpStatus,
      });
    }

    const cartIds = new Set((input.cart ?? []).map((c) => c.id));

    // Prefer wishlist + interest matches; keep catalogues short for speed.
    const attractions = [...ATTRACTIONS]
      .sort((a, b) => {
        const sa =
          (cartIds.has(a.id) ? 10 : 0) +
          interestScore(`${a.name} ${a.category} ${a.area} ${a.blurb}`, input.interests);
        const sb =
          (cartIds.has(b.id) ? 10 : 0) +
          interestScore(`${b.name} ${b.category} ${b.area} ${b.blurb}`, input.interests);
        return sb - sa;
      })
      .slice(0, 18)
      .map(
        (a) =>
          `${a.id}|${a.name}|${a.area}|${a.category}|~${a.durationHours}h|KES ${a.estCostKes}`,
      )
      .join("\n");

    const wildlife = [...WILDLIFE_SITES]
      .sort((a, b) => {
        const sa =
          (cartIds.has(a.id) ? 10 : 0) +
          interestScore(`${a.name} ${a.type} ${a.region} ${a.blurb}`, input.interests);
        const sb =
          (cartIds.has(b.id) ? 10 : 0) +
          interestScore(`${b.name} ${b.type} ${b.region} ${b.blurb}`, input.interests);
        return sb - sa;
      })
      .slice(0, 12)
      .map((w) => `${w.id}|${w.name}|${w.region}|KES ${w.estEntryKes}`)
      .join("\n");

    const hotels = [...HOTELS]
      .sort((a, b) => {
        const sa =
          (cartIds.has(a.id) ? 10 : 0) +
          interestScore(`${a.name} ${a.area} ${a.vibe}`, input.interests);
        const sb =
          (cartIds.has(b.id) ? 10 : 0) +
          interestScore(`${b.name} ${b.area} ${b.vibe}`, input.interests);
        return sb - sa;
      })
      .slice(0, 10)
      .map((h) => `${h.id}|${h.name}|${h.area}|KES ${h.pricePerNight}/n`)
      .join("\n");

    const restaurants = [...RESTAURANTS]
      .sort((a, b) => {
        const sa =
          (cartIds.has(a.id) ? 10 : 0) +
          interestScore(`${a.name} ${a.area} ${a.cuisine}`, input.interests);
        const sb =
          (cartIds.has(b.id) ? 10 : 0) +
          interestScore(`${b.name} ${b.area} ${b.cuisine}`, input.interests);
        return sb - sa;
      })
      .slice(0, 8)
      .map((r) => `${r.id}|${r.name}|${r.area}|KES ${r.avgMealKes}|${r.cuisine}`)
      .join("\n");

    const cartText =
      input.cart && input.cart.length > 0
        ? input.cart
            .map(
              (c) =>
                `${c.type}:${c.id}|${c.name}|${c.area}${c.estCostKes != null ? `|KES ${c.estCostKes}` : ""}`,
            )
            .join("\n")
        : "(none)";

    const budgetGuide =
      input.budget === "budget"
        ? "Lodging under ~KES 9,000/night when possible; favor low-cost activities."
        : input.budget === "luxury"
          ? "Allow nicer resorts, seafood dinners, private transfers."
          : "Balance comfortable lodging with paid attractions and local meals.";

    const transportMode = input.transportMode as TransportMode;
    const hires = carHiresForMode(transportMode);
    const transportGuide =
      transportMode === "none"
        ? "Uber/Bolt, taxis, walking."
        : transportMode === "airport-pickup"
          ? "MBA airport pickup day 1 + drop-off last day."
          : transportMode === "car-hire"
            ? "Self-drive hire; fuel, parking, ferry."
            : transportMode === "chauffeur"
              ? "Car with driver daily."
              : "Airport pickup + multi-day car hire.";

    const carHireText =
      hires.length > 0
        ? hires
            .slice(0, 4)
            .map((c) => `${c.name}|${c.phoneDisplay}|${c.areas}`)
            .join("\n")
        : "(none)";

    const stayBase =
      input.stayArea === "whole-coast" || !input.stayArea
        ? "Anywhere in Kenya — pick best base for interests."
        : `${input.stayArea} base.`;

    // Cap output tokens by trip length so long plans don't wait on a 4k budget.
    const maxOutputTokens = Math.min(2200, 500 + input.days * 220);

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `${input.days}-day Kenya plan for ${input.partySize} (${input.companions}).
Region: ${DESTINATION.regionLong}. ${AI_REGION_CONTEXT}
Interests: ${input.interests.join(", ")}
Budget: ${input.budget}. Pace: ${input.pace}. Stay: ${stayBase}
${input.stayPreference ? `Stay note: ${input.stayPreference}` : ""}
Transport: ${transportMode}. ${transportGuide}
${budgetGuide}

Wishlist:
${cartText}

Car hires (use real names/phones only):
${carHireText}

Attractions:
${attractions}

Wildlife:
${wildlife}

Hotels:
${hotels}

Restaurants:
${restaurants}

Return JSON with keys: title, summary, recommendedStay, days[{day,theme,morning,afternoon,evening,foodTip,transportTip,estimatedDayCostKes}], packingTips (max 3), localEtiquette (max 3), budgetBreakdown{lodgingKes,activitiesKes,foodKes,transportKes,contingencyKes,totalKes,notes}.
Cover all ${input.days} days. Short concrete strings. Realistic KES for the party.`,
        "Swahili Trail Kenya trip planner. Specific, local, budget-aware. No marketing fluff.",
        { maxOutputTokens, temperature: 0.35, json: true },
      )) {
        accumulated += chunk;
        emit({ type: "delta", text: chunk });
      }

      let parsed: PlanResult;
      try {
        parsed = JSON.parse(accumulated) as PlanResult;
      } catch {
        throw new Error("Could not parse the trip plan. Please try again.");
      }

      const cleanPlan = sanitizeAiStrings(parsed);

      const nextQuota = await consumeAiQuota(userId, "plan", {
        requestHash: quota.requestHash,
        plan: quota.plan,
      });

      const supabase = createAdminClient();
      if (supabase) {
        fireAndForget(
          Promise.resolve(
            supabase.from("itineraries").insert({
              user_id: userId,
              title: cleanPlan.title,
              days: input.days,
              interests: input.interests,
              budget: input.budget,
              plan: cleanPlan,
            }),
          ),
        );
      }

      emit({
        type: "done",
        plan: cleanPlan,
        quota: quotaPayload(nextQuota),
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
