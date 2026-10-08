import { DESTINATION } from "@/lib/destination";

export type CoastNowPayload = {
  location: string;
  temperatureC: number;
  sunrise: string; // HH:mm
  sunset: string;
  nextTide: {
    type: "high" | "low";
    time: string; // HH:mm
    heightM: number;
  } | null;
  /** True when marine/tide data applies (near a coast) */
  coastal: boolean;
  updatedAt: string;
  source: "geolocation" | "fallback";
};

/** Nairobi fallback when the browser cannot share a location */
export const FALLBACK_COORDS = {
  lat: DESTINATION.coords.lat,
  lon: DESTINATION.coords.lon,
  tz: DESTINATION.coords.tz,
  label: DESTINATION.coords.label,
} as const;

/** @deprecated use FALLBACK_COORDS */
export const MOMBASA_COORDS = FALLBACK_COORDS;
/** @deprecated use FALLBACK_COORDS */
export const COAST_COORDS = FALLBACK_COORDS;

/** Rough East Africa Indian Ocean fringe where tide data is meaningful */
export function isCoastalLocation(lat: number, lon: number) {
  return lon >= 38.2 && lon <= 43.5 && lat >= -5.8 && lat <= 2.8;
}

export function clampCoord(lat: number, lon: number) {
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lon: Math.max(-180, Math.min(180, lon)),
  };
}
