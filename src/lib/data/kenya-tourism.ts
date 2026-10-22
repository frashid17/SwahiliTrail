/**
 * Curated Kenya destination tourism statistics for the public /analytics page.
 * Sourced from Tourism Research Institute (TRI), Ministry of Tourism & Wildlife,
 * Directorate of Immigration Services, KNBS, and KWS-reported park figures.
 * There is no public live API — figures are updated when official reports publish.
 */

export const KENYA_TOURISM_SOURCES = [
  {
    id: "tri-2024",
    label: "TRI Annual Tourism Sector Performance Report 2024",
    url: "https://tri.go.ke/wp-content/uploads/2025/02/TRI-Tourism-Sector-Performance-Report-2024.pdf",
    year: 2024,
  },
  {
    id: "motw-2025",
    label: "Ministry of Tourism & Wildlife — 2025 sector growth release",
    url: "https://magicalkenya.com/wp-content/uploads/2026/04/KENYAS-TOURISM-SECTOR-ACHIEVES-STRONG-GROWTH-IN-2025-RECORDING-Ksh.-0.5-TRILLION-IN-EARNINGS_final-1.pdf",
    year: 2025,
  },
  {
    id: "tri-portal",
    label: "Tourism Research Institute",
    url: "https://tri.go.ke/",
    year: null,
  },
] as const;

/** International inbound arrivals by month, 2024 (TRI / Immigration). */
export const MONTHLY_INBOUND_2024 = [
  { month: "Jan", arrivals: 201_161 },
  { month: "Feb", arrivals: 195_778 },
  { month: "Mar", arrivals: 180_731 },
  { month: "Apr", arrivals: 154_211 },
  { month: "May", arrivals: 170_197 },
  { month: "Jun", arrivals: 202_617 },
  { month: "Jul", arrivals: 226_951 },
  { month: "Aug", arrivals: 249_086 },
  { month: "Sep", arrivals: 204_496 },
  { month: "Oct", arrivals: 200_937 },
  { month: "Nov", arrivals: 183_124 },
  { month: "Dec", arrivals: 225_087 },
] as const;

export const ANNUAL_INBOUND = [
  { year: 2020, arrivals: 567_848 },
  { year: 2021, arrivals: 870_465 },
  { year: 2022, arrivals: 1_483_752 },
  { year: 2023, arrivals: 2_089_259 },
  { year: 2024, arrivals: 2_394_376 },
  /** Preliminary / estimate from Ministry 2025 performance release. */
  { year: 2025, arrivals: 2_700_000, provisional: true },
] as const;

export const SOURCE_MARKETS_2024 = [
  { market: "United States", arrivals: 306_501, share: 12.8 },
  { market: "Uganda", arrivals: 225_559, share: 9.4 },
  { market: "Tanzania", arrivals: 203_290, share: 8.5 },
  { market: "United Kingdom", arrivals: 180_639, share: 7.5 },
  { market: "India", arrivals: 131_570, share: 5.5 },
  { market: "Italy", arrivals: 91_842, share: 3.8 },
  { market: "China", arrivals: 90_462, share: 3.8 },
  { market: "Germany", arrivals: 87_556, share: 3.7 },
  { market: "Somalia", arrivals: 81_555, share: 3.4 },
  { market: "Other", arrivals: 995_402, share: 41.6 },
] as const;

export const PURPOSE_OF_VISIT_2024 = [
  { theme: "Holiday / leisure", score: 44.2 },
  { theme: "Business / conference", score: 26.9 },
  { theme: "Visiting friends & relatives", score: 22.0 },
  { theme: "In transit", score: 4.2 },
  { theme: "Education & other niches", score: 2.7 },
] as const;

/** Top parks & reserves, 2024 — TRI / KWS-reported visitation. */
export const TOP_PARKS_2024 = [
  { name: "Nairobi Animal Orphanage", visits: 455_550 },
  { name: "Nairobi National Park", visits: 431_165 },
  { name: "Maasai Mara Reserve", visits: 343_000 },
  { name: "Kisumu Impala Sanctuary", visits: 309_728 },
  { name: "Lake Nakuru", visits: 293_107 },
  { name: "Nairobi Safari Walk", visits: 286_165 },
  { name: "Amboseli", visits: 266_102 },
  { name: "Tsavo East", visits: 238_545 },
  { name: "Hell's Gate", visits: 230_314 },
  { name: "Tsavo West", visits: 89_594 },
] as const;

export const KENYA_TOURISM_KPIS = {
  year: 2024,
  internationalArrivals: 2_394_376,
  arrivalsGrowthPct: 14.6,
  inboundEarningsKesBn: 452.2,
  earningsGrowthPct: 19.79,
  peakMonth: "Aug",
  peakArrivals: 249_086,
  holidayLeisureShare: 44.2,
  bedNightsTotal: 9_992_721,
  bedNightsInternational: 4_818_755,
  bedNightsDomestic: 5_173_966,
  parksAndReservesVisits: 3_741_900,
  museumsHeritageVisits: 1_152_700,
  cruiseArrivals: 6_561,
  jkiaSharePct: 67.8,
  /** Preliminary 2025 outlook (Ministry release). */
  outlook2025: {
    internationalArrivals: 2_700_000,
    domesticTravelers: 5_200_000,
    totalTourists: 7_900_000,
    earningsKesTn: 0.5,
  },
} as const;
