"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  GripVertical,
  MapPin,
  Minimize2,
  Moon,
  Sun,
  Thermometer,
  Waves,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import type { CoastNowPayload } from "@/lib/coast-now";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "swahili-trail.live-now-float.v2";

type Persist = {
  expanded: boolean;
  x: number;
  y: number;
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: CoastNowPayload };

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

function defaultPos() {
  if (typeof window === "undefined") return { x: 24, y: 120 };
  const fab = 56;
  return {
    x: Math.max(16, window.innerWidth - fab - 16),
    y: Math.max(96, window.innerHeight - fab - 28),
  };
}

function clampPos(x: number, y: number, w: number, h: number) {
  const maxX = Math.max(8, window.innerWidth - w - 8);
  /* Keep clear of sticky header (~4.5rem) and home indicator */
  const minY = 72;
  const maxY = Math.max(minY, window.innerHeight - h - 16);
  return {
    x: Math.min(maxX, Math.max(8, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-foam/80 px-2.5 py-2 ring-1 ring-border/80">
      <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon className="h-3 w-3 text-aqua" aria-hidden />
        {label}
      </p>
      <p className="mt-1 font-display text-base font-semibold text-ocean-deep">
        {value}
      </p>
    </div>
  );
}

/**
 * Site-wide Live Now widget - collapsible FAB, touch-friendly drag, persists position.
 */
export function LiveNowFloat() {
  const { regionId, region } = useKenyaLocation();
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState(defaultPos);
  const [hydrated, setHydrated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persist;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(
            clampPos(
              parsed.x,
              parsed.y,
              expanded ? 320 : 56,
              expanded ? 280 : 56,
            ),
          );
        }
        if (typeof parsed.expanded === "boolean") {
          setExpanded(parsed.expanded);
        }
      } else {
        setPos(defaultPos());
      }
    } catch {
      setPos(defaultPos());
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ expanded, x: pos.x, y: pos.y } satisfies Persist),
      );
    } catch {
      /* ignore */
    }
  }, [expanded, pos, hydrated]);

  useEffect(() => {
    function onResize() {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos((p) => clampPos(p.x, p.y, rect.width, rect.height));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const current = posRef.current;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: current.x,
      origY: current.y,
      moved: false,
      pointerId: e.pointerId,
    };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
    const el = rootRef.current;
    const w = el?.offsetWidth ?? 56;
    const h = el?.offsetHeight ?? 56;
    setPos(clampPos(d.origX + dx, d.origY + dy, w, h));
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!d.moved && !expanded) {
        setExpanded(true);
      }
    },
    [expanded],
  );

  const temp =
    state.status === "ready" ? `${state.data.temperatureC}°` : "··";
  const showTide =
    state.status === "ready" &&
    state.data.coastal &&
    Boolean(state.data.nextTide);

  if (!hydrated) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto fixed z-[55]"
      style={{
        left: pos.x,
        top: pos.y,
        touchAction: "none",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="w-[min(calc(100vw-1.5rem),20.5rem)] overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-[0_20px_50px_-24px_rgba(6,42,46,0.55)] ring-1 ring-gold/15 backdrop-blur-xl"
            role="dialog"
            aria-label="Live conditions"
          >
            <div
              className={cn(
                "flex touch-none items-center gap-2 border-b border-border/80 bg-brand-deep px-3 py-2.5",
                dragging ? "cursor-grabbing" : "cursor-grab",
              )}
              style={{ touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <GripVertical className="h-4 w-4 text-on-brand/45" aria-hidden />
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-coral">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
                Live now
              </span>
              <span className="ml-auto inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-on-brand/55">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">
                  {state.status === "ready"
                    ? state.data.location
                    : region
                      ? region.coords.label
                      : "…"}
                </span>
              </span>
              <button
                type="button"
                data-no-drag
                onClick={() => setExpanded(false)}
                className="rounded-lg p-1.5 text-on-brand/70 transition hover:bg-white/10 hover:text-on-brand"
                aria-label="Minimize to icon"
                title="Minimize"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                data-no-drag
                onClick={() => setExpanded(false)}
                className="rounded-lg p-1.5 text-on-brand/70 transition hover:bg-white/10 hover:text-on-brand lg:hidden"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3 p-3" data-no-drag>
              <KenyaLocationFilter
                variant="select"
                label="Show for"
                className="w-full [&_select]:max-w-none [&_select]:w-full"
              />

              {state.status === "loading" ? (
                <p className="py-4 text-center text-sm text-muted">
                  Updating conditions…
                </p>
              ) : state.status === "error" ? (
                <p className="py-4 text-center text-sm text-muted">
                  Conditions unavailable right now
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-aqua/15 to-foam px-3.5 py-3 ring-1 ring-aqua/20">
                    <Thermometer className="h-5 w-5 text-aqua" aria-hidden />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                        Temp
                      </p>
                      <p className="font-display text-3xl font-semibold leading-none text-ocean-deep">
                        {state.data.temperatureC}
                        <span className="text-lg text-muted">°</span>
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid gap-2",
                      showTide ? "grid-cols-3" : "grid-cols-2",
                    )}
                  >
                    {showTide ? (
                      <Metric
                        icon={Waves}
                        label={
                          state.data.nextTide?.type === "high"
                            ? "High tide"
                            : "Low tide"
                        }
                        value={state.data.nextTide?.time ?? "-"}
                      />
                    ) : null}
                    <Metric icon={Sun} label="Sunrise" value={state.data.sunrise} />
                    <Metric icon={Moon} label="Sunset" value={state.data.sunset} />
                  </div>
                  {region ? (
                    <p className="text-[10px] leading-snug text-muted">
                      Showing {region.label}. Choose All Kenya for device
                      location.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="fab"
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className={cn(
              "group relative flex h-14 w-14 touch-none items-center justify-center rounded-full bg-brand-deep text-on-brand shadow-[0_14px_36px_-12px_rgba(6,42,46,0.65)] ring-2 ring-gold/30 transition hover:ring-gold/55",
              dragging ? "cursor-grabbing scale-105 ring-gold/70" : "cursor-grab",
            )}
            style={{ touchAction: "none" }}
            aria-label={`Live now, ${temp}. Drag to move, tap to expand.`}
            title="Live now - drag to move, tap to open"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-brand-deep" />
            <Waves className="h-5 w-5 text-aqua transition group-hover:scale-110" />
            <span className="pointer-events-none absolute -bottom-1 left-1/2 hidden -translate-x-1/2 translate-y-full rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-ocean-deep shadow-sm ring-1 ring-border sm:block sm:opacity-0 sm:group-hover:opacity-100">
              {temp}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
