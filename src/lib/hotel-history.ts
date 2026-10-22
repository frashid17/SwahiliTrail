import type { Hotel } from "@/lib/data/hotels";
import type { Restaurant } from "@/lib/data/restaurants";

export type StayEatMode = "hotels" | "restaurants";

export type HotelSearchSnapshot = {
  mode?: StayEatMode;
  budgetMax: number;
  vibe: string;
  travelers: "solo" | "couple" | "family" | "friends";
  mustHaves: string[];
  areaPreference: string;
  hotels: Hotel[];
  restaurants?: Restaurant[];
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
    if (!parsed) return null;
    if (!Array.isArray(parsed.hotels) && !Array.isArray(parsed.restaurants)) {
      return null;
    }
    return {
      ...parsed,
      hotels: Array.isArray(parsed.hotels) ? parsed.hotels : [],
      restaurants: Array.isArray(parsed.restaurants) ? parsed.restaurants : [],
      mode: parsed.mode === "restaurants" ? "restaurants" : "hotels",
    };
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
