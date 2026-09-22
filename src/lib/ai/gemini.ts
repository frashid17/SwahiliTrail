import { GoogleGenerativeAI } from "@google/generative-ai";
import { toPlainText } from "@/lib/text";

export function getGeminiModel(model = "gemini-3.6-flash") {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model });
}

const PLAIN_STYLE =
  "Write in plain text only. Do not use markdown (no asterisks for bold/italic, no ### headings, no --- rules). Use numbered lists like 1. 2. 3. or plain line breaks. Do not use em dashes or en dashes; use a hyphen with spaces ( - ) or a comma. Give complete answers with all useful details - do not truncate mid-thought. Light emoji use is welcome when it fits the tone.";

export async function generateJson<T>(
  prompt: string,
  systemInstruction?: string,
): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: `${systemInstruction ?? ""}\n\n${PLAIN_STYLE}`.trim(),
        },
      ],
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function generateText(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: `${systemInstruction ?? ""}\n\n${PLAIN_STYLE}`.trim(),
        },
      ],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });
  return toPlainText(result.response.text());
}

/** Recursively plain-text sanitize string fields in AI JSON payloads. */
export function sanitizeAiStrings<T>(value: T): T {
  if (typeof value === "string") {
    return toPlainText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAiStrings(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = sanitizeAiStrings(nested);
    }
    return out as T;
  }
  return value;
}
