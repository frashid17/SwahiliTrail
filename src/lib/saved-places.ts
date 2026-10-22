export type SavedPlace = {
  id: string;
  name: string;
  area: string;
  imageUrl?: string;
  mapsUrl?: string;
  lat: number;
  lon: number;
  savedAt: string;
};

const STORAGE_KEY = "swahili-trail.saved-places.v1";

function keyFor(userId: string | null | undefined) {
  return `${STORAGE_KEY}:${userId ?? "guest"}`;
}

export function listSavedPlaces(userId?: string | null): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPlace[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPlaceSaved(
  userId: string | null | undefined,
  placeId: string,
): boolean {
  return listSavedPlaces(userId).some((p) => p.id === placeId);
}

export function toggleSavedPlace(
  userId: string | null | undefined,
  place: Omit<SavedPlace, "savedAt">,
): SavedPlace[] {
  const current = listSavedPlaces(userId);
  const exists = current.some((p) => p.id === place.id);
  const next = exists
    ? current.filter((p) => p.id !== place.id)
    : [{ ...place, savedAt: new Date().toISOString() }, ...current];
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("swahili-trail-saved-places"));
  } catch {
    /* ignore */
  }
  return next;
}
