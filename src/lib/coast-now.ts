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
  updatedAt: string;
};

/** Tana River Delta / Kipini — Blue Economy coastal window */
export const MOMBASA_COORDS = {
  lat: DESTINATION.coords.lat,
  lon: DESTINATION.coords.lon,
  tz: DESTINATION.coords.tz,
} as const;

/** Prefer DESTINATION.coords going forward */
export const COAST_COORDS = MOMBASA_COORDS;
