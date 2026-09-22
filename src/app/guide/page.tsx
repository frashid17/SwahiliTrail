"use client";

import { useAuth } from "@clerk/nextjs";
import {
  History,
  Languages,
  Loader2,
  MapPinned,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  Waves,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CoastalOrbs,
  ShellMark,
  WaveDivider,
} from "@/components/coastal-accents";
import { GUIDE_LANGUAGES, type GuideLanguage } from "@/lib/data/attractions";
import {
  createGuideSessionId,
  deleteGuideSession,
  getGuideSession,
  listGuideSessions,
  saveGuideSession,
  titleFromMessages,
  type GuideMessage,
  type GuideSession,
} from "@/lib/guide-history";
import { cn } from "@/lib/utils";

const WELCOME: GuideMessage = {
  role: "assistant",
  content:
    "Karibu! 🌊 I'm your Swahili Trail guide - think of me as your coastal buddy.\n\nAsk about beaches, Fort Jesus, food, ferries, or local phrases. Write in English, Deutsch, Français, Kiswahili, 中文, or العربية and I'll match your language.\n\nWhat are you most curious about first?",
};

const starters = [
  {
    label: "Old Town half-day",
    prompt: "What should I see in Old Town in half a day?",
  },
  {
    label: "CBD to Diani",
    prompt: "How do I get from Mombasa CBD to Diani?",
  },
  {
    label: "Restaurant Swahili",
    prompt: "Teach me useful Swahili phrases for a restaurant.",
  },
  {
    label: "Mama Ngina sunset",
    prompt: "Is Mama Ngina Waterfront good at sunset?",
  },
  {
    label: "Safe beach tips",
    prompt:
      "What should first-time visitors know about swimming at Nyali Beach?",
  },
  {
    label: "Local food",
    prompt: "What coastal dishes should I try in Mombasa this week?",
  },
];

export default function GuidePage() {
  const { userId, isLoaded } = useAuth();
  const [language, setLanguage] = useState<GuideLanguage>("en");
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => createGuideSessionId());
  const [messages, setMessages] = useState<GuideMessage[]>([WELCOME]);
  const [sessions, setSessions] = useState<GuideSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (isLoaded) refreshSessions();
  }, [isLoaded, refreshSessions]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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
  }

  function loadSession(id: string) {
    if (!userId) return;
    const session = getGuideSession(userId, id);
    if (!session) return;
    setSessionId(session.id);
    setMessages(session.messages);
    setLanguage((session.language as GuideLanguage) || "en");
    setError(null);
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
    setError(null);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const detected = (data.detectedLanguage as GuideLanguage) || language;
      if (detected !== language) setLanguage(detected);
      const withReply: GuideMessage[] = [
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ];
      setMessages(withReply);
      persist(withReply, detected, sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const activeLang =
    GUIDE_LANGUAGES.find((l) => l.code === language)?.native ?? "English";

  return (
    <div className="coastal-grid h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mx-auto grid h-full max-w-[90rem] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:gap-6 lg:px-10 lg:py-5">
        <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface/80 shadow-sm backdrop-blur">
          <CoastalOrbs />
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="relative mb-4 overflow-hidden rounded-3xl bg-brand-deep p-5 text-on-brand">
              <Image
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70"
                alt=""
                fill
                className="object-cover opacity-35"
                sizes="320px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/80 to-ocean/40" />
              <div className="absolute inset-x-0 bottom-0 h-10 tide-line opacity-70" />
              <div className="relative">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-aqua/20 text-aqua">
                  <Languages className="h-5 w-5" />
                </span>
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-aqua">
                  <ShellMark />
                  Multilingual guide
                </p>
                <h1 className="mt-2 font-display text-3xl leading-tight text-on-brand">
                  Ask the coast anything
                </h1>
                <p className="mt-2 text-sm text-on-brand/80">
                  Gemini answers in your language - ferries, food, heritage, and
                  practical Mombasa tips.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ocean px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-deep"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </button>

            <div className="coastal-panel relative mb-4 p-4">
              <div className="relative z-[1]">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-aqua">
                  <History className="h-3.5 w-3.5" />
                  Past chats
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted">
                      Your conversations will appear here after you send a
                      message.
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex items-start gap-2 rounded-2xl border px-3 py-2.5 transition",
                          session.id === sessionId
                            ? "border-aqua/40 bg-foam"
                            : "border-transparent bg-foam/70 hover:border-aqua/25",
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
                          className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-sand hover:text-coral group-hover:opacity-100"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="coastal-panel relative mb-4 p-4">
              <div className="relative z-[1]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aqua">
                  Preferred language
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Auto-switches when you write in another language.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {GUIDE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        "rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition",
                        language === lang.code
                          ? "bg-ocean text-brand-deep"
                          : "bg-foam text-muted hover:bg-sand hover:text-ocean-deep",
                      )}
                    >
                      <span className="block">{lang.native}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] font-medium",
                          language === lang.code
                            ? "text-brand-deep/70"
                            : "text-muted/80",
                        )}
                      >
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="coastal-panel relative p-4">
              <div className="relative z-[1]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aqua">
                  Try asking
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {starters.map((starter) => (
                    <button
                      key={starter.prompt}
                      type="button"
                      disabled={loading}
                      onClick={() => void send(starter.prompt)}
                      className="rounded-2xl border border-transparent bg-foam px-3 py-2.5 text-left text-sm text-ocean-deep transition hover:border-aqua/30 hover:bg-sand disabled:opacity-50"
                    >
                      <span className="font-semibold">{starter.label}</span>
                      <span className="mt-0.5 block text-xs text-muted line-clamp-2">
                        {starter.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <WaveDivider className="shrink-0 opacity-60" />
        </aside>

        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <CoastalOrbs className="opacity-70" />
          <div className="relative z-[1] flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean text-on-brand">
                <Waves className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ocean-deep">
                  Coastal guide
                </p>
                <p className="text-xs text-muted">
                  Answering in {activeLang}
                  {loading ? " · thinking…" : " · online"}
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-foam px-3 py-1 text-xs font-semibold text-ocean sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              Gemini
            </span>
          </div>

          <div
            ref={listRef}
            className="relative z-[1] min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" ? (
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqua/15 text-ocean">
                    <MapPinned className="h-4 w-4" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[min(100%,44rem)] rounded-3xl px-5 py-4 text-[15px] leading-7 shadow-sm",
                    message.role === "user"
                      ? "rounded-br-md bg-ocean text-on-brand"
                      : "rounded-bl-md border border-border/60 bg-surface text-ocean-deep",
                  )}
                >
                  {message.content.split(/\n{2,}/).map((block, i) => (
                    <p
                      key={i}
                      className={cn(
                        "whitespace-pre-wrap",
                        i > 0 && "mt-4",
                      )}
                    >
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua/15 text-ocean">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                <div className="rounded-3xl rounded-bl-md border border-border/60 bg-surface px-5 py-4 text-sm leading-7 text-muted">
                  Charting a coastal answer… 🌊
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative z-[1] shrink-0 border-t border-border bg-surface/95 p-3 sm:p-4">
            <div className="mb-2 h-3 tide-line opacity-50" />
            {error ? (
              <p className="mb-2 px-1 text-sm text-coral">{error}</p>
            ) : null}
            <form
              className="flex items-center gap-2 rounded-full border border-border bg-foam px-2 py-1.5 focus-within:border-aqua focus-within:ring-2 focus-within:ring-aqua/15"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about places, transport, food, phrases…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ocean-deep outline-none placeholder:text-muted/70"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-white transition hover:brightness-110 disabled:opacity-45"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
