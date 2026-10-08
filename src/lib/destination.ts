/**
 * Destination + summit framing for Swahili Trail.
 * Retargeted for Innovation and Business Summit 2026 (Hola, Tana River).
 */

export const DESTINATION = {
  brand: "Swahili Trail",
  regionShort: "Tana River",
  regionLong: "Tana River County and the Kenyan coast",
  hubTown: "Hola",
  /** Kipini / Tana Delta — Blue Economy coastal window for live conditions */
  coords: {
    lat: -2.525,
    lon: 40.527,
    tz: "Africa/Nairobi" as const,
    label: "Tana Delta",
  },
  /** Places API bias around Hola / mid-county */
  placesBias: {
    latitude: -1.5,
    longitude: 40.03,
  },
  tagline: "Trip tools for Tana River - built for IBS 2026.",
  supportingLine:
    "Plan days, match stays, ask a guide in six languages, and pull a short visitor brief for Hola and nearby coast towns.",
} as const;

export const SUMMIT = {
  name: "Innovation and Business Summit 2026",
  shortName: "IBS 2026",
  theme: "Commercialization of Innovations for Sustainable Growth",
  datesLabel: "7–10 October 2026",
  startsAt: "2026-10-07T09:00:00+03:00",
  endsAt: "2026-10-10T17:00:00+03:00",
  venue: "Tana River Training, Innovation & Youth Empowerment Centre",
  town: "Hola, Tana River County",
  host: "H.E. Maj. (Rtd.) Dr. Dhadho Godhana",
  hostRole:
    "Governor of Tana River County · Chairperson, Jumuiya ya Kaunti za Pwani",
  focusSectors: [
    "Blue Economy",
    "Agriculture",
    "Tech / AI",
    "Health",
  ] as const,
  mapsUrl:
    "https://maps.google.com/?q=Tana+River+Training+Innovation+Youth+Empowerment+Centre+Hola",
} as const;

export const AI_REGION_CONTEXT = `Primary geography: Tana River County (Hola, Garsen, Kipini, Ngao, Tana Delta). Wider Jumuiya coast towns only when a day trip helps.
Focus on river-delta culture (Pokomo, Orma), farming and fishing livelihoods, and practical visitor logistics (roads, lodging, cash/M-Pesa).
When Mombasa or south-coast sites appear in catalogues, treat them as optional side trips - not the default base.
Event framing: Innovation and Business Summit 2026 (IBS 2026) in Hola, 7–10 October 2026.`;
