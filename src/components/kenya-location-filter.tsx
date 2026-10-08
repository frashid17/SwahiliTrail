"use client";

import { MapPin } from "lucide-react";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import { ALL_KENYA_ID, KENYA_REGIONS } from "@/lib/kenya-regions";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** compact = horizontal chips; select = dropdown for tight headers */
  variant?: "chips" | "select";
  label?: string;
  /** Light chips for dark backgrounds (home events band) */
  onDark?: boolean;
};

export function KenyaLocationFilter({
  className,
  variant = "chips",
  label = "Show places in",
  onDark = false,
}: Props) {
  const { regionId, setRegionId } = useKenyaLocation();

  if (variant === "select") {
    return (
      <label
        className={cn(
          "inline-flex min-w-0 flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-3",
          className,
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium",
            onDark ? "text-on-brand/80" : "text-ocean-deep",
          )}
        >
          <MapPin className="h-4 w-4 text-aqua" aria-hidden />
          {label}
        </span>
        <select
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          className="w-full max-w-xs rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ocean-deep outline-none transition focus:border-aqua focus:ring-2 focus:ring-aqua/20 sm:w-auto"
        >
          <option value={ALL_KENYA_ID}>All Kenya</option>
          {KENYA_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          onDark ? "text-on-brand/75" : "text-ocean-deep",
        )}
      >
        <MapPin className="h-4 w-4 text-aqua" aria-hidden />
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setRegionId(ALL_KENYA_ID)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
            regionId === ALL_KENYA_ID
              ? onDark
                ? "bg-coral text-white"
                : "bg-brand-deep text-white"
              : onDark
                ? "bg-white/10 text-on-brand/80 hover:bg-white/15"
                : "bg-surface text-muted hover:bg-sand",
          )}
        >
          All Kenya
        </button>
        {KENYA_REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.hint}
            onClick={() => setRegionId(r.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              regionId === r.id
                ? onDark
                  ? "bg-coral text-white"
                  : "bg-brand-deep text-white"
                : onDark
                  ? "bg-white/10 text-on-brand/80 hover:bg-white/15"
                  : "bg-surface text-muted hover:bg-sand",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
