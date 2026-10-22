import { COAST_AREAS } from "@/lib/data/hotels";

export type TripStop = {
  location: string;
  days: number;
};

/** Locations a traveler can pick as a stop (excludes "anywhere"). */
export const STOP_LOCATIONS = COAST_AREAS.filter(
  (area) => area.value !== "whole-coast",
);

export const MAX_TRIP_STOPS = 6;
export const MAX_STOP_DAYS = 7;
export const MAX_TRIP_DAYS = 14;

export function sumStopDays(stops: TripStop[]) {
  return stops.reduce((sum, stop) => sum + Math.max(0, stop.days || 0), 0);
}

export function defaultTripStops(): TripStop[] {
  return [
    { location: "Diani Beach", days: 3 },
    { location: "Mombasa Old Town", days: 2 },
  ];
}

export function formatStopsSummary(stops: TripStop[]) {
  return stops
    .map((stop) => {
      const label =
        STOP_LOCATIONS.find((a) => a.value === stop.location)?.label ??
        stop.location;
      return `${label} (${stop.days}d)`;
    })
    .join(" → ");
}

export function stopsPromptBlock(stops: TripStop[]) {
  let day = 1;
  const lines = stops.map((stop, index) => {
    const start = day;
    const end = day + stop.days - 1;
    day = end + 1;
    const label =
      STOP_LOCATIONS.find((a) => a.value === stop.location)?.label ??
      stop.location;
    return `Stop ${index + 1}: ${label} — days ${start}–${end} (${stop.days} day${stop.days === 1 ? "" : "s"})`;
  });
  return lines.join("\n");
}
