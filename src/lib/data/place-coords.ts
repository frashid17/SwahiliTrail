import type { ExplorePlace } from "@/lib/data/explore-places";
import { KENYA_REGIONS, matchesKenyaRegion } from "@/lib/kenya-regions";

/** Known place pins (WGS84). Others fall back to region centers. */
const KNOWN: Record<string, { lat: number; lon: number }> = {
  "florida-club": { lat: -4.0705, lon: 39.6732 },
  "tembo-disco": { lat: -4.043, lon: 39.698 },
  "cubana-mombasa": { lat: -4.035, lon: 39.705 },
  "mv-plus-bar": { lat: -4.038, lon: 39.702 },
  "tamarind-dhow": { lat: -4.055, lon: 39.682 },
  "blaze-grill-night": { lat: -4.041, lon: 39.699 },
  "sails-diani-night": { lat: -4.279, lon: 39.588 },
  "nyali-beach": { lat: -4.045, lon: 39.715 },
  "diani-beach": { lat: -4.28, lon: 39.58 },
  "bamburi-beach": { lat: -3.995, lon: 39.732 },
  "wasini-kisite": { lat: -4.715, lon: 39.375 },
  "glass-bottom-nyali": { lat: -4.05, lon: 39.71 },
  "watamu-marine": { lat: -3.36, lon: 40.02 },
  "shimba-hills": { lat: -4.25, lon: 39.38 },
  "haller-park": { lat: -3.995, lon: 39.72 },
  "tsavo-west-day": { lat: -3.35, lon: 38.15 },
  "fort-jesus": { lat: -4.0626, lon: 39.6776 },
  "old-town-mombasa": { lat: -4.0615, lon: 39.676 },
  "ngomongo": { lat: -3.99, lon: 39.74 },
  "kite-diani": { lat: -4.29, lon: 39.585 },
  "scuba-diani": { lat: -4.275, lon: 39.59 },
  "camel-rides": { lat: -4.285, lon: 39.575 },
  "arabuko-trails": { lat: -3.32, lon: 39.98 },
  "mama-ngina-walk": { lat: -4.072, lon: 39.668 },
  "ocean-cleanup": { lat: -4.05, lon: 39.7 },
  "turtle-conservation": { lat: -3.355, lon: 40.01 },
  "nairobi-carnivore": { lat: -1.336, lon: 36.765 },
  "karura-trails": { lat: -1.24, lon: 36.83 },
  "nanyuki-equator": { lat: 0.0107, lon: 37.073 },
  "mount-kenya-trails": { lat: -0.15, lon: 37.3 },
  "hells-gate-bike": { lat: -0.915, lon: 36.315 },
};

function hashOffset(id: string): { dLat: number; dLon: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const dLat = ((h % 17) - 8) * 0.008;
  const dLon = (((h >> 4) % 17) - 8) * 0.008;
  return { dLat, dLon };
}

export function coordsForPlace(place: ExplorePlace): { lat: number; lon: number } {
  const known = KNOWN[place.id];
  if (known) return known;

  const hay = `${place.area} ${place.name} ${place.tags.join(" ")}`;
  for (const region of KENYA_REGIONS) {
    if (matchesKenyaRegion(hay, region.id)) {
      const { dLat, dLon } = hashOffset(place.id);
      return {
        lat: region.coords.lat + dLat,
        lon: region.coords.lon + dLon,
      };
    }
  }

  const { dLat, dLon } = hashOffset(place.id);
  return { lat: -1.2921 + dLat, lon: 36.8219 + dLon };
}
