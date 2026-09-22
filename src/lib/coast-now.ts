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

/** Mombasa Island / Likoni channel */
export const MOMBASA_COORDS = {
  lat: -4.0435,
  lon: 39.6682,
  tz: "Africa/Nairobi",
} as const;
