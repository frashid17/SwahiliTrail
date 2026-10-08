/**
 * Shared Kenya place filter for attractions, events, wildlife, explore, and Live now.
 */

export type KenyaRegion = {
  id: string;
  label: string;
  hint: string;
  /** Match against area / region / venue / title / tags */
  aliases: string[];
  coords: { lat: number; lon: number; label: string };
};

export const ALL_KENYA_ID = "all" as const;

export const KENYA_REGIONS: KenyaRegion[] = [
  {
    id: "nairobi",
    label: "Nairobi",
    hint: "Capital · parks, museums, nightlife",
    aliases: [
      "nairobi",
      "westlands",
      "karen",
      "langata",
      "kilimani",
      "nairobi cbd",
      "wilson",
      "karura",
    ],
    coords: { lat: -1.2921, lon: 36.8219, label: "Nairobi" },
  },
  {
    id: "nanyuki",
    label: "Nanyuki / Mount Kenya",
    hint: "Highlands · ranches · climbs",
    aliases: [
      "nanyuki",
      "mount kenya",
      "mt kenya",
      "nyeri",
      "naro moru",
      "timau",
      "laikipia",
    ],
    coords: { lat: 0.0107, lon: 37.073, label: "Nanyuki" },
  },
  {
    id: "nakuru",
    label: "Nakuru / Naivasha",
    hint: "Rift lakes · Hell's Gate",
    aliases: [
      "nakuru",
      "naivasha",
      "hell's gate",
      "hells gate",
      "elementaita",
      "rift valley",
      "gilgil",
    ],
    coords: { lat: -0.3031, lon: 36.08, label: "Nakuru" },
  },
  {
    id: "mara",
    label: "Maasai Mara",
    hint: "Safari · Big Five",
    aliases: ["maasai mara", "masai mara", "mara", "narok", "talek", "sekotek"],
    coords: { lat: -1.4061, lon: 35.0, label: "Maasai Mara" },
  },
  {
    id: "amboseli",
    label: "Amboseli",
    hint: "Elephants · Kilimanjaro views",
    aliases: ["amboseli", "loitokitok", "kimana", "kajiado"],
    coords: { lat: -2.6527, lon: 37.2606, label: "Amboseli" },
  },
  {
    id: "tsavo",
    label: "Tsavo",
    hint: "East & West parks",
    aliases: ["tsavo", "voi", "mtito andei", "taita"],
    coords: { lat: -3.0, lon: 38.5, label: "Tsavo" },
  },
  {
    id: "kisumu",
    label: "Kisumu / Lake Victoria",
    hint: "Western Kenya",
    aliases: ["kisumu", "lake victoria", "kakamega", "kisii", "homabay"],
    coords: { lat: -0.0917, lon: 34.768, label: "Kisumu" },
  },
  {
    id: "mombasa",
    label: "Mombasa & north coast",
    hint: "Island · Nyali · Bamburi · Kilifi",
    aliases: [
      "mombasa",
      "nyali",
      "bamburi",
      "shanzu",
      "mtwapa",
      "old town",
      "mama ngina",
      "likoni",
      "kilifi",
      "island",
      "cbd / waterfront",
    ],
    coords: { lat: -4.0435, lon: 39.6682, label: "Mombasa" },
  },
  {
    id: "diani",
    label: "Diani / south coast",
    hint: "White sand · Wasini",
    aliases: ["diani", "south coast", "ukunda", "shimoni", "wasini", "kwale"],
    coords: { lat: -4.28, lon: 39.58, label: "Diani" },
  },
  {
    id: "watamu",
    label: "Watamu / Malindi",
    hint: "Marine parks · Gede",
    aliases: ["watamu", "malindi", "gede", "arabuko", "kilifi / malindi"],
    coords: { lat: -3.36, lon: 40.0, label: "Watamu" },
  },
  {
    id: "lamu",
    label: "Lamu",
    hint: "UNESCO island town",
    aliases: ["lamu", "shela", "pate"],
    coords: { lat: -2.27, lon: 40.9, label: "Lamu" },
  },
  {
    id: "tana",
    label: "Tana River / delta",
    hint: "Hola · Kipini · Garsen",
    aliases: [
      "tana",
      "hola",
      "garsen",
      "kipini",
      "ngao",
      "delta",
      "tana delta",
      "tana river",
    ],
    coords: { lat: -2.525, lon: 40.527, label: "Tana Delta" },
  },
];

export const LOCATION_STORAGE_KEY = "swahili-trail-kenya-region";

export function getKenyaRegion(id: string | null | undefined) {
  if (!id || id === ALL_KENYA_ID) return null;
  return KENYA_REGIONS.find((r) => r.id === id) ?? null;
}

export function matchesKenyaRegion(
  haystack: string,
  regionId: string | null | undefined,
): boolean {
  if (!regionId || regionId === ALL_KENYA_ID) return true;
  const region = getKenyaRegion(regionId);
  if (!region) return true;
  const hay = haystack.toLowerCase();
  return region.aliases.some((alias) => hay.includes(alias.toLowerCase()));
}

export function filterByKenyaRegion<T>(
  items: T[],
  regionId: string | null | undefined,
  textOf: (item: T) => string,
): T[] {
  if (!regionId || regionId === ALL_KENYA_ID) return items;
  return items.filter((item) => matchesKenyaRegion(textOf(item), regionId));
}
