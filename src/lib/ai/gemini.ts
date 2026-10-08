import { GoogleGenerativeAI } from "@google/generative-ai";
import { toPlainText } from "@/lib/text";

/** Fast default; override with GOOGLE_AI_MODEL if needed. */
export const DEFAULT_AI_MODEL =
  process.env.GOOGLE_AI_MODEL?.trim() || "gemini-3.5-flash-lite";

let client: GoogleGenerativeAI | null = null;

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

export function getGeminiModel(model = DEFAULT_AI_MODEL) {
  return getClient().getGenerativeModel({ model });
}

const PLAIN_STYLE =
  "Plain text only. No markdown (*, **, ###, ---). No em/en dashes. Be concise.";

export type GenerateOptions = {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  /** Gemini 3.x thinking level - keep MINIMAL for low latency. */
  thinkingLevel?: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";
};

function buildGenerationConfig(
  options: GenerateOptions | undefined,
  json: boolean,
) {
  const config: Record<string, unknown> = {
    temperature: options?.temperature ?? 0.4,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
    ...(json ? { responseMimeType: "application/json" } : {}),
    // Gemini 3+ rejects thinkingBudget; use thinkingLevel instead.
    thinkingConfig: {
      thinkingLevel: options?.thinkingLevel ?? "MINIMAL",
    },
  };

  return config;
}

export async function generateJson<T>(
  prompt: string,
  systemInstruction?: string,
  options?: GenerateOptions,
): Promise<T> {
  const model = getGeminiModel(options?.model);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `${systemInstruction ?? ""}\n\n${PLAIN_STYLE}`.trim(),
    // SDK types lag thinkingConfig.
    generationConfig: buildGenerationConfig(options, true) as never,
  });

  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options?: GenerateOptions,
): Promise<string> {
  const model = getGeminiModel(options?.model);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `${systemInstruction ?? ""}\n\n${PLAIN_STYLE}`.trim(),
    generationConfig: buildGenerationConfig(options, false) as never,
  });
  return toPlainText(result.response.text());
}

/** Yield model tokens as they arrive (text or JSON mime). */
export async function* streamGenerateContent(
  prompt: string,
  systemInstruction?: string,
  options?: GenerateOptions & { json?: boolean },
): AsyncGenerator<string> {
  const model = getGeminiModel(options?.model);
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `${systemInstruction ?? ""}\n\n${PLAIN_STYLE}`.trim(),
    generationConfig: buildGenerationConfig(
      options,
      options?.json ?? false,
    ) as never,
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
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

/** Prefer returning immediately; log background write failures. */
export function fireAndForget(task: Promise<unknown>) {
  void task.catch((err) => {
    console.error(
      "[ai] background task",
      err instanceof Error ? err.message : err,
    );
  });
}
