export type SavedDayPlan = {
  day: number;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  foodTip: string;
  transportTip: string;
  estimatedDayCostKes: number;
};

export type SavedPlan = {
  title: string;
  summary: string;
  recommendedStay: string;
  days: SavedDayPlan[];
  packingTips: string[];
  localEtiquette: string[];
  budgetBreakdown: {
    lodgingKes: number;
    activitiesKes: number;
    foodKes: number;
    transportKes: number;
    contingencyKes: number;
    totalKes: number;
    notes: string;
  };
};

export type TripStatus = "upcoming" | "completed";

export type SavedTrip = {
  id: string;
  savedAt: string;
  startDate: string;
  days: number;
  partySize: number;
  companions: string;
  budget: string;
  transportMode: string;
  plan: SavedPlan;
  /** Manual or auto-set completion */
  status: TripStatus;
  completedAt?: string;
};

const STORAGE_PREFIX = "swahili-trail-my-trips:";

function key(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function parseDateOnly(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Last calendar day of the trip (inclusive) */
export function tripEndDate(trip: Pick<SavedTrip, "startDate" | "days">) {
  const start = parseDateOnly(trip.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(trip.days, 1) - 1);
  return end;
}

export function isTripPast(trip: Pick<SavedTrip, "startDate" | "days">) {
  const end = tripEndDate(trip);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return end < today;
}

function normalizeTrip(raw: SavedTrip): SavedTrip {
  return {
    ...raw,
    status: raw.status === "completed" ? "completed" : "upcoming",
  };
}

/** Auto-complete trips whose last day has passed (unless already completed). */
export function syncTripStatuses(trips: SavedTrip[]): {
  trips: SavedTrip[];
  changed: boolean;
} {
  let changed = false;
  const next = trips.map((trip) => {
    const normalized = normalizeTrip(trip);
    if (normalized.status === "completed") return normalized;
    if (isTripPast(normalized)) {
      changed = true;
      return {
        ...normalized,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
      };
    }
    return normalized;
  });
  return { trips: next, changed };
}

export function loadSavedTrips(userId: string): SavedTrip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTrip[];
    if (!Array.isArray(parsed)) return [];
    const { trips, changed } = syncTripStatuses(parsed.map(normalizeTrip));
    if (changed) saveSavedTrips(userId, trips);
    return trips;
  } catch {
    return [];
  }
}

export function saveSavedTrips(userId: string, trips: SavedTrip[]) {
  localStorage.setItem(key(userId), JSON.stringify(trips));
}

export function getSavedTrip(
  userId: string,
  tripId: string,
): SavedTrip | null {
  return loadSavedTrips(userId).find((t) => t.id === tripId) ?? null;
}

export function addSavedTrip(
  userId: string,
  trip: Omit<SavedTrip, "id" | "savedAt" | "status" | "completedAt">,
): SavedTrip[] {
  const draft: SavedTrip = {
    ...trip,
    id: `trip-${Date.now()}`,
    savedAt: new Date().toISOString(),
    status: "upcoming",
  };
  const withAuto = isTripPast(draft)
    ? {
        ...draft,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
      }
    : draft;
  const trips = [withAuto, ...loadSavedTrips(userId)].slice(0, 20);
  saveSavedTrips(userId, trips);
  void pushTripsToCloud(trips);
  return trips;
}

export function updateSavedTrip(
  userId: string,
  tripId: string,
  patch: Partial<Pick<SavedTrip, "status" | "completedAt" | "plan" | "startDate">>,
): SavedTrip[] {
  const trips = loadSavedTrips(userId).map((t) =>
    t.id === tripId ? { ...t, ...patch } : t,
  );
  saveSavedTrips(userId, trips);
  void pushTripsToCloud(trips);
  return trips;
}

export function markTripComplete(userId: string, tripId: string): SavedTrip[] {
  return updateSavedTrip(userId, tripId, {
    status: "completed",
    completedAt: new Date().toISOString(),
  });
}

export function markTripUpcoming(userId: string, tripId: string): SavedTrip[] {
  return updateSavedTrip(userId, tripId, {
    status: "upcoming",
    completedAt: undefined,
  });
}

export function removeSavedTrip(userId: string, tripId: string): SavedTrip[] {
  const trips = loadSavedTrips(userId).filter((t) => t.id !== tripId);
  saveSavedTrips(userId, trips);
  void fetch(`/api/trips?id=${encodeURIComponent(tripId)}`, {
    method: "DELETE",
  }).catch(() => undefined);
  void pushTripsToCloud(trips);
  return trips;
}

export function isPlanSaved(userId: string, planTitle: string, days: number) {
  return loadSavedTrips(userId).some(
    (t) => t.plan.title === planTitle && t.days === days,
  );
}

function tripStamp(trip: SavedTrip) {
  return new Date(trip.completedAt ?? trip.savedAt).getTime();
}

/** Merge local + cloud by id, preferring the newer record. */
export function mergeTrips(local: SavedTrip[], remote: SavedTrip[]): SavedTrip[] {
  const map = new Map<string, SavedTrip>();
  for (const trip of [...local, ...remote].map(normalizeTrip)) {
    const prev = map.get(trip.id);
    if (!prev || tripStamp(trip) >= tripStamp(prev)) {
      map.set(trip.id, trip);
    }
  }
  const { trips } = syncTripStatuses([...map.values()]);
  return trips.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

async function pushTripsToCloud(trips: SavedTrip[]) {
  try {
    await fetch("/api/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trips }),
    });
  } catch {
    // Offline / not configured — local copy remains.
  }
}

/**
 * Load local trips, pull cloud copy, merge, persist both ways.
 * Call once after auth is ready so localhost and production share data.
 */
export async function syncSavedTripsFromCloud(
  userId: string,
): Promise<SavedTrip[]> {
  const local = loadSavedTrips(userId);
  try {
    const res = await fetch("/api/trips", { cache: "no-store" });
    if (!res.ok) return local;
    const data = (await res.json()) as { trips?: SavedTrip[]; cloud?: boolean };
    const remote = Array.isArray(data.trips) ? data.trips : [];
    const merged = mergeTrips(local, remote);
    saveSavedTrips(userId, merged);
    if (data.cloud) {
      await pushTripsToCloud(merged);
    }
    return merged;
  } catch {
    return local;
  }
}
