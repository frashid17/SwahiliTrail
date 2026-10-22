import type { PlanPlaceLink, SavedDayPlan, SavedPlan } from "@/lib/saved-trips";

/** Coerce model JSON quirks into plain strings safe for React. */
export function asPlainText(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => asPlainText(item))
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    // Common lodging shape: { area, hotel, rate }
    const hotel = asPlainText(record.hotel || record.name || record.stay);
    const area = asPlainText(record.area || record.location);
    const rate = asPlainText(record.rate || record.price || record.nightly);
    const parts = [
      hotel,
      area ? `in ${area}` : "",
      rate
        ? rate.includes("KES") || rate.includes("kes")
          ? `~${rate}`
          : `~KES ${rate}`
        : "",
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" · ");
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizePlace(raw: unknown): PlanPlaceLink | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const name = asPlainText(record.name);
  const mapsQuery = asPlainText(record.mapsQuery || record.maps || record.query);
  if (!name || !mapsQuery) return null;
  const est =
    typeof record.estCostKes === "number"
      ? record.estCostKes
      : Number(record.estCostKes);
  return {
    name,
    kind: asPlainText(record.kind) || undefined,
    mapsQuery,
    why: asPlainText(record.why) || undefined,
    estCostKes: Number.isFinite(est) ? est : undefined,
  };
}

function normalizeDay(raw: unknown, index: number): SavedDayPlan {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const places = Array.isArray(record.places)
    ? record.places.map(normalizePlace).filter(Boolean)
    : [];
  const dayNum =
    typeof record.day === "number" && Number.isFinite(record.day)
      ? record.day
      : index + 1;
  const cost =
    typeof record.estimatedDayCostKes === "number"
      ? record.estimatedDayCostKes
      : Number(record.estimatedDayCostKes);

  return {
    day: dayNum,
    theme: asPlainText(record.theme, `Day ${dayNum}`),
    location: asPlainText(record.location) || undefined,
    morning: asPlainText(record.morning),
    afternoon: asPlainText(record.afternoon),
    evening: asPlainText(record.evening),
    foodTip: asPlainText(record.foodTip),
    transportTip: asPlainText(record.transportTip),
    estimatedDayCostKes: Number.isFinite(cost) ? cost : 0,
    localIntel: asPlainText(record.localIntel) || undefined,
    timingNote: asPlainText(record.timingNote) || undefined,
    insiderTip: asPlainText(record.insiderTip) || undefined,
    places: places as PlanPlaceLink[],
  };
}

/** Normalize a raw AI plan payload into a SavedPlan-safe shape. */
export function normalizePlan(raw: unknown): SavedPlan {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const budget =
    record.budgetBreakdown && typeof record.budgetBreakdown === "object"
      ? (record.budgetBreakdown as Record<string, unknown>)
      : {};
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const days = Array.isArray(record.days)
    ? record.days.map((d, i) => normalizeDay(d, i))
    : [];

  const packing = Array.isArray(record.packingTips)
    ? record.packingTips.map((t) => asPlainText(t)).filter(Boolean)
    : [];
  const etiquette = Array.isArray(record.localEtiquette)
    ? record.localEtiquette.map((t) => asPlainText(t)).filter(Boolean)
    : [];

  return {
    title: asPlainText(record.title, "Kenya itinerary"),
    summary: asPlainText(record.summary),
    recommendedStay: asPlainText(
      record.recommendedStay,
      "We’ll match a stay to your route after generate.",
    ),
    days,
    packingTips: packing,
    localEtiquette: etiquette,
    budgetBreakdown: {
      lodgingKes: num(budget.lodgingKes),
      activitiesKes: num(budget.activitiesKes),
      foodKes: num(budget.foodKes),
      transportKes: num(budget.transportKes),
      contingencyKes: num(budget.contingencyKes),
      totalKes: num(budget.totalKes),
      notes: asPlainText(budget.notes),
    },
    stops: Array.isArray(record.stops)
      ? (record.stops as SavedPlan["stops"])
      : undefined,
  };
}
