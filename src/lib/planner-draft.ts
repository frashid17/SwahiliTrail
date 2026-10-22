import type { TransportMode } from "@/lib/data/car-hires";
import type { SavedPlan } from "@/lib/saved-trips";
import type { TripStop } from "@/lib/trip-stops";

export type PlannerDraft = {
  plan: SavedPlan;
  stops: TripStop[];
  interests: string[];
  budget: "budget" | "mid" | "luxury";
  pace: "relaxed" | "balanced" | "packed";
  companions: "solo" | "couple" | "family" | "friends";
  partySize: number;
  transportMode: TransportMode;
  startDate: string;
  savedAt: string;
};

const STORAGE_PREFIX = "swahili-trail-planner-draft:";

function key(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadPlannerDraft(userId: string): PlannerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlannerDraft;
    if (!parsed?.plan || !Array.isArray(parsed.plan.days)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePlannerDraft(userId: string, draft: PlannerDraft) {
  localStorage.setItem(key(userId), JSON.stringify(draft));
}

export function clearPlannerDraft(userId: string) {
  localStorage.removeItem(key(userId));
}
