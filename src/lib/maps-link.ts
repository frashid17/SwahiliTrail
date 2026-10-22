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
