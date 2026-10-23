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
import { HOTELS } from "@/lib/data/hotels";
import { RESTAURANTS } from "@/lib/data/restaurants";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import {
  formatTripContextBlock,
  groundPlan,
  recomputeBudgetFromCatalogue,
} from "@/lib/catalogue";
import { AI_REGION_CONTEXT, DESTINATION } from "@/lib/destination";
import { normalizePlan } from "@/lib/plan-normalize";
import type { SavedPlan } from "@/lib/saved-trips";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  instruction: z.string().min(3).max(1200),
  tripId: z.string().min(1).max(80).optional(),
  partySize: z.number().int().min(1).max(12).default(2),
  budget: z.enum(["budget", "mid", "luxury"]).default("mid"),
  companions: z.string().max(40).optional(),
  startDate: z.string().max(32).optional(),
  existingPlan: z.record(z.string(), z.unknown()),
});

function quotaPayload(quota: AiQuotaStatus) {
  return {
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  };
}

function catalogueSlice() {
  const attractions = ATTRACTIONS.slice(0, 40)
    .map(
      (a) =>
        `${a.id}|${a.name}|${a.area}|KES ${a.estCostKes}|${a.durationHours}h`,
    )
    .join("\n");
  const wildlife = WILDLIFE_SITES.slice(0, 20)
    .map((w) => `${w.id}|${w.name}|${w.region}|KES ${w.estEntryKes}`)
    .join("\n");
  const hotels = HOTELS.slice(0, 20)
    .map((h) => `${h.id}|${h.name}|${h.area}|KES ${h.pricePerNight}/n`)
    .join("\n");
  const restaurants = RESTAURANTS.slice(0, 20)
    .map((r) => `${r.id}|${r.name}|${r.area}|KES ${r.avgMealKes}`)
    .join("\n");
  return { attractions, wildlife, hotels, restaurants };
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const quota = await assertAiQuota(userId, "plan", input.instruction);
    if (!quota.ok) {
      return NextResponse.json(quota.responseBody, {
        status: quota.httpStatus,
      });
    }

    const current = normalizePlan(input.existingPlan);
    const context = formatTripContextBlock({
      title: current.title,
      startDate: input.startDate,
      partySize: input.partySize,
      budget: input.budget,
      companions: input.companions,
      plan: current,
    });
    const cat = catalogueSlice();
    const dayCount = Math.max(1, current.days.length);
    const maxOutputTokens = Math.min(8192, 1400 + dayCount * 480);

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `Edit this existing Kenya trip in-place. Do NOT invent a brand-new trip from scratch unless the instruction says to rebuild everything.

Traveler instruction:
${input.instruction}

Current trip:
${context}

Full current plan JSON (preserve structure; edit only what the instruction requires):
${JSON.stringify(current)}

Rules:
- Return a COMPLETE updated plan JSON (same schema) covering all days.
- Prefer Swahili Trail catalogue ids for places (catalogueId). Use catalogue KES costs when set.
- Keep stops[] if present unless the instruction changes the route.
- If swapping a day, keep other days intact unless they must change for logistics.
- places need mapsQuery + optional catalogueId.
- recommendedStay is ONE plain string.

Catalogue (id|name|area|cost):
Attractions:
${cat.attractions}
Wildlife:
${cat.wildlife}
Hotels:
${cat.hotels}
Restaurants:
${cat.restaurants}

Return ONLY JSON with keys:
title, summary, recommendedStay, days[{day,theme,location,morning,afternoon,evening,foodTip,transportTip,estimatedDayCostKes,localIntel,timingNote,insiderTip,places[{name,kind,mapsQuery,why,estCostKes,catalogueId,durationHours}]}], packingTips, localEtiquette, budgetBreakdown{lodgingKes,activitiesKes,foodKes,transportKes,contingencyKes,totalKes,notes}, stops.`,
        `Swahili Trail trip editor for ${DESTINATION.regionLong}. ${AI_REGION_CONTEXT}
Catalogue-first edits. Structured plan out — never a chat essay.`,
        { maxOutputTokens, temperature: 0.35, json: true },
      )) {
        accumulated += chunk;
        emit({ type: "delta", text: chunk });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(accumulated);
      } catch {
        throw new Error("Could not parse the refined plan. Try a shorter edit.");
      }

      const normalized = normalizePlan(sanitizeAiStrings(parsed));
      if (current.stops?.length && !normalized.stops?.length) {
        normalized.stops = current.stops;
      }
      const grounded = groundPlan(normalized);
      const cleanPlan: SavedPlan = recomputeBudgetFromCatalogue(grounded, {
        partySize: input.partySize,
        budgetTier: input.budget,
        nights: Math.max(1, cleanDaysNights(grounded)),
      });

      const nextQuota = await consumeAiQuota(userId, "plan", {
        requestHash: quota.requestHash,
        plan: quota.plan,
      });

      const supabase = createAdminClient();
      if (supabase) {
        fireAndForget(
          Promise.resolve(
            supabase.from("analytics_events").insert({
              user_id: userId,
              event_type: "plan_refined",
              payload: {
                tripId: input.tripId ?? null,
                instruction: input.instruction.slice(0, 200),
                days: cleanPlan.days.length,
              },
            }),
          ),
        );
      }

      emit({
        type: "done",
        plan: cleanPlan,
        tripId: input.tripId ?? null,
        quota: quotaPayload(nextQuota),
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refine itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function cleanDaysNights(plan: SavedPlan) {
  return Math.max(1, plan.days.length - 1);
}
