import type { Hotel } from "@/lib/data/hotels";
import type { Restaurant } from "@/lib/data/restaurants";

export type AiMatchedPlace = {
  catalogueId?: string | null;
  name: string;
  area: string;
  rating?: number;
  priceKes?: number;
  vibe?: string;
  description?: string;
  tags?: string[];
  amenities?: string[];
  cuisine?: string;
  websiteUrl?: string | null;
  imageUrl?: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/** Distinct Unsplash fallbacks when Google Places photo is unavailable. */
const HOTEL_FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1618773928122-d162df870cd4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1200&q=80",
];

const FOOD_FALLBACKS = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80",
];

function hashPick(seed: string, pool: string[]) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[h % pool.length]!;
}

function bookingSearchUrl(name: string, area: string) {
  const q = encodeURIComponent(`${name} ${area} Kenya`);
  return `https://www.booking.com/searchresults.html?ss=${q}`;
}

function mapsSearchUrl(name: string, area: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(`${name} ${area} Kenya`)}`;
}

export function aiPlaceToHotel(
  place: AiMatchedPlace,
  catalogue?: Hotel | null,
): Hotel {
  if (catalogue) {
    // Keep catalogue row but allow a freshly resolved Google photo override.
    if (place.imageUrl) return { ...catalogue, imageUrl: place.imageUrl };
    return catalogue;
  }

  const name = place.name.trim();
  const area = place.area.trim() || "Kenya";
  const id = `ai-${slugify(name) || "stay"}`;
  const price = Math.max(
    1000,
    Math.round(Number(place.priceKes) || 15000),
  );
  const rating = Math.min(
    5,
    Math.max(3, Number(place.rating) || 4.3),
  );

  return {
    id,
    name,
    area,
    rating: Math.round(rating * 10) / 10,
    pricePerNight: price,
    currency: "KES",
    tags: (place.tags?.length ? place.tags : ["recommended"]).slice(0, 6),
    vibe: place.vibe?.trim() || "Recommended stay",
    description:
      place.description?.trim() ||
      `${name} in ${area} — suggested for your trip preferences.`,
    amenities: (place.amenities?.length ? place.amenities : ["Wi-Fi"]).slice(
      0,
      6,
    ),
    imageGradient: "from-teal-700 via-cyan-500 to-sky-400",
    imageUrl:
      place.imageUrl?.trim() || hashPick(`${name}|${area}`, HOTEL_FALLBACKS),
    websiteUrl: place.websiteUrl?.trim() || null,
    bookingUrl: bookingSearchUrl(name, area),
  };
}

export function aiPlaceToRestaurant(
  place: AiMatchedPlace,
  catalogue?: Restaurant | null,
): Restaurant {
  if (catalogue) {
    if (place.imageUrl) return { ...catalogue, imageUrl: place.imageUrl };
    return catalogue;
  }

  const name = place.name.trim();
  const area = place.area.trim() || "Kenya";
  const id = `ai-${slugify(name) || "restaurant"}`;
  const avg = Math.max(400, Math.round(Number(place.priceKes) || 2000));
  const rating = Math.min(
    5,
    Math.max(3, Number(place.rating) || 4.2),
  );
  const priceLevel: Restaurant["priceLevel"] =
    avg >= 3500 ? "KES $$$" : avg >= 1800 ? "KES $$" : "KES $";

  return {
    id,
    name,
    area,
    cuisine: place.cuisine?.trim() || "Kenyan / International",
    priceLevel,
    avgMealKes: avg,
    rating: Math.round(rating * 10) / 10,
    tags: (place.tags?.length ? place.tags : ["recommended"]).slice(0, 6),
    vibe: place.vibe?.trim() || "Recommended dining",
    description:
      place.description?.trim() ||
      `${name} in ${area} — suggested for your trip preferences.`,
    imageUrl:
      place.imageUrl?.trim() || hashPick(`${name}|${area}`, FOOD_FALLBACKS),
    websiteUrl: place.websiteUrl?.trim() || null,
    mapsUrl: mapsSearchUrl(name, area),
  };
}
