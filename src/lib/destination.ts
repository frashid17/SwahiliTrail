/**
 * Destination + platform framing for Swahili Trail (Kenya-wide).
 */

export const DESTINATION = {
  brand: "Swahili Trail",
  regionShort: "Kenya",
  regionLong: "Kenya",
  hubTown: "Nairobi",
  country: "Kenya",
  /** Default when geolocation is unavailable - Nairobi CBD */
  coords: {
    lat: -1.2921,
    lon: 36.8219,
    tz: "Africa/Nairobi" as const,
    label: "Nairobi",
  },
  /** Places API bias - country centroid-ish (Nairobi), wide radius used in callers */
  placesBias: {
    latitude: -1.2921,
    longitude: 36.8219,
  },
  tagline: "Plan Kenya the way locals talk about it.",
  supportingLine:
    "Safaris, city days, and coast weekends - with stays, a guide in six languages, and what's on nearby.",
} as const;

/** Optional calendar event - not product framing */
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

export const AI_REGION_CONTEXT = `Primary geography: Kenya as a whole.
Cover major corridors freely: Nairobi & central highlands, Rift Valley (Nakuru, Naivasha, Hell's Gate), Maasai Mara, Amboseli, Tsavo East/West, Mount Kenya / Nanyuki, western Kenya (Kisumu, Kakamega), northern circuits when asked, and the Swahili coast (Mombasa, Diani, Kilifi, Watamu, Malindi, Lamu, Tana Delta).
Match advice to the traveler's stated base and interests. Use practical logistics (roads, matatus, domestic flights, cash/M-Pesa, park fees, seasons).
Product: Swahili Trail is Kenya's travel platform - help travelers plan real trips year-round across the country.`;
