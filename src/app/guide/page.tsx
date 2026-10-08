"use client";

import { useAuth } from "@clerk/nextjs";
import {
  History,
  Languages,
  Loader2,
  MapPinned,
  Menu,
  MessageSquarePlus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AiQuotaBanner,
  aiQuotaErrorMessage,
  useAiQuota,
} from "@/components/ai-quota-banner";
import { AiTypingPanel } from "@/components/ai-typing-panel";
import {
  consumeAiNdjsonStream,
  parseGuideStreamText,
} from "@/lib/ai/ndjson-stream";
import { GUIDE_LANGUAGES, type GuideLanguage } from "@/lib/data/attractions";
import type { AiQuotaStatus } from "@/lib/ai/quota";
import {
  createGuideSessionId,
  deleteGuideSession,
  getGuideSession,
  listGuideSessions,
  saveGuideSession,
  syncGuideSessionsFromCloud,
  titleFromMessages,
  type GuideMessage,
  type GuideSession,
} from "@/lib/guide-history";
import { cn } from "@/lib/utils";

const WELCOME: GuideMessage = {
  role: "assistant",
  content:
    "Karibu. I can help with travel across Kenya - Nairobi, safari parks, the Rift Valley, the coast, roads, food, and what's on.\n\nWrite in English, Kiswahili, Français, Deutsch, 中文, or العربية and I'll reply in the same language.\n\nWhat do you need first?",
};

const starters = [
  {
    label: "Nairobi weekend",
    prompt: "I have 2 days in Nairobi. What should I see and where should I eat?",
  },
  {
    label: "Maasai Mara intro",
    prompt: "Plan a first-time Maasai Mara safari - how many days, park fees, and practical tips.",
  },
  {
    label: "Mombasa coast",
    prompt: "What should I do on a 3-day Mombasa and Diani trip?",
  },
  {
    label: "Rift Valley day",
    prompt: "Plan a day trip from Nairobi to Nakuru or Naivasha - Hell's Gate, lakes, and budget.",
  },
  {
    label: "Local food",
    prompt: "What Kenyan dishes should I try this week - from Nairobi nyama choma to coastal Swahili food?",
  },
  {
    label: "Swahili phrases",
    prompt: "Teach me useful Kiswahili phrases for markets, taxis, and greetings in Kenya.",
  },
];

export default function GuidePage() {
  const { userId, isLoaded } = useAuth();
  const { quota, applyQuota } = useAiQuota();
  const [language, setLanguage] = useState<GuideLanguage>("en");
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => createGuideSessionId());
  const [messages, setMessages] = useState<GuideMessage[]>([WELCOME]);
  const [sessions, setSessions] = useState<GuideSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSessions = useCallback(() => {
    if (!userId) {
      setSessions([]);
      return;
    }
    setSessions(listGuideSessions(userId));
  }, [userId]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void syncGuideSessionsFromCloud(userId).then((sessions) => {
      if (!cancelled) setSessions(sessions);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, streamingReply]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function persist(nextMessages: GuideMessage[], lang: GuideLanguage, id: string) {
    if (!userId) return;
    const now = new Date().toISOString();
    const existing = getGuideSession(userId, id);
    const session: GuideSession = {
      id,
      title: titleFromMessages(nextMessages),
      language: lang,
      messages: nextMessages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    saveGuideSession(userId, session);
    refreshSessions();
  }

  function startNewChat() {
    const id = createGuideSessionId();
    setSessionId(id);
    setMessages([WELCOME]);
    setError(null);
    setInput("");
    setMenuOpen(false);
  }

  function loadSession(id: string) {
    if (!userId) return;
    const session = getGuideSession(userId, id);
    if (!session) return;
    setSessionId(session.id);
    setMessages(session.messages);
    setLanguage((session.language as GuideLanguage) || "en");
    setError(null);
    setMenuOpen(false);
  }

  function removeSession(id: string) {
    if (!userId) return;
    deleteGuideSession(userId, id);
    refreshSessions();
    if (id === sessionId) startNewChat();
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: GuideMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStreamingReply("");
    setError(null);
    setMenuOpen(false);

    try {
      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          language,
          history: nextMessages.slice(-10),
          sessionId,
        }),
      });
      const data = await consumeAiNdjsonStream<{
        type: "done";
        reply: string;
        detectedLanguage?: GuideLanguage;
        quota?: AiQuotaStatus;
      }>(res, {
        onDelta: (_chunk, full) => {
          setStreamingReply(parseGuideStreamText(full).reply);
        },
      });
      if (data.quota) applyQuota(data.quota);
      const detected = (data.detectedLanguage as GuideLanguage) || language;
      if (detected !== language) setLanguage(detected);
      const withReply: GuideMessage[] = [
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ];
      setMessages(withReply);
      setStreamingReply("");
      persist(withReply, detected, sessionId);
    } catch (err) {
      const payload =
        err && typeof err === "object"
          ? (err as {
              error?: string;
              message?: string;
              code?: string;
              priceUsdPerMonth?: number;
            })
          : {};
      setError(
        payload.code
          ? aiQuotaErrorMessage(payload)
          : payload.message || payload.error || "Something went wrong",
      );
      setStreamingReply("");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const activeLang =
    GUIDE_LANGUAGES.find((l) => l.code === language)?.native ?? "English";

  const sidebar = (
    <>
      <div className="mb-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <Languages className="h-3.5 w-3.5 text-ocean" />
          Guide
        </p>
        <h1 className="mt-1.5 font-display text-2xl tracking-tight text-ocean-deep sm:text-3xl">
          Ask about Kenya
        </h1>
        <p className="mt-2 text-sm text-muted">
          Roads, lodging, food, parks, or local tips — in your language.
        </p>
      </div>

      <AiQuotaBanner className="mb-4" quota={quota} />

      <button
        type="button"
        onClick={startNewChat}
        className="btn-solid mb-5 w-full !bg-brand-deep hover:!bg-ocean-deep"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </button>

      <div className="mb-5 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          <History className="h-3.5 w-3.5" />
          Past chats
        </p>
        <div className="mt-3 flex flex-col gap-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted">
              Conversations appear here after you send a message.
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-start gap-2 rounded-md px-2.5 py-2 transition",
                  session.id === sessionId
                    ? "bg-foam"
                    : "hover:bg-foam/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => loadSession(session.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-semibold text-ocean-deep">
                    {session.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {new Date(session.updatedAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(session.id)}
                  className="rounded-md p-1.5 text-muted opacity-100 transition hover:bg-sand hover:text-coral sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-5 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Preferred language
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Auto-switches when you write in another language.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {GUIDE_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm font-semibold transition",
                language === lang.code
                  ? "bg-brand-deep text-on-brand"
                  : "bg-foam text-muted hover:text-ocean-deep",
              )}
            >
              <span className="block">{lang.native}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] font-medium",
                  language === lang.code
                    ? "text-on-brand/70"
                    : "text-muted/80",
                )}
              >
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Try asking
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {starters.map((starter) => (
            <button
              key={starter.prompt}
              type="button"
              disabled={loading}
              onClick={() => void send(starter.prompt)}
              className="rounded-md px-3 py-2.5 text-left text-sm text-ocean-deep transition hover:bg-foam disabled:opacity-50"
            >
              <span className="font-semibold">{starter.label}</span>
              <span className="mt-0.5 block text-xs text-muted line-clamp-2">
                {starter.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="paper-grain coastal-grid h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="mx-auto flex h-full max-w-[90rem] flex-col gap-0 px-0 py-0 lg:grid lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:gap-6 lg:px-10 lg:py-5">
        <aside className="relative hidden min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface lg:flex">
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            {sidebar}
          </div>
        </aside>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-surface lg:rounded-md lg:border">
          <div className="relative z-[1] flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-foam text-ocean-deep lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open guide menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="hidden h-9 w-9 items-center justify-center rounded-md bg-brand-deep text-on-brand sm:flex">
                <MapPinned className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ocean-deep">
                  Kenya guide
                </p>
                <p className="truncate text-xs text-muted">
                  Answering in {activeLang}
                  {loading ? " · writing…" : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-foam px-2.5 py-1.5 text-xs font-semibold text-ocean-deep sm:px-3"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div
            ref={listRef}
            className="relative z-[1] min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex gap-2 sm:gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" ? (
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foam text-ocean sm:h-8 sm:w-8">
                    <MapPinned className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[min(100%,42rem)] rounded-md px-3.5 py-3 text-[15px] leading-6 sm:px-5 sm:py-4 sm:leading-7",
                    message.role === "user"
                      ? "bg-brand-deep text-on-brand"
                      : "w-full border border-border/70 bg-surface text-ocean-deep sm:w-auto",
                  )}
                >
                  {message.content.split(/\n{2,}/).map((block, i) => (
                    <p
                      key={i}
                      className={cn(
                        "whitespace-pre-wrap",
                        i > 0 && "mt-3 sm:mt-4",
                      )}
                    >
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex gap-2 sm:gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foam text-ocean sm:h-8 sm:w-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                <AiTypingPanel
                  className="max-w-[min(100%,42rem)] flex-1"
                  text={streamingReply}
                />
              </div>
            ) : null}
          </div>

          <div className="relative z-[1] shrink-0 border-t border-border bg-surface px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:p-4">
            {error ? (
              <p className="mb-2 px-1 text-sm text-coral">{error}</p>
            ) : null}
            <form
              className="flex items-center gap-2 rounded-md border border-border bg-foam px-1.5 py-1 focus-within:border-ocean focus-within:ring-2 focus-within:ring-ocean/15 sm:px-2 sm:py-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about places, food, phrases…"
                className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm text-ocean-deep outline-none placeholder:text-muted/70 sm:px-3"
              />
              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim() ||
                  (quota != null && (quota.remaining ?? 0) <= 0)
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-coral text-white transition hover:brightness-110 disabled:opacity-45"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-deep/55 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-ocean-deep">Guide menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-2 text-muted hover:bg-foam hover:text-ocean-deep"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {sidebar}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
