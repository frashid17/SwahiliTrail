"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAiQuota } from "@/components/ai-quota-banner";
import {
  consumeAiNdjsonStream,
} from "@/lib/ai/ndjson-stream";
import {
  updateSavedTrip,
  type SavedPlan,
  type SavedTrip,
} from "@/lib/saved-trips";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Swap day 3 for something more relaxed",
  "Make this more budget-friendly using catalogue stays",
  "Add more kid-friendly stops",
  "Cut long transfers and keep days lighter",
];

type Props = {
  userId: string;
  trip: SavedTrip;
  onUpdated: (trip: SavedTrip) => void;
};

export function TripRefinePanel({ userId, trip, onUpdated }: Props) {
  const { promptUpgradeFromError } = useAiQuota();
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function refine(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    try {
      const res = await fetch("/api/ai/plan/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: prompt,
          tripId: trip.id,
          partySize: trip.partySize,
          budget:
            trip.budget === "budget" || trip.budget === "luxury"
              ? trip.budget
              : "mid",
          companions: trip.companions,
          startDate: trip.startDate,
          existingPlan: trip.plan,
        }),
      });
      const data = await consumeAiNdjsonStream<{
        type: "done";
        plan: SavedPlan;
      }>(res, {
        onDelta: (chunk) => setDraft((d) => d + chunk),
      });

      if (!data.plan) throw new Error("No updated plan returned");
      const trips = updateSavedTrip(userId, trip.id, {
        plan: data.plan,
        days: data.plan.days.length,
      });
      const updated = trips.find((t) => t.id === trip.id);
      if (updated) onUpdated(updated);
      setInstruction("");
      setDraft("");
    } catch (err) {
      promptUpgradeFromError(err);
      const message =
        err && typeof err === "object" && "error" in err
          ? String((err as { error?: string }).error || "Refine failed")
          : err instanceof Error
            ? err.message
            : "Refine failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold" />
        <h2 className="font-display text-xl text-ocean-deep">
          Edit this trip with AI
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Changes update your saved itinerary, PDF, and share link — not a
        disposable chat.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => void refine(s)}
            className="rounded-full border border-border bg-foam px-3 py-1 text-xs font-medium text-ocean-deep disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void refine(instruction);
        }}
      >
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Replace Amboseli with Nakuru and keep the budget mid"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ocean-deep outline-none focus:border-ocean"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !instruction.trim()}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-2xl bg-ocean px-5 py-3 text-sm font-semibold text-on-brand",
            (busy || !instruction.trim()) && "opacity-60",
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Apply edit
        </button>
      </form>

      {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
      {busy && draft ? (
        <p className="mt-3 max-h-24 overflow-hidden text-xs text-muted opacity-70">
          Updating itinerary…
        </p>
      ) : null}
    </div>
  );
}
