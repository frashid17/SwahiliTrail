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
  Sparkles,
  Trash2,
  Waves,
  X,
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
  syncGuideSessionsFromCloud,
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
  }, [messages, loading]);

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

  const sidebar = (
    <>
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-brand-deep p-4 text-on-brand sm:rounded-3xl sm:p-5">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70"
          alt=""
          fill
          className="object-cover opacity-35"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/80 to-ocean/40" />
        <div className="absolute inset-x-0 bottom-0 h-8 tide-line opacity-70 sm:h-10" />
        <div className="relative">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-aqua/20 text-aqua sm:h-10 sm:w-10">
            <Languages className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-aqua sm:mt-4 sm:text-xs">
            <ShellMark />
            Multilingual guide
          </p>
          <h1 className="mt-1.5 font-display text-2xl leading-tight text-on-brand sm:mt-2 sm:text-3xl">
            Ask the coast anything
          </h1>
          <p className="mt-1.5 text-sm text-on-brand/80 sm:mt-2">
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

      <div className="coastal-panel relative mb-4 p-3.5 sm:p-4">
        <div className="relative z-[1]">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-aqua sm:text-xs">
            <History className="h-3.5 w-3.5" />
            Past chats
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted">
                Your conversations will appear here after you send a message.
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
                    className="rounded-lg p-1.5 text-muted opacity-100 transition hover:bg-sand hover:text-coral sm:opacity-0 sm:group-hover:opacity-100"
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

      <div className="coastal-panel relative mb-4 p-3.5 sm:p-4">
        <div className="relative z-[1]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aqua sm:text-xs">
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

      <div className="coastal-panel relative p-3.5 sm:p-4">
        <div className="relative z-[1]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aqua sm:text-xs">
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
    </>
  );

  return (
    <div className="coastal-grid h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="mx-auto flex h-full max-w-[90rem] flex-col gap-0 px-0 py-0 lg:grid lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:gap-6 lg:px-10 lg:py-5">
        {/* Desktop sidebar */}
        <aside className="relative hidden min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface/80 shadow-sm backdrop-blur lg:flex">
          <CoastalOrbs />
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {sidebar}
          </div>
          <WaveDivider className="shrink-0 opacity-60" />
        </aside>

        {/* Chat column — full screen on mobile */}
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-surface shadow-sm lg:rounded-3xl lg:border">
          <CoastalOrbs className="opacity-70" />
          <div className="relative z-[1] flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-foam text-ocean-deep lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open guide menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-ocean text-on-brand sm:flex">
                <Waves className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ocean-deep">
                  Coastal guide
                </p>
                <p className="truncate text-xs text-muted">
                  Answering in {activeLang}
                  {loading ? " · thinking…" : " · online"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={startNewChat}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foam px-2.5 py-1.5 text-xs font-semibold text-ocean-deep sm:px-3"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span className="sm:inline">New</span>
              </button>
              <span className="hidden items-center gap-1.5 rounded-full bg-foam px-3 py-1 text-xs font-semibold text-ocean sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                Gemini
              </span>
            </div>
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
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aqua/15 text-ocean sm:h-8 sm:w-8">
                    <MapPinned className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[min(100%,42rem)] rounded-2xl px-3.5 py-3 text-[15px] leading-6 shadow-sm sm:rounded-3xl sm:px-5 sm:py-4 sm:leading-7",
                    message.role === "user"
                      ? "rounded-br-md bg-ocean text-on-brand"
                      : "w-full rounded-bl-md border border-border/60 bg-surface text-ocean-deep sm:w-auto",
                  )}
                >
                  {message.content.split(/\n{2,}/).map((block, i) => (
                    <p
                      key={i}
                      className={cn("whitespace-pre-wrap", i > 0 && "mt-3 sm:mt-4")}
                    >
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aqua/15 text-ocean sm:h-8 sm:w-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                <div className="rounded-2xl rounded-bl-md border border-border/60 bg-surface px-3.5 py-3 text-sm leading-6 text-muted sm:rounded-3xl sm:px-5 sm:py-4 sm:leading-7">
                  Charting a coastal answer… 🌊
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative z-[1] shrink-0 border-t border-border bg-surface/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:p-4">
            <div className="mb-2 hidden h-3 tide-line opacity-50 sm:block" />
            {error ? (
              <p className="mb-2 px-1 text-sm text-coral">{error}</p>
            ) : null}
            <form
              className="flex items-center gap-2 rounded-full border border-border bg-foam px-1.5 py-1 focus-within:border-aqua focus-within:ring-2 focus-within:ring-aqua/15 sm:px-2 sm:py-1.5"
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

      {/* Mobile drawer for history / language / starters */}
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
                className="rounded-full p-2 text-muted hover:bg-foam hover:text-ocean-deep"
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
