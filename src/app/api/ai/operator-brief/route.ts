import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sanitizeAiStrings,
  streamGenerateContent,
} from "@/lib/ai/gemini";
import { ndjsonResponse } from "@/lib/ai/ndjson-stream";
import { summarizeDayForOperator } from "@/lib/catalogue";
import { normalizePlan } from "@/lib/plan-normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemoryShare } from "@/lib/trip-share-store";
import { toPlainText } from "@/lib/text";

const bodySchema = z.object({
  shareToken: z.string().min(6).max(80),
  leadId: z.string().max(80).optional(),
  guestName: z.string().max(120).optional(),
  partySize: z.number().int().min(1).max(24).optional(),
  startDate: z.string().max(40).optional(),
  notes: z.string().max(800).optional(),
});

/**
 * Public-ish: anyone with a share token can generate an operator brief
 * for that trip (no ChatGPT equivalent — needs the structured share payload).
 */
export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());
    const supabase = createAdminClient();

    let title = "";
    let payload: Record<string, unknown> | null = null;

    if (supabase) {
      const { data } = await supabase
        .from("trip_shares")
        .select("title, payload")
        .eq("token", input.shareToken)
        .maybeSingle();
      if (data) {
        title = (data.title as string) || "";
        payload = (data.payload as Record<string, unknown>) || null;
      }
    }

    if (!payload) {
      const mem = getMemoryShare(input.shareToken);
      if (mem) {
        title = mem.title;
        payload = mem.payload as unknown as Record<string, unknown>;
      }
    }

    if (!payload?.plan) {
      return NextResponse.json(
        { error: "Shared trip not found" },
        { status: 404 },
      );
    }

    const plan = normalizePlan(payload.plan);
    const partySize =
      input.partySize ??
      (typeof payload.partySize === "number" ? payload.partySize : 2);
    const startDate =
      input.startDate ||
      (typeof payload.startDate === "string" ? payload.startDate : "");
    const dayLines = plan.days.map(summarizeDayForOperator).join("\n");

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `Write an OPERATOR BRIEF for a Kenya lodge / driver / guide — not a tourist brochure.

Guest: ${input.guestName || "(not given)"}
Party size: ${partySize}
Start date: ${startDate || "(flexible)"}
Trip title: ${title || plan.title}
Guest notes: ${input.notes || "(none)"}

Itinerary outline:
${dayLines}

Budget note: ~KES ${plan.budgetBreakdown.totalKes.toLocaleString("en-KE")} total estimated
Recommended stay hint: ${plan.recommendedStay}
Stops: ${(plan.stops ?? []).map((s) => `${s.location} (${s.days}d)`).join(" → ") || "single base"}

Format as plain text with short labelled sections:
1) Guest snapshot
2) Pickup / transfers to arrange
3) Day-by-day ops checklist (times, places, what staff must prepare)
4) Dietary / pace / companions flags
5) Suggested quote items (lodging nights, park fees, vehicle days) — use KES ranges, mark as estimates

Be specific to THIS itinerary. No fluff.`,
        "You write operations briefs for Kenyan tourism partners from Swahili Trail shared trips.",
        { maxOutputTokens: 1200, temperature: 0.3, json: false },
      )) {
        accumulated += chunk;
        emit({ type: "delta", text: chunk });
      }

      const brief = toPlainText(sanitizeAiStrings(accumulated)).trim();

      if (supabase) {
        void supabase.from("analytics_events").insert({
          event_type: "operator_brief",
          payload: {
            shareToken: input.shareToken,
            leadId: input.leadId ?? null,
            title: title || plan.title,
          },
        });
        if (input.leadId) {
          void supabase
            .from("operator_leads")
            .update({
              notes: [
                input.notes?.trim() || "",
                "",
                "--- AI operator brief ---",
                brief,
              ]
                .filter(Boolean)
                .join("\n"),
            })
            .eq("id", input.leadId);
        }
      }

      emit({
        type: "done",
        brief,
        title: title || plan.title,
        shareToken: input.shareToken,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build operator brief";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
