import { ATTRACTIONS } from "@/lib/data/attractions";
import { CAR_HIRES } from "@/lib/data/car-hires";
import { HOTELS } from "@/lib/data/hotels";
import { RESTAURANTS } from "@/lib/data/restaurants";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import type {
  PlanPlaceLink,
  SavedDayPlan,
  SavedPlan,
} from "@/lib/saved-trips";
import type { TripStop } from "@/lib/trip-stops";

export type CatalogueKind =
  | "attraction"
  | "wildlife"
  | "hotel"
  | "restaurant"
  | "car_hire";

export type CatalogueEntry = {
  id: string;
  kind: CatalogueKind;
  name: string;
  area: string;
  mapsQuery: string;
  estCostKes: number;
  durationHours?: number;
  imageUrl?: string;
  pricePerNight?: number;
};

const byId = new Map<string, CatalogueEntry>();

function index() {
  if (byId.size > 0) return byId;
  for (const a of ATTRACTIONS) {
    byId.set(a.id, {
      id: a.id,
      kind: "attraction",
      name: a.name,
      area: a.area,
      mapsQuery: `${a.name} ${a.area} Kenya`,
      estCostKes: a.estCostKes,
      durationHours: a.durationHours,
      imageUrl: a.imageUrl,
    });
  }
  for (const w of WILDLIFE_SITES) {
    byId.set(w.id, {
      id: w.id,
      kind: "wildlife",
      name: w.name,
      area: w.region,
      mapsQuery: `${w.name} ${w.region} Kenya`,
      estCostKes: w.estEntryKes,
      durationHours: w.durationHours,
      imageUrl: w.imageUrl,
    });
  }
  for (const h of HOTELS) {
    byId.set(h.id, {
      id: h.id,
      kind: "hotel",
      name: h.name,
      area: h.area,
      mapsQuery: `${h.name} ${h.area} Kenya`,
      estCostKes: h.pricePerNight,
      pricePerNight: h.pricePerNight,
      imageUrl: h.imageUrl,
    });
  }
  for (const r of RESTAURANTS) {
    byId.set(r.id, {
      id: r.id,
      kind: "restaurant",
      name: r.name,
      area: r.area,
      mapsQuery: `${r.name} ${r.area} Kenya`,
      estCostKes: r.avgMealKes,
      imageUrl: r.imageUrl,
    });
  }
  for (const c of CAR_HIRES) {
    byId.set(c.id, {
      id: c.id,
      kind: "car_hire",
      name: c.name,
      area: c.areas,
      mapsQuery: `${c.name} Kenya`,
      estCostKes: 0,
    });
  }
  return byId;
}

export function getCatalogueEntry(id: string): CatalogueEntry | undefined {
  return index().get(id);
}

export function lookupCatalogueByName(
  name: string,
  areaHint?: string,
): CatalogueEntry | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  const area = areaHint?.trim().toLowerCase();
  let best: CatalogueEntry | undefined;
  for (const entry of index().values()) {
    const entryName = entry.name.toLowerCase();
    if (entryName !== needle && !entryName.includes(needle) && !needle.includes(entryName)) {
      continue;
    }
    if (area && entry.area.toLowerCase().includes(area)) return entry;
    if (!best) best = entry;
  }
  return best;
}

/** Ground a place against the catalogue: fill id, maps, cost, duration. */
export function groundPlace(
  place: PlanPlaceLink,
  dayLocation?: string,
): PlanPlaceLink {
  const fromId = place.catalogueId
    ? getCatalogueEntry(place.catalogueId)
    : undefined;
  const fromName =
    fromId ?? lookupCatalogueByName(place.name, dayLocation || place.mapsQuery);
  if (!fromName) {
    return {
      ...place,
      catalogueLocked: false,
    };
  }
  return {
    ...place,
    catalogueId: fromName.id,
    name: fromName.name,
    kind: place.kind || fromName.kind,
    mapsQuery: fromName.mapsQuery,
    estCostKes: fromName.estCostKes || place.estCostKes,
    durationHours: fromName.durationHours ?? place.durationHours,
    imageUrl: fromName.imageUrl ?? place.imageUrl,
    catalogueLocked: true,
  };
}

function buildRouteLegs(stops?: TripStop[]) {
  if (!stops || stops.length < 2) return undefined;
  const legs = [];
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1]!.location;
    const to = stops[i]!.location;
    const estHours = estimateTransferHours(from, to);
    legs.push({
      from,
      to,
      mapsQuery: `${from} to ${to} Kenya`,
      estHours,
      warning:
        estHours != null && estHours >= 4.5
          ? `Long transfer (~${estHours}h) — keep arrival day light`
          : undefined,
    });
  }
  return legs;
}

export function groundPlan(plan: SavedPlan): SavedPlan {
  const days = plan.days.map((day) => {
    const places = (day.places ?? []).map((p) => groundPlace(p, day.location));
    const placeCost = places.reduce((s, p) => s + (p.estCostKes ?? 0), 0);
    return {
      ...day,
      places,
      estimatedDayCostKes:
        placeCost > 0 ? placeCost : day.estimatedDayCostKes,
    };
  });
  const grounded = { ...plan, days, routeLegs: buildRouteLegs(plan.stops) };
  const warnings = buildPlanWarnings(grounded, plan.stops);
  return { ...grounded, warnings };
}

const BUDGET_NIGHTLY_CAP: Record<string, number> = {
  budget: 9_000,
  mid: 18_000,
  luxury: 45_000,
};

/**
 * Recompute budget from catalogue rates when places are locked.
 * Falls back to AI estimates for unlocked / missing costs.
 */
export function recomputeBudgetFromCatalogue(
  plan: SavedPlan,
  opts: {
    partySize: number;
    budgetTier: string;
    nights: number;
  },
): SavedPlan {
  const party = Math.max(1, opts.partySize);
  const nights = Math.max(1, opts.nights);
  const cap = BUDGET_NIGHTLY_CAP[opts.budgetTier] ?? BUDGET_NIGHTLY_CAP.mid!;

  let activitiesKes = 0;
  let foodKes = 0;
  let lodgingFromPlaces = 0;
  let lockedCount = 0;
  let unlockedCount = 0;

  for (const day of plan.days) {
    for (const place of day.places ?? []) {
      if (place.catalogueLocked && place.catalogueId) lockedCount += 1;
      else unlockedCount += 1;
      const cost = place.estCostKes ?? 0;
      const kind = (place.kind || "").toLowerCase();
      if (kind === "hotel" || kind === "stay") {
        lodgingFromPlaces += cost;
      } else if (kind === "restaurant") {
        foodKes += cost * party;
      } else {
        activitiesKes += cost * (kind === "attraction" || kind === "wildlife" || kind === "park" ? party : 1);
      }
    }
  }

  const hotels = HOTELS.filter((h) => h.pricePerNight <= cap * 1.15);
  const avgNightly =
    hotels.length > 0
      ? Math.round(
          hotels.reduce((s, h) => s + h.pricePerNight, 0) / hotels.length,
        )
      : cap;
  const lodgingKes =
    lodgingFromPlaces > 0
      ? lodgingFromPlaces
      : avgNightly * nights;

  const ai = plan.budgetBreakdown;
  const transportKes = ai.transportKes || Math.round(4_500 * nights);
  const contingencyKes =
    ai.contingencyKes ||
    Math.round((lodgingKes + activitiesKes + foodKes + transportKes) * 0.1);
  const activities =
    activitiesKes > 0 ? activitiesKes : ai.activitiesKes || 0;
  const food = foodKes > 0 ? foodKes : ai.foodKes || party * 1_800 * nights;
  const totalKes =
    lodgingKes + activities + food + transportKes + contingencyKes;

  const notesParts = [
    lockedCount > 0
      ? `${lockedCount} catalogue-backed place${lockedCount === 1 ? "" : "s"}`
      : null,
    unlockedCount > 0
      ? `${unlockedCount} AI-suggested (not in catalogue)`
      : null,
    `Lodging band ~KES ${cap.toLocaleString("en-KE")}/night (${opts.budgetTier})`,
  ].filter(Boolean);

  return {
    ...plan,
    budgetBreakdown: {
      lodgingKes,
      activitiesKes: activities,
      foodKes: food,
      transportKes,
      contingencyKes,
      totalKes,
      notes: notesParts.join(" · "),
      catalogueBacked: lockedCount > 0,
    },
    catalogueStats: {
      lockedPlaces: lockedCount,
      unlockedPlaces: unlockedCount,
    },
  };
}

/** Rough inter-stop drive hours for common Kenya corridors (not GPS). */
const CORRIDOR_HOURS: Record<string, number> = {
  "nairobi|maasai mara": 5.5,
  "nairobi|amboseli": 4.5,
  "nairobi|nakuru / naivasha": 2.5,
  "nairobi|nanyuki / mount kenya": 3.5,
  "nairobi|mombasa old town": 7,
  "nairobi|diani beach": 8,
  "mombasa old town|diani beach": 1.5,
  "diani beach|wasini / shimoni": 1.5,
  "maasai mara|nakuru / naivasha": 5,
  "amboseli|nairobi": 4.5,
  "kisumu|nairobi": 6,
};

function normalizeLoc(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function estimateTransferHours(from: string, to: string): number | null {
  const a = normalizeLoc(from);
  const b = normalizeLoc(to);
  if (!a || !b || a === b) return 0;
  const key = `${a}|${b}`;
  const rev = `${b}|${a}`;
  if (CORRIDOR_HOURS[key] != null) return CORRIDOR_HOURS[key]!;
  if (CORRIDOR_HOURS[rev] != null) return CORRIDOR_HOURS[rev]!;
  // Fuzzy contains match
  for (const [k, hours] of Object.entries(CORRIDOR_HOURS)) {
    const [x, y] = k.split("|") as [string, string];
    if ((a.includes(x) || x.includes(a)) && (b.includes(y) || y.includes(b))) {
      return hours;
    }
    if ((a.includes(y) || y.includes(a)) && (b.includes(x) || x.includes(b))) {
      return hours;
    }
  }
  return null;
}

export type PlanWarning = {
  code: "long_transfer" | "heavy_day" | "missing_maps" | "thin_catalogue";
  day?: number;
  message: string;
};

export function buildPlanWarnings(
  plan: SavedPlan,
  stops?: TripStop[],
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const route = stops?.length ? stops : plan.stops;

  if (route && route.length > 1) {
    for (let i = 1; i < route.length; i++) {
      const from = route[i - 1]!.location;
      const to = route[i]!.location;
      const hours = estimateTransferHours(from, to);
      if (hours != null && hours >= 4.5) {
        warnings.push({
          code: "long_transfer",
          message: `${from} → ${to}: ~${hours}h road time — keep the arrival day light (transfer + settle only).`,
        });
      }
    }
  }

  for (const day of plan.days) {
    const places = day.places ?? [];
    const duration = places.reduce(
      (s, p) => s + (p.durationHours ?? (p.kind === "attraction" ? 2 : 1)),
      0,
    );
    if (places.length >= 5 || duration >= 9) {
      warnings.push({
        code: "heavy_day",
        day: day.day,
        message: `Day ${day.day} looks packed (${places.length} stops${duration ? `, ~${Math.round(duration)}h` : ""}). Consider dropping one activity.`,
      });
    }
    const missingMaps = places.filter((p) => !p.mapsQuery?.trim()).length;
    if (missingMaps > 0) {
      warnings.push({
        code: "missing_maps",
        day: day.day,
        message: `Day ${day.day}: ${missingMaps} place(s) missing Maps links.`,
      });
    }
  }

  const stats = plan.catalogueStats;
  if (stats && stats.lockedPlaces + stats.unlockedPlaces > 0) {
    const ratio =
      stats.lockedPlaces / (stats.lockedPlaces + stats.unlockedPlaces);
    if (ratio < 0.4) {
      warnings.push({
        code: "thin_catalogue",
        message:
          "Few places matched the Swahili Trail catalogue — treat costs and names as estimates until you lock stays.",
      });
    }
  }

  return warnings;
}

/** Compact trip context for the guide / refine prompts. */
export function formatTripContextBlock(input: {
  title: string;
  startDate?: string;
  partySize?: number;
  budget?: string;
  companions?: string;
  plan: SavedPlan;
  focusDay?: number;
}): string {
  const { plan } = input;
  const days = plan.days
    .map((d) => {
      const places = (d.places ?? [])
        .slice(0, 5)
        .map((p) =>
          p.catalogueId
            ? `${p.name} [${p.catalogueId}]`
            : p.name,
        )
        .join("; ");
      return `Day ${d.day}${d.location ? ` @ ${d.location}` : ""}: ${d.theme}. Places: ${places || "(none)"}`;
    })
    .join("\n");

  const focus =
    input.focusDay != null
      ? plan.days.find((d) => d.day === input.focusDay)
      : undefined;

  return [
    `Trip: ${input.title}`,
    input.startDate ? `Start: ${input.startDate}` : null,
    input.partySize ? `Party: ${input.partySize} (${input.companions || "travelers"})` : null,
    input.budget ? `Budget tier: ${input.budget}` : null,
    plan.stops?.length
      ? `Stops: ${plan.stops.map((s) => `${s.location} ${s.days}d`).join(" → ")}`
      : null,
    `Budget total ~KES ${plan.budgetBreakdown.totalKes.toLocaleString("en-KE")}`,
    focus
      ? `Focus day ${focus.day}: ${focus.theme}. ${focus.morning}`
      : null,
    "Itinerary:",
    days,
  ]
    .filter(Boolean)
    .join("\n");
}

export function summarizeDayForOperator(day: SavedDayPlan): string {
  const places = (day.places ?? [])
    .map((p) => p.name)
    .slice(0, 4)
    .join(", ");
  return `Day ${day.day}${day.location ? ` (${day.location})` : ""} — ${day.theme}. ${places ? `Stops: ${places}.` : ""} ${day.transportTip || ""}`.trim();
}
