"use client";

import { MapPin, Moon, Sun, Thermometer, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
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
  light,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-md px-2.5 py-2.5 sm:px-3.5 sm:py-3",
        light
          ? "bg-foam ring-1 ring-border"
          : "bg-white/[0.06] ring-1 ring-white/10",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] sm:gap-1.5 sm:tracking-[0.12em] sm:text-[11px]",
          light ? "text-muted" : "text-white/50",
        )}
      >
        <Icon
          className={cn("h-3 w-3 shrink-0", light ? "text-ocean" : "text-aqua")}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </span>
      <span
        className={cn(
          "font-display text-base leading-none sm:text-xl",
          light ? "text-ocean-deep" : "text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function readCoords(): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export function CoastNowBar({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  const { regionId, region } = useKenyaLocation();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let qs = "";
        if (region) {
          qs = `?lat=${region.coords.lat.toFixed(5)}&lon=${region.coords.lon.toFixed(5)}&label=${encodeURIComponent(region.coords.label)}`;
        } else {
          const coords = await readCoords();
          qs = coords
            ? `?lat=${coords.lat.toFixed(5)}&lon=${coords.lon.toFixed(5)}`
            : "";
        }
        const res = await fetch(`/api/coast-now${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as CoastNowPayload;
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    setState({ status: "loading" });
    void load();
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [region, regionId]);

  const showTide =
    state.status === "ready" &&
    state.data.coastal &&
    Boolean(state.data.nextTide);

  const tideLabel =
    state.status === "ready" && state.data.nextTide
      ? state.data.nextTide.type === "high"
        ? "High tide"
        : "Low tide"
      : "Tide";
  const tideValue =
    state.status === "ready" ? (state.data.nextTide?.time ?? "-") : "-";

  return (
    <div
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-md border sm:max-w-xl",
        light
          ? "border-border bg-surface"
          : "border-white/15 bg-brand-deep/85 backdrop-blur-md",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Live conditions"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-3.5 py-2.5 sm:px-4 sm:py-3",
          light ? "border-border" : "border-white/10",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-sm",
              light ? "bg-coral" : "bg-coral",
            )}
          />
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs",
              light ? "text-coral" : "text-coral",
            )}
          >
            Live now
          </span>
        </span>
        <span
          className={cn(
            "inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-medium sm:text-xs",
            light ? "text-muted" : "text-white/45",
          )}
        >
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">
            {state.status === "ready"
              ? state.data.location
              : region
                ? region.coords.label
                : "Detecting location…"}
          </span>
        </span>
      </div>

      {state.status === "loading" ? (
        <div
          className={cn(
            "px-3.5 py-5 text-sm sm:px-4",
            light ? "text-muted" : "text-white/55",
          )}
        >
          {region
            ? `Updating conditions for ${region.label}…`
            : "Updating conditions for your location…"}
        </div>
      ) : state.status === "error" ? (
        <div
          className={cn(
            "px-3.5 py-5 text-sm sm:px-4",
            light ? "text-muted" : "text-white/55",
          )}
        >
          Conditions unavailable right now
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
          <div
            className={cn(
              "flex items-end justify-between gap-3 rounded-md px-3.5 py-3 sm:min-w-[7.5rem] sm:flex-col sm:items-start sm:justify-center sm:px-4",
              light
                ? "bg-foam ring-1 ring-border"
                : "bg-gradient-to-br from-aqua/20 to-white/[0.04] ring-1 ring-aqua/25",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px]",
                light ? "text-ocean" : "text-aqua",
              )}
            >
              <Thermometer className="h-3.5 w-3.5" aria-hidden />
              Temp
            </span>
            <span
              className={cn(
                "font-display text-4xl leading-none tracking-tight sm:text-5xl",
                light ? "text-ocean-deep" : "text-white",
              )}
            >
              {state.data.temperatureC}
              <span
                className={cn(
                  "align-top text-xl sm:text-2xl",
                  light ? "text-muted" : "text-white/70",
                )}
              >
                °
              </span>
            </span>
          </div>

          <div
            className={cn(
              "grid min-w-0 flex-1 gap-2",
              showTide ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {showTide ? (
              <MetricTile
                icon={Waves}
                label={tideLabel}
                value={tideValue}
                light={light}
              />
            ) : null}
            <MetricTile
              icon={Sun}
              label="Sunrise"
              value={state.data.sunrise}
              light={light}
            />
            <MetricTile
              icon={Moon}
              label="Sunset"
              value={state.data.sunset}
              light={light}
            />
          </div>
        </div>
      )}

      {state.status === "ready" && region ? (
        <p
          className={cn(
            "border-t px-3.5 py-2 text-[10px] sm:px-4",
            light
              ? "border-border text-muted"
              : "border-white/10 text-white/40",
          )}
        >
          Showing {region.label} - choose All Kenya for your device location
        </p>
      ) : state.status === "ready" && state.data.source === "fallback" ? (
        <p
          className={cn(
            "border-t px-3.5 py-2 text-[10px] sm:px-4",
            light
              ? "border-border text-muted"
              : "border-white/10 text-white/40",
          )}
        >
          Showing Nairobi - allow location or pick a region (e.g. Nanyuki)
        </p>
      ) : null}
    </div>
  );
}
