/** Build a Google Maps search/directions URL from a place query. */
export function googleMapsSearchUrl(query: string) {
  const q = query.trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function googleMapsDirectionsUrl(destinationQuery: string) {
  const q = destinationQuery.trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** Multi-stop directions URL from ordered place queries. */
export function googleMapsMultiStopUrl(queries: string[]) {
  const stops = queries.map((q) => q.trim()).filter(Boolean);
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) return googleMapsDirectionsUrl(stops[0]!);
  const origin = encodeURIComponent(stops[0]!);
  const destination = encodeURIComponent(stops[stops.length - 1]!);
  const waypoints = stops
    .slice(1, -1)
    .map((s) => encodeURIComponent(s))
    .join("%7C");
  const wp = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wp}`;
}
