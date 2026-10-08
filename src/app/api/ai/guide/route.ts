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

function quotaPayload(quota: AiQuotaStatus) {
  return {
    ...quota,
    freeLimit: FREE_AI_QUOTA,
    priceUsdPerMonth: TRAIL_PLUS_PRICE_USD,
    upgradeUrl: "/pricing",
  };
}

function parseGuideOutput(raw: string, fallback: (typeof langCodes)[number]) {
  const text = toPlainText(raw.trim());
  const match = text.match(/^LANG:(\w+)\s*\n+([\s\S]*)$/i);
  if (!match) {
    return { reply: text, detectedLanguage: fallback };
  }
  const code = match[1]!.toLowerCase();
  const detected = langCodes.includes(code as (typeof langCodes)[number])
    ? (code as (typeof langCodes)[number])
    : fallback;
  return { reply: match[2]!.trim(), detectedLanguage: detected };
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const quota = await assertAiQuota(userId, "guide", input.message);
    if (!quota.ok) {
      return NextResponse.json(quota.responseBody, {
        status: quota.httpStatus,
      });
    }

    const preferredLabel =
      GUIDE_LANGUAGES.find((l) => l.code === input.language)?.native ??
      "English";
    const context = ATTRACTIONS.map((a) => `${a.name} (${a.area})`).join("; ");
    const recentHistory = (input.history ?? []).slice(-6);
    const historyText = recentHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    return ndjsonResponse(async (emit) => {
      let accumulated = "";
      for await (const chunk of streamGenerateContent(
        `Conversation:
${historyText || "(new)"}

User: ${input.message}
UI language fallback: ${preferredLabel} (${input.language})

Detect user language → reply in that language (de/fr/sw/zh/ar/en). Use UI language only if unclear.

Output format (strict):
Line 1: LANG:<code>  (one of en, sw, fr, de, zh, ar)
Then a blank line
Then the reply: 2-4 short paragraphs plus one follow-up question.
Do not use JSON or markdown.`,
        `Local guide for ${DESTINATION.regionLong} (Swahili Trail).
${AI_REGION_CONTEXT}
Be concrete (places, timing, transport, rough KES). No brochure tone.
Places: ${context}`,
        { maxOutputTokens: 900, temperature: 0.45, json: false },
      )) {
        accumulated += chunk;
        emit({ type: "delta", text: chunk });
      }

      const { reply, detectedLanguage } = parseGuideOutput(
        sanitizeAiStrings(accumulated),
        input.language,
      );
      const plainReply = toPlainText(reply);

      const messages = [
        ...(input.history ?? []),
        { role: "assistant" as const, content: plainReply },
      ];

      const nextQuota = await consumeAiQuota(userId, "guide", {
        requestHash: quota.requestHash,
        plan: quota.plan,
      });

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
                  language: detectedLanguage,
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
                language: detectedLanguage,
                preferredLanguage: input.language,
                sessionId: input.sessionId,
              },
            });
          })(),
        );
      }

      emit({
        type: "done",
        reply: plainReply,
        detectedLanguage,
        quota: quotaPayload(nextQuota),
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get guide reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
