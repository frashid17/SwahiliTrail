import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fireAndForget,
  generateJson,
  sanitizeAiStrings,
} from "@/lib/ai/gemini";
import {
  FREE_AI_QUOTA,
  TRAIL_PLUS_PRICE_USD,
  assertAiQuota,
  consumeAiQuota,
  type AiQuotaStatus,
} from "@/lib/ai/quota";
import { ATTRACTIONS, GUIDE_LANGUAGES } from "@/lib/data/attractions";
import { titleFromMessages } from "@/lib/guide-history";
import { AI_REGION_CONTEXT, DESTINATION } from "@/lib/destination";
import { createAdminClient } from "@/lib/supabase/admin";
import { toPlainText } from "@/lib/text";

const langCodes = ["en", "sw", "fr", "de", "zh", "ar"] as const;

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(langCodes),
  sessionId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

type GuideResult = {
  reply: string;
  detectedLanguage: (typeof langCodes)[number];
};

function quotaPayload(quota: AiQuotaStatus) {
  return {
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  };
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await assertAiQuota(userId);
  if (!quota.ok) {
    return NextResponse.json(quota.responseBody, { status: 402 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const preferredLabel =
      GUIDE_LANGUAGES.find((l) => l.code === input.language)?.native ??
      "English";

    // Compact place list (names only) — blurbs slow the model for little gain.
    const context = ATTRACTIONS.map((a) => `${a.name} (${a.area})`).join("; ");

    const recentHistory = (input.history ?? []).slice(-6);
    const historyText = recentHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const result = await generateJson<GuideResult>(
      `Conversation:
${historyText || "(new)"}

User: ${input.message}
UI language fallback: ${preferredLabel} (${input.language})

Detect user language → reply in that language (de/fr/sw/zh/ar/en). Use UI language only if unclear.

Return JSON: {"reply": string, "detectedLanguage": "en"|"sw"|"fr"|"de"|"zh"|"ar"}
Keep reply to 2-4 short paragraphs plus one follow-up question.`,
      `Local guide for ${DESTINATION.regionLong} (Swahili Trail).
${AI_REGION_CONTEXT}
Be concrete (places, timing, transport, rough KES). No brochure tone.
Places: ${context}`,
      { maxOutputTokens: 900, temperature: 0.45 },
    );

    const clean = sanitizeAiStrings(result);
    const detected = langCodes.includes(clean.detectedLanguage)
      ? clean.detectedLanguage
      : input.language;
    const plainReply = toPlainText(clean.reply);

    const messages = [
      ...(input.history ?? []),
      { role: "assistant" as const, content: plainReply },
    ];

    const nextQuota = await consumeAiQuota(userId, "guide");

    const supabase = createAdminClient();
    if (supabase) {
      fireAndForget(
        (async () => {
          if (input.sessionId) {
            const now = new Date().toISOString();
            await supabase.from("guide_sessions").upsert(
              {
                id: input.sessionId,
                user_id: userId,
                title: titleFromMessages(messages),
                language: detected,
                messages,
                updated_at: now,
              },
              { onConflict: "id" },
            );
          }
          await supabase.from("analytics_events").insert({
            user_id: userId,
            event_type: "guide_message",
            payload: {
              language: detected,
              preferredLanguage: input.language,
              sessionId: input.sessionId,
            },
          });
        })(),
      );
    }

    return NextResponse.json({
      reply: plainReply,
      detectedLanguage: detected,
      quota: quotaPayload(nextQuota),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get guide reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
