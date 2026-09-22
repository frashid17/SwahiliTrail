import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJson, sanitizeAiStrings } from "@/lib/ai/gemini";
import { ATTRACTIONS, GUIDE_LANGUAGES } from "@/lib/data/attractions";
import { createClient } from "@/lib/supabase/server";
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

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = bodySchema.parse(await req.json());
    const preferredLabel =
      GUIDE_LANGUAGES.find((l) => l.code === input.language)?.native ??
      "English";

    const context = ATTRACTIONS.map(
      (a) => `${a.name} (${a.area}): ${a.blurb}`,
    ).join("\n");

    const historyText = (input.history ?? [])
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const result = await generateJson<GuideResult>(
      `Conversation so far:
${historyText || "(new conversation)"}

User message:
${input.message}

Preferred UI language (fallback only): ${preferredLabel} (${input.language})

LANGUAGE RULE (critical):
- Detect the language of the user's latest message.
- If they wrote in German, French, Swahili (Kiswahili), Chinese, Arabic, or English, set detectedLanguage to that code (de/fr/sw/zh/ar/en) and write the entire reply in that language.
- Only use the preferred UI language when the message language is unclear or mixed with no dominant language.

Return JSON:
{
  "reply": string,
  "detectedLanguage": "en" | "sw" | "fr" | "de" | "zh" | "ar"
}`,
      `You are Swahili Trail's warm, lively coastal guide for Mombasa, Kenya - like a friendly local who makes travelers excited to explore.

Voice:
- Conversational and motivating, not encyclopedic.
- Use a few well-placed emojis (beach, food, sun, map pin, wave) - not every line.
- Short paragraphs with blank lines between sections so it is easy to read.
- Numbered tips when helpful (1. 2. 3.).
- End with a friendly follow-up question that invites the traveler to reply (e.g. ask about budget, days, kids, or beach vs culture).
- Be practical: places, timing, transport, rough KES costs when useful.
- Never use markdown (*, **, ###, ---). Never use em dashes.

Known places:
${context}`,
    );

    const clean = sanitizeAiStrings(result);
    const detected = langCodes.includes(clean.detectedLanguage)
      ? clean.detectedLanguage
      : input.language;
    const plainReply = toPlainText(clean.reply);

    const supabase = await createClient();
    if (supabase) {
      const history = [
        ...(input.history ?? []),
        { role: "assistant" as const, content: plainReply },
      ];
      if (input.sessionId) {
        await supabase.from("guide_sessions").upsert(
          {
            id: input.sessionId,
            user_id: userId,
            language: detected,
            messages: history,
            updated_at: new Date().toISOString(),
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
    }

    return NextResponse.json({
      reply: plainReply,
      detectedLanguage: detected,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get guide reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
