"use client";

import { Moon, Sun, Thermometer, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import type { CoastNowPayload } from "@/lib/coast-now";
import { cn } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: CoastNowPayload };

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-white/[0.06] px-2.5 py-2.5 ring-1 ring-white/10 sm:px-3.5 sm:py-3">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 sm:gap-1.5 sm:tracking-[0.12em] sm:text-[11px]">
        <Icon className="h-3 w-3 shrink-0 text-aqua" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-display text-base leading-none text-white sm:text-xl">
        {value}
      </span>
    </div>
  );
}

export function CoastNowBar({ className = "" }: { className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/coast-now", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as CoastNowPayload;
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    void load();
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const tideLabel =
    state.status === "ready" && state.data.nextTide
      ? state.data.nextTide.type === "high"
        ? "High tide"
        : "Low tide"
      : "Tide";
  const tideValue =
    state.status === "ready" ? (state.data.nextTide?.time ?? "—") : "—";

  return (
    <div
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-2xl border border-white/15 bg-brand-deep/85 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:max-w-xl",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Live coast conditions for Mombasa"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="relative flex h-2 w-2 items-center justify-center"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-coral/70 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-coral" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-coral sm:text-xs">
            Coast now
          </span>
        </span>
        <span className="truncate text-[11px] font-medium text-white/45 sm:text-xs">
          {state.status === "ready" ? state.data.location : "Mombasa"}
        </span>
      </div>

      {state.status === "loading" ? (
        <div className="px-3.5 py-5 text-sm text-white/55 sm:px-4">
          Updating coastal conditions…
        </div>
      ) : state.status === "error" ? (
        <div className="px-3.5 py-5 text-sm text-white/55 sm:px-4">
          Conditions unavailable right now
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
          <div className="flex items-end justify-between gap-3 rounded-xl bg-gradient-to-br from-aqua/20 to-white/[0.04] px-3.5 py-3 ring-1 ring-aqua/25 sm:min-w-[7.5rem] sm:flex-col sm:items-start sm:justify-center sm:px-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-aqua sm:text-[11px]">
              <Thermometer className="h-3.5 w-3.5" aria-hidden />
              Temp
            </span>
            <span className="font-display text-4xl leading-none tracking-tight text-white sm:text-5xl">
              {state.data.temperatureC}
              <span className="align-top text-xl text-white/70 sm:text-2xl">
                °
              </span>
            </span>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
            <MetricTile icon={Waves} label={tideLabel} value={tideValue} />
            <MetricTile icon={Sun} label="Sunrise" value={state.data.sunrise} />
            <MetricTile icon={Moon} label="Sunset" value={state.data.sunset} />
          </div>
        </div>
      )}
    </div>
  );
}
