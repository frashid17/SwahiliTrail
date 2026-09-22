import { COAST_IMAGES as img } from "@/lib/data/coast-images";
import { placePhoto } from "@/lib/data/place-photo-urls";

export type Attraction = {
  id: string;
  name: string;
  category: string;
  area: string;
  blurb: string;
  about: string;
  tips: string[];
  durationHours: number;
  estCostKes: number;
  familyFriendly: boolean;
  imageUrl: string;
  websiteUrl: string | null;
};

const ATTRACTIONS_BASE: Attraction[] = [
  {
    id: "fort-jesus",
    name: "Fort Jesus",
    category: "heritage",
    area: "Old Town",
    blurb: "UNESCO-listed Portuguese fort overlooking the Indian Ocean.",
    about:
      "Built by the Portuguese in the late 1500s, Fort Jesus is Mombasa's signature landmark. Walk the ramparts for harbor views, explore museum rooms on coastal history, and feel how the fort shaped Swahili trade routes.",
    tips: [
      "Go early to beat heat and tour groups",
      "Combine with an Old Town walking loop",
      "Carry small notes for entry and guides",
    ],
    durationHours: 2,
    estCostKes: 1200,
    familyFriendly: true,
    imageUrl: img.fortJesus,
    websiteUrl: "https://museums.or.ke/",
  },
  {
    id: "old-town",
    name: "Mombasa Old Town",
    category: "culture",
    area: "Old Town",
    blurb: "Narrow lanes, Swahili architecture, spice markets, and carved doors.",
    about:
      "Old Town is a living Swahili quarter of carved doors, balconies, spice stalls, and quiet courtyards. Wander slowly, respect local homes, and look for street snacks between Fort Jesus and the waterfront lanes.",
    tips: [
      "Wear modest clothing for residential streets",
      "Ask before photographing people or doorways",
      "Hire a local guide for deeper history",
    ],
    durationHours: 3,
    estCostKes: 500,
    familyFriendly: true,
    imageUrl: img.oldTownStreet,
    websiteUrl: null,
  },
  {
    id: "mama-ngina",
    name: "Mama Ngina Waterfront",
    category: "leisure",
    area: "CBD / Waterfront",
    blurb: "Sea breeze promenade, public art, food stalls, and sunset views.",
    about:
      "Mama Ngina Waterfront is Mombasa's modern promenade: ocean air, public art, evening walks, and casual food stalls. Ideal for sunset photos and an easy first evening in the city.",
    tips: [
      "Best light an hour before sunset",
      "Great with kids for open space walks",
      "Pair with a nearby seafood dinner",
    ],
    durationHours: 2,
    estCostKes: 0,
    familyFriendly: true,
    imageUrl: img.mamaNginaWaterfront,
    websiteUrl: null,
  },
  {
    id: "nyali-beach",
    name: "Nyali Beach",
    category: "beach",
    area: "Nyali",
    blurb: "Soft sand, resorts, and easy beach days north of the island.",
    about:
      "Nyali is the classic north-coast beach day: soft sand, resorts, and easy access from the island. Swim, lounge, or book a glass-bottom reef trip from nearby hotels.",
    tips: [
      "Check tide charts for better swimming",
      "Bring reef-safe sunscreen",
      "Combine with Haller Park for a family day",
    ],
    durationHours: 4,
    estCostKes: 0,
    familyFriendly: true,
    imageUrl: img.nyaliBeach,
    websiteUrl: null,
  },
  {
    id: "haller-park",
    name: "Haller Park",
    category: "nature",
    area: "Bamburi",
    blurb: "Rehabilitated quarry turned wildlife sanctuary with giraffes and hippos.",
    about:
      "Haller Park transformed a coral quarry into a green sanctuary. Expect giraffes, hippos, nature trails, and an easy half-day that works well for families staying on the north coast.",
    tips: [
      "Buy tickets on arrival",
      "Morning visits are cooler for walking",
      "Pair with Bamburi Beach after",
    ],
    durationHours: 2.5,
    estCostKes: 1500,
    familyFriendly: true,
    imageUrl: img.hallerParkGiraffe,
    websiteUrl: null,
  },
  {
    id: "diani",
    name: "Diani Beach",
    category: "beach",
    area: "South Coast",
    blurb: "Iconic white sand and turquoise water - a short ferry + drive away.",
    about:
      "Diani is the postcard South Coast: powder sand, turquoise water, and a relaxed resort strip. Reach it via the Likoni ferry plus a short drive, or as a day trip with a driver.",
    tips: [
      "Allow buffer time for Likoni ferry queues",
      "Great base for Wasini / Kisite boat days",
      "Book beach clubs or hotels ahead in peak season",
    ],
    durationHours: 8,
    estCostKes: 3000,
    familyFriendly: true,
    imageUrl: img.beachDiani,
    websiteUrl: null,
  },
  {
    id: "spice-market",
    name: "Mackinnon Market & Spice Stalls",
    category: "food",
    area: "Island",
    blurb: "Local produce, spices, and coastal flavors for food-curious travelers.",
    about:
      "Island markets and spice stalls are where coastal cooking comes alive - mangoes, chili, coriander, and everyday produce. Go with a guide or friendly stallholder if you want tasting tips.",
    tips: [
      "Keep valuables close in busy aisles",
      "Buy small spice packs as souvenirs",
      "Morning is freshest for produce",
    ],
    durationHours: 1.5,
    estCostKes: 800,
    familyFriendly: true,
    imageUrl: img.spices,
    websiteUrl: null,
  },
  {
    id: "likoni-ferry",
    name: "Likoni Ferry Crossing",
    category: "experience",
    area: "Likoni",
    blurb: "A classic Mombasa moment - crossing the channel toward the South Coast.",
    about:
      "The Likoni ferry is a working link and a traveler ritual. Crossing the channel toward the South Coast gives skyline and harbor views - expect queues at rush hour.",
    tips: [
      "Avoid peak morning and evening rush if possible",
      "Keep tickets and small change ready",
      "Stand on the open deck for photos",
    ],
    durationHours: 1,
    estCostKes: 200,
    familyFriendly: true,
    imageUrl: img.likoniFerry,
    websiteUrl: null,
  },
  {
    id: "ngomongo",
    name: "Ngomongo Villages",
    category: "culture",
    area: "Mtwapa",
    blurb: "Cultural villages experience showcasing Kenyan communities and crafts.",
    about:
      "Ngomongo Villages offers a curated look at Kenyan community traditions, crafts, and performances. It is an accessible culture stop north of Mombasa for travelers short on safari time.",
    tips: [
      "Check opening hours before you go",
      "Good for families and first-time visitors",
      "Combine with a Mtwapa or north-coast lunch",
    ],
    durationHours: 3,
    estCostKes: 2000,
    familyFriendly: true,
    imageUrl: img.cultureCraft,
    websiteUrl: null,
  },
  {
    id: "mamba-village",
    name: "Mamba Village Centre",
    category: "wildlife",
    area: "Nyali",
    blurb: "Crocodile farm, camel rides, and family-friendly animal encounters.",
    about:
      "Mamba Village is a family-friendly animal experience with crocodiles, camel rides, and easy access from Nyali. Treat it as a short stop rather than a full safari day.",
    tips: [
      "Ideal with kids between beach hours",
      "Ask about feeding or show times",
      "Combine with Nyali Beach the same day",
    ],
    durationHours: 2,
    estCostKes: 1500,
    familyFriendly: true,
    imageUrl: img.mambaVillageCrocodile,
    websiteUrl: null,
  },
  {
    id: "wasini",
    name: "Wasini Island & dolphin trip",
    category: "experience",
    area: "South Coast",
    blurb: "Boat day for dolphins, snorkeling, and seafood on Wasini.",
    about:
      "A South Coast classic: boat from Shimoni toward Kisite waters for dolphins and snorkeling, then seafood lunch on Wasini Island. Book a reputable operator and check sea conditions.",
    tips: [
      "Start early from Mombasa or Diani",
      "Bring reef-safe sunscreen and a dry bag",
      "Confirm park fees in the package",
    ],
    durationHours: 8,
    estCostKes: 8000,
    familyFriendly: true,
    imageUrl: img.snorkel,
    websiteUrl: null,
  },
  {
    id: "glass-bottom",
    name: "Glass-bottom boat / reef trip",
    category: "water",
    area: "Nyali / Bamburi",
    blurb: "Shallow reef viewing without diving - good with kids.",
    about:
      "Glass-bottom boat trips let you see reef life without diving. They are popular from Nyali and Bamburi and work well for families who want a short marine experience.",
    tips: [
      "Morning seas are often calmer",
      "Confirm trip length and group size",
      "Not a substitute for marine park snorkel days",
    ],
    durationHours: 2,
    estCostKes: 2500,
    familyFriendly: true,
    imageUrl: img.reefAerial,
    websiteUrl: null,
  },
];

export const ATTRACTIONS: Attraction[] = ATTRACTIONS_BASE.map((a) => ({
  ...a,
  imageUrl: placePhoto(a.id, a.imageUrl),
}));

export function getAttraction(id: string) {
  return ATTRACTIONS.find((a) => a.id === id) ?? null;
}

export const GUIDE_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ar", label: "Arabic", native: "العربية" },
] as const;

export type GuideLanguage = (typeof GUIDE_LANGUAGES)[number]["code"];
