/** Server + client helpers for AI NDJSON streams. */

export type AiStreamDelta = { type: "delta"; text: string };
export type AiStreamError = {
  type: "error";
  error: string;
  code?: string;
  [key: string]: unknown;
};
export type AiStreamDone = { type: "done"; [key: string]: unknown };

export function ndjsonResponse(
  run: (emit: (event: Record<string, unknown>) => void) => Promise<void>,
  init?: ResponseInit,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await run(emit);
      } catch (error) {
        emit({
          type: "error",
          error:
            error instanceof Error ? error.message : "Something went wrong",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    ...init,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...(init?.headers ?? {}),
    },
  });
}

/** Pull a JSON string field value while the payload is still streaming. */
export function extractStreamingJsonString(
  raw: string,
  field: string,
): string | null {
  const key = `"${field}"`;
  const keyAt = raw.indexOf(key);
  if (keyAt < 0) return null;
  const colon = raw.indexOf(":", keyAt + key.length);
  if (colon < 0) return null;
  let i = colon + 1;
  while (i < raw.length && /\s/.test(raw[i]!)) i += 1;
  if (raw[i] !== '"') return null;
  i += 1;
  let out = "";
  let escaped = false;
  for (; i < raw.length; i += 1) {
    const ch = raw[i]!;
    if (escaped) {
      if (ch === "n") out += "\n";
      else if (ch === "t") out += "\t";
      else if (ch === "r") out += "\r";
      else out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') break;
    out += ch;
  }
  return out;
}

export type ConsumeAiStreamHandlers = {
  onDelta?: (chunk: string, full: string) => void;
};

/**
 * Read an AI NDJSON response. Quota / auth errors may arrive as plain JSON.
 */
export async function consumeAiNdjsonStream<T extends Record<string, unknown>>(
  res: Response,
  handlers: ConsumeAiStreamHandlers = {},
): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      priceUsdPerMonth?: number;
    };
    const err = new Error(data.error || `Request failed (${res.status})`);
    Object.assign(err, data);
    throw err;
  }

  if (contentType.includes("application/json") && !contentType.includes("ndjson")) {
    return (await res.json()) as T;
  }

  if (!res.body) {
    throw new Error("Empty response stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let lineBuf = "";
  let full = "";
  let donePayload: T | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    lineBuf += decoder.decode(value, { stream: true });

    let nl = lineBuf.indexOf("\n");
    while (nl >= 0) {
      const line = lineBuf.slice(0, nl).trim();
      lineBuf = lineBuf.slice(nl + 1);
      nl = lineBuf.indexOf("\n");
      if (!line) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (event.type === "delta" && typeof event.text === "string") {
        full += event.text;
        handlers.onDelta?.(event.text, full);
      } else if (event.type === "done") {
        donePayload = event as T;
      } else if (event.type === "error") {
        const err = new Error(
          typeof event.error === "string" ? event.error : "Stream failed",
        );
        Object.assign(err, event);
        throw err;
      }
    }
  }

  if (!donePayload) {
    throw new Error("Stream ended without a result");
  }
  return donePayload;
}

/** Parse guide stream: first line LANG:xx then body. */
export function parseGuideStreamText(full: string): {
  language: string | null;
  reply: string;
} {
  if (!full.startsWith("LANG:")) {
    return { language: null, reply: full };
  }
  const nl = full.indexOf("\n");
  if (nl < 0) return { language: null, reply: "" };
  const language = full.slice(5, nl).trim().toLowerCase() || null;
  let reply = full.slice(nl + 1);
  if (reply.startsWith("\n")) reply = reply.slice(1);
  return { language, reply };
}
