export type TripItemType =
  | "attraction"
  | "wildlife"
  | "hotel"
  | "restaurant";

export type TripCartItem = {
  id: string;
  type: TripItemType;
  name: string;
  area: string;
  estCostKes?: number;
  note?: string;
};

const STORAGE_PREFIX = "swahili-trail-trip-cart:";

function key(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadTripCart(userId: string): TripCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTripCart(userId: string, items: TripCartItem[]) {
  localStorage.setItem(key(userId), JSON.stringify(items));
}

export function addTripItem(userId: string, item: TripCartItem) {
  const items = loadTripCart(userId);
  if (items.some((i) => i.id === item.id && i.type === item.type)) {
    return items;
  }
  const next = [...items, item];
  saveTripCart(userId, next);
  return next;
}

export function removeTripItem(
  userId: string,
  id: string,
  type: TripItemType,
) {
  const next = loadTripCart(userId).filter(
    (i) => !(i.id === id && i.type === type),
  );
  saveTripCart(userId, next);
  return next;
}

export function clearTripCart(userId: string) {
  localStorage.removeItem(key(userId));
}
