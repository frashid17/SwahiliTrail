import type { Hotel } from "@/lib/data/hotels";

export type HotelSearchSnapshot = {
  budgetMax: number;
  vibe: string;
  travelers: "solo" | "couple" | "family" | "friends";
  mustHaves: string[];
  areaPreference: string;
  hotels: Hotel[];
  rationale: string | null;
  tips: string[];
  savedAt: string;
};

const STORAGE_PREFIX = "swahili-trail-hotels:";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadHotelSearch(
  userId: string,
): HotelSearchSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HotelSearchSnapshot;
    if (!parsed || !Array.isArray(parsed.hotels)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveHotelSearch(
  userId: string,
  snapshot: HotelSearchSnapshot,
) {
  localStorage.setItem(storageKey(userId), JSON.stringify(snapshot));
}

export function clearHotelSearch(userId: string) {
  localStorage.removeItem(storageKey(userId));
}
