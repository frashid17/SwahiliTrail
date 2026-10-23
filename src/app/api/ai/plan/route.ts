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
import {
  groundPlan,
  recomputeBudgetFromCatalogue,
} from "@/lib/catalogue";
import { normalizePlan } from "@/lib/plan-normalize";
import {
  MAX_STOP_DAYS,
  MAX_TRIP_DAYS,
  MAX_TRIP_STOPS,
  stopsPromptBlock,
  sumStopDays,
  type TripStop,
} from "@/lib/trip-stops";

const cartItemSchema = z.object({
  id: z.string(),
  type: z.enum(["attraction", "wildlife", "hotel", "restaurant"]),
  name: z.string(),
  area: z.string(),
  estCostKes: z.number().optional(),
});

const stopSchema = z.object({
  location: z.string().min(1).max(80),
  days: z.number().int().min(1).max(MAX_STOP_DAYS),
});

const bodySchema = z
  .object({
    days: z.number().int().min(1).max(MAX_TRIP_DAYS).optional(),
    interests: z.array(z.string()).min(1).max(10),
    budget: z.enum(["budget", "mid", "luxury"]),
    pace: z.enum(["relaxed", "balanced", "packed"]),
    companions: z.enum(["solo", "couple", "family", "friends"]),
    stayPreference: z.string().max(120).optional(),
    stayArea: z.string().max(80).optional(),
    stops: z.array(stopSchema).min(1).max(MAX_TRIP_STOPS).optional(),
    partySize: z.number().int().min(1).max(12).default(2),
    transportMode: z
      .enum([
        "none",
        "airport-pickup",
        "car-hire",
        "chauffeur",
        "airport-and-car",
      ])
      .default("none"),
    cart: z.array(cartItemSchema).max(24).optional(),
  })
  .superRefine((value, ctx) => {
    const stops = value.stops?.length
      ? value.stops
      : value.stayArea
        ? [{ location: value.stayArea, days: value.days ?? 5 }]
        : value.days
          ? [{ location: "Anywhere in Kenya", days: value.days }]
          : null;
    if (!stops) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one stop with days",
        path: ["stops"],
      });
      return;
    }
    const total = sumStopDays(stops);
    if (total < 1 || total > MAX_TRIP_DAYS) {
      ctx.addIssue({
        code: "custom",
        message: `Total days must be between 1 and ${MAX_TRIP_DAYS}`,
        path: ["stops"],
      });
    }
  });

type PlanPlaceLink = {
  name: string;
  kind?: string;
  mapsQuery: string;
  why?: string;
  estCostKes?: number;
};

type DayPlan = {
  day: number;
  theme: string;
  location?: string;
  morning: string;
  afternoon: string;
  evening: string;
  foodTip: string;
  transportTip: string;
  estimatedDayCostKes: number;
  localIntel?: string;
  timingNote?: string;
  insiderTip?: string;
  places?: PlanPlaceLink[];
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
  stops?: TripStop[];
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
    const stops: TripStop[] = input.stops?.length
      ? input.stops
      : [
          {
            location: input.stayArea || "Anywhere in Kenya",
            days: input.days ?? 5,
          },
        ];
    const totalDays = sumStopDays(stops);
    const fingerprint = [
      totalDays,
      input.budget,
      input.pace,
      input.companions,
      stops.map((s) => `${s.location}:${s.days}`).join(">"),
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

    // Prefer wishlist + interest matches; richer catalogues so the model can name real places.
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
      .slice(0, 28)
      .map(
        (a) =>
          `${a.id}|${a.name}|${a.area}|${a.category}|~${a.durationHours}h|KES ${a.estCostKes}|maps:${a.name} ${a.area} Kenya|${a.blurb.slice(0, 120)}`,
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
      .slice(0, 16)
      .map(
        (w) =>
          `${w.id}|${w.name}|${w.region}|KES ${w.estEntryKes}|maps:${w.name} ${w.region} Kenya`,
      )
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
      .slice(0, 14)
      .map(
        (h) =>
          `${h.id}|${h.name}|${h.area}|KES ${h.pricePerNight}/n|maps:${h.name} ${h.area} Kenya`,
      )
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
      .slice(0, 14)
      .map(
        (r) =>
          `${r.id}|${r.name}|${r.area}|KES ${r.avgMealKes}|${r.cuisine}|maps:${r.name} ${r.area} Kenya`,
      )
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

    const multiStop = stops.length > 1;
    const routeBlock = stopsPromptBlock(stops);
    const stayBase = multiStop
      ? `Multi-stop route (follow this order exactly):\n${routeBlock}`
      : stops[0].location === "whole-coast" ||
          stops[0].location === "Anywhere in Kenya"
        ? "Anywhere in Kenya - pick best base for interests."
        : `${stops[0].location} base for all ${totalDays} days.`;

    // Rich day cards need more tokens; still capped so huge trips stay workable.
    const maxOutputTokens = Math.min(8192, 1600 + totalDays * 520);

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `You are Swahili Trail's Kenya trip desk — NOT a generic chatbot. Write a ${totalDays}-day plan for ${input.partySize} traveler(s) (${input.companions}) that feels like a local operator brief: named places, real logistics, maps queries, and why each stop matters.

Region: ${DESTINATION.regionLong}. ${AI_REGION_CONTEXT}
Interests: ${input.interests.join(", ")}
Budget: ${input.budget}. Pace: ${input.pace}.
Route / stay:
${stayBase}
${input.stayPreference ? `Stay note: ${input.stayPreference}` : ""}
Transport mode: ${transportMode}. ${transportGuide}
${budgetGuide}
${
  multiStop
    ? `Allocate consecutive day numbers to each stop in order. Put transfer/travel tips on the first day of each new stop (except stop 1). Each day MUST include "location" matching that stop. recommendedStay must name lodging ideas per stop with area + rough nightly KES.`
    : ""
}

CATALOGUE LOCK (critical — this is why travelers use Swahili Trail, not ChatGPT):
- Prefer catalogue IDs for EVERY place. Set places[].catalogueId to the catalogue id string whenever the place is in the lists below.
- Wishlist items MUST appear in the plan (use their exact id as catalogueId).
- You may invent at most 1 place per day if the catalogue lacks a fit — those must omit catalogueId and still use a specific Kenya name + mapsQuery.
- Use catalogue KES costs for estCostKes when catalogueId is set.
- Ban vague filler: never write only "relax on the beach", "enjoy local food", "explore the area".
- Include Kenya logistics: M-Pesa vs cash, park fees, Likoni ferry / SGR / matatu / Bolt, heat/tide windows.
- Each day needs 3–5 places[] with mapsQuery like "Ali Barbour's Cave Diani Kenya".
- morning/afternoon/evening: 2–4 sentences with what/when/cost.
- foodTip: dish + venue; transportTip: between places with KES fares.
- localIntel, timingNote, insiderTip: dense and specific.
- estimatedDayCostKes: whole party. recommendedStay: ONE plain string with area + hotel + nightly KES.
- packingTips + localEtiquette: 5 each for THIS route.

Wishlist (MUST include these catalogue ids in places[]):
${cartText}

Car hires (use ONLY these real names/phones when recommending hire):
${carHireText}

Attractions catalogue (id|name|area|…|maps:…):
${attractions}

Wildlife catalogue:
${wildlife}

Hotels catalogue:
${hotels}

Restaurants catalogue:
${restaurants}

Return ONLY JSON with keys:
title (string), summary (string), recommendedStay (string — never object/array),
days[{day,theme,location,morning,afternoon,evening,foodTip,transportTip,estimatedDayCostKes,localIntel,timingNote,insiderTip,places[{name,kind,mapsQuery,why,estCostKes,catalogueId,durationHours}]}],
packingTips (5 strings), localEtiquette (5 strings),
budgetBreakdown{lodgingKes,activitiesKes,foodKes,transportKes,contingencyKes,totalKes,notes}.
Cover exactly ${totalDays} days. Every day must include places (min 3). kind is one of attraction|wildlife|restaurant|hotel|stay|viewpoint|beach|transfer|market|park.
catalogueId = catalogue id when known, else null.`,
        "Swahili Trail proprietary Kenya trip planner. Catalogue-first, operator-grade, map-ready. Prefer catalogue ids. No ChatGPT tourist clichés.",
        { maxOutputTokens, temperature: 0.45, json: true },
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

      const normalized = {
        ...normalizePlan(sanitizeAiStrings(parsed)),
        stops,
      };
      const grounded = groundPlan(normalized);
      const cleanPlan = recomputeBudgetFromCatalogue(grounded, {
        partySize: input.partySize,
        budgetTier: input.budget,
        nights: Math.max(1, totalDays - 1),
      });

      const nextQuota = await consumeAiQuota(userId, "plan", {
        requestHash: quota.requestHash,
        plan: quota.plan,
      });

      const supabase = createAdminClient();
      if (supabase) {
        fireAndForget(
          (async () => {
            await supabase.from("itineraries").insert({
              user_id: userId,
              title: cleanPlan.title,
              days: totalDays,
              interests: input.interests,
              budget: input.budget,
              plan: cleanPlan,
            });
            await supabase.from("analytics_events").insert({
              user_id: userId,
              event_type: "plan_created",
              payload: {
                days: totalDays,
                interests: input.interests,
                budget: input.budget,
                stops: stops.map((s) => s.location),
              },
            });
          })(),
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
