import { COAST_IMAGES as img } from "@/lib/data/coast-images";
import { placePhoto } from "@/lib/data/place-photo-urls";

export type WildlifeSite = {
  id: string;
  name: string;
  type: "national-park" | "reserve" | "sanctuary" | "marine";
  region: string;
  blurb: string;
  about: string;
  tips: string[];
  highlights: string[];
  bestFor: string[];
  dayTripFromMombasa: boolean;
  estEntryKes: number;
  durationHours: number;
  imageUrl: string;
  kwsUrl: string;
  bookingTip: string;
};

/** Coastal and nearby Kenya Wildlife Service / wildlife experiences */
const WILDLIFE_SITES_BASE: WildlifeSite[] = [
  {
    id: "shimba-hills",
    name: "Shimba Hills National Reserve",
    type: "reserve",
    region: "Kwale (south of Mombasa)",
    blurb:
      "Closest major KWS reserve to Mombasa - coastal rainforest, elephants, and Sheldrick Falls.",
    about:
      "Shimba Hills is the nearest major reserve to Mombasa: coastal rainforest, elephants, and Sheldrick Falls. Ideal as a full day trip from Diani or Mombasa with a licensed guide.",
    tips: [
      "Start early for cooler game drives",
      "Wear closed shoes for short waterfall walks",
      "Confirm guide and park fees before departure",
    ],
    highlights: ["Sable antelope", "Elephants", "Sheldrick Falls", "Forest views"],
    bestFor: ["day trip", "nature", "photography"],
    dayTripFromMombasa: true,
    estEntryKes: 2200,
    durationHours: 8,
    imageUrl: img.shimbaHills,
    kwsUrl: "https://www.kws.go.ke/shimba-hills-national-reserve",
    bookingTip: "Arrange a guided day safari from Diani or Mombasa; start early.",
  },
  {
    id: "tsavo-east",
    name: "Tsavo East National Park",
    type: "national-park",
    region: "Taita-Taveta / Coast hinterland",
    blurb:
      "Vast savannah park famous for red elephants and big skies - classic Coastal Circuit safari.",
    about:
      "Tsavo East is a vast savannah park known for red elephants, open skies, and classic Coastal Circuit safari scenery. Plan at least one overnight rather than a rushed day trip.",
    tips: [
      "Book a licensed operator from Mombasa",
      "Carry dust protection for cameras",
      "Combine Mudanda Rock viewpoints with afternoon game drives",
    ],
    highlights: ["Red elephants", "Mudanda Rock", "Lugard Falls", "Predators"],
    bestFor: ["safari", "overnight", "wildlife"],
    dayTripFromMombasa: false,
    estEntryKes: 3600,
    durationHours: 24,
    imageUrl: img.tsavoEastElephants,
    kwsUrl: "https://www.kws.go.ke/tsavo-east-national-park",
    bookingTip: "Best as 1-2 nights with a licensed safari operator from Mombasa.",
  },
  {
    id: "tsavo-west",
    name: "Tsavo West National Park",
    type: "national-park",
    region: "Taita-Taveta",
    blurb:
      "Volcanic landscapes, Mzima Springs, and Ngulia rhino sanctuary - dramatic Tsavo scenery.",
    about:
      "Tsavo West offers volcanic landscapes, Mzima Springs, and rhino sanctuary country. It pairs well with Tsavo East on a multi-day circuit from the coast.",
    tips: [
      "Mzima Springs is a highlight - allow time",
      "Overnight lodges make the journey worthwhile",
      "Ask operators about Ngulia access rules",
    ],
    highlights: ["Mzima Springs", "Ngulia Rhino Sanctuary", "Chaimu Crater"],
    bestFor: ["safari", "photography", "overnight"],
    dayTripFromMombasa: false,
    estEntryKes: 3600,
    durationHours: 24,
    imageUrl: img.tsavoWestMzima,
    kwsUrl: "https://www.kws.go.ke/tsavo-west-national-park",
    bookingTip: "Combine with Tsavo East on a multi-day safari circuit.",
  },
  {
    id: "arabuko-sokoke",
    name: "Arabuko Sokoke Forest Reserve",
    type: "reserve",
    region: "Kilifi / Malindi area",
    blurb:
      "East Africa's largest coastal forest - birding, endemic species, and quiet nature walks.",
    about:
      "Arabuko Sokoke is East Africa's largest coastal forest - quiet trails, birding, and endemic species. Pair it with Gede Ruins or Watamu for a full north-coast nature day.",
    tips: [
      "Bring binoculars for birding",
      "Hire a local forest guide if available",
      "Carry water and insect repellent",
    ],
    highlights: ["Birding", "Forest walks", "Endemic species"],
    bestFor: ["birding", "nature", "day trip"],
    dayTripFromMombasa: true,
    estEntryKes: 1500,
    durationHours: 6,
    imageUrl: img.arabukoSokoke,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Pair with Gede Ruins or Watamu on a north-coast day.",
  },
  {
    id: "watamu-marine",
    name: "Watamu Marine National Park",
    type: "marine",
    region: "Watamu",
    blurb:
      "Snorkeling and reef life in one of Kenya's marine parks - boats from Watamu beaches.",
    about:
      "Watamu Marine National Park is a snorkel and reef day out of Watamu beaches. Glass-bottom and snorkel boats make it accessible for families when seas are calm.",
    tips: [
      "Check tide and weather with your boat captain",
      "Use reef-safe sunscreen",
      "Book ahead on weekends and holidays",
    ],
    highlights: ["Snorkeling", "Coral reefs", "Dolphins (seasonal)"],
    bestFor: ["water", "families", "day trip"],
    dayTripFromMombasa: true,
    estEntryKes: 2000,
    durationHours: 6,
    imageUrl: img.watamuMarine,
    kwsUrl: "https://www.kws.go.ke/watamu-marine-national-park",
    bookingTip: "Book a glass-bottom or snorkel boat; check tide and weather.",
  },
  {
    id: "kisite-mpunguti",
    name: "Kisite Mpunguti Marine Park",
    type: "marine",
    region: "Shimoni / Wasini",
    blurb:
      "South-coast marine park known for dolphins, snorkeling, and Wasini Island seafood lunches.",
    about:
      "Kisite Mpunguti is the South Coast marine highlight - dolphins, snorkeling, and Wasini seafood lunches via Shimoni boats. One of the best full-day water experiences from Mombasa or Diani.",
    tips: [
      "Join a reputable Shimoni operator",
      "Confirm whether park fees are included",
      "Bring a dry bag for phones and cameras",
    ],
    highlights: ["Dolphins", "Snorkeling", "Wasini Island"],
    bestFor: ["water", "day trip", "families"],
    dayTripFromMombasa: true,
    estEntryKes: 2200,
    durationHours: 8,
    imageUrl: img.kisiteMpunguti,
    kwsUrl: "https://www.kws.go.ke/kisite-mpunguti-marine-park",
    bookingTip: "Join a Shimoni boat safari; bring reef-safe sunscreen.",
  },
  {
    id: "haller-kws-adj",
    name: "Haller Park (Bamburi)",
    type: "sanctuary",
    region: "Bamburi, Mombasa",
    blurb:
      "Not a KWS park, but a must-do coastal wildlife sanctuary - giraffes, hippos, and nature walks.",
    about:
      "Haller Park is not a KWS park, but it is a must-do coastal sanctuary: giraffes, hippos, and easy trails minutes from Bamburi Beach. Perfect when you want wildlife without a long drive.",
    tips: [
      "Tickets are sold on arrival",
      "Great half-day with children",
      "Combine with a north-coast beach afternoon",
    ],
    highlights: ["Giraffes", "Hippos", "Family walks"],
    bestFor: ["families", "half day", "easy access"],
    dayTripFromMombasa: true,
    estEntryKes: 1500,
    durationHours: 2.5,
    imageUrl: img.hallerParkGiraffe,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Buy tickets on arrival; combine with Bamburi Beach.",
  },
];

export const WILDLIFE_SITES: WildlifeSite[] = WILDLIFE_SITES_BASE.map((w) => ({
  ...w,
  imageUrl: placePhoto(w.id, w.imageUrl),
}));

export function getWildlifeSite(id: string) {
  return WILDLIFE_SITES.find((w) => w.id === id) ?? null;
}
