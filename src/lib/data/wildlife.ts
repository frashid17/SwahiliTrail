import { COAST_IMAGES as img } from "@/lib/data/coast-images";
import { placePhoto } from "@/lib/data/place-photo-urls";

export type WildlifeSite = {
  id: string;
  name: string;
  type: "national-park" | "reserve" | "sanctuary" | "marine" | "wetland";
  region: string;
  blurb: string;
  about: string;
  tips: string[];
  highlights: string[];
  bestFor: string[];
  /** True when a same-day visit from Hola / Garsen / Mombasa is realistic */
  dayTripPossible: boolean;
  estEntryKes: number;
  durationHours: number;
  imageUrl: string;
  kwsUrl: string;
  bookingTip: string;
};

/** Kenya wildlife catalogue - reserves, parks, and coast nature days */
const WILDLIFE_SITES_BASE: WildlifeSite[] = [
  {
    id: "tana-primate-reserve",
    name: "Tana River Primate National Reserve",
    type: "reserve",
    region: "Tana River",
    blurb:
      "Riverine forest protecting endemic Tana River red colobus and crested mangabey.",
    about:
      "This KWS reserve protects fragments of gallery forest along the lower Tana. It is one of the few places left for the Tana River red colobus and Tana River crested mangabey. Visits need a guide who knows current access roads and seasonal water levels.",
    tips: [
      "Arrange a guide through recognized operators or the county tourism desk",
      "Expect rough access roads in the rains",
      "Bring binoculars - primates move high in the canopy",
      "Support community conservation messaging around the reserve",
    ],
    highlights: [
      "Tana River red colobus",
      "Crested mangabey",
      "Riverine forest",
      "Birdlife",
    ],
    bestFor: ["primates", "birding", "conservation"],
    dayTripPossible: true,
    estEntryKes: 2200,
    durationHours: 5,
    imageUrl: img.forestTrail,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip:
      "Book a local guide from Hola or Garsen; confirm road conditions the day before.",
  },
  {
    id: "tana-delta-wetlands",
    name: "Tana Delta wetlands & birding",
    type: "wetland",
    region: "Tana Delta / Kipini",
    blurb:
      "Mangroves, channels, and migratory birds where the river spreads toward the sea.",
    about:
      "The Tana Delta is a major wetland system. Boat mornings from Kipini or nearby landings show mangroves, fishing channels, and strong birdlife - especially in migration seasons. Go with a local crew who know tides and community boundaries.",
    tips: [
      "Confirm tides and departure time the night before",
      "Carry cash or M-Pesa for the boat crew",
      "Wear shoes you can get wet; pack sun cover and insect repellent",
      "Ask before photographing people at landings",
    ],
    highlights: [
      "Mangrove channels",
      "Waterbirds",
      "Fishing livelihoods",
      "River mouth views",
    ],
    bestFor: ["birding", "boats", "day trip"],
    dayTripPossible: true,
    estEntryKes: 2500,
    durationHours: 4,
    imageUrl: img.beachTropical,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip:
      "Ask your hotel or the county tourism desk for a vetted Kipini boat contact.",
  },
  {
    id: "arawale-reserve",
    name: "Arawale National Reserve",
    type: "reserve",
    region: "Tana River / Garissa border",
    blurb:
      "Dry bush and riverine habitat historically linked to Hirola antelope conservation.",
    about:
      "Arawale sits on the northern edge of Tana River country toward Garissa. Access is remote and seasonal. It is mainly of interest to visitors working with guides on arid-land wildlife and Hirola conservation stories - not a casual half-day stop.",
    tips: [
      "Only go with an experienced operator who knows current access",
      "Carry water and spare fuel - services are sparse",
      "Treat this as a specialist trip, not a casual add-on",
    ],
    highlights: ["Arid bush", "Hirola conservation story", "Remote landscape"],
    bestFor: ["specialist safari", "conservation"],
    dayTripPossible: false,
    estEntryKes: 2000,
    durationHours: 10,
    imageUrl: img.tsavoEastElephants,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip:
      "Plan with a licensed operator; check security and road advisories first.",
  },
  {
    id: "kipini-river-mouth",
    name: "Kipini river-mouth wildlife",
    type: "wetland",
    region: "Kipini, Tana Delta",
    blurb:
      "Quieter coast edge of the delta - shorebirds, mangroves, and fishing landings.",
    about:
      "Kipini sits near where the Tana meets the Indian Ocean. It is quieter than south-coast resorts and works well after a boat morning: walk the landing area, watch shorebirds, and talk with fishers about current conditions.",
    tips: [
      "Check road conditions from Garsen before travel",
      "Pack water and snacks - services can be sparse",
      "Respect landing and fishing spaces",
    ],
    highlights: ["Shorebirds", "Mangrove edge", "River mouth"],
    bestFor: ["birding", "quiet coast", "day trip"],
    dayTripPossible: true,
    estEntryKes: 0,
    durationHours: 3,
    imageUrl: img.nyaliBeach,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip:
      "Combine with a delta boat morning; no formal park gate at the landing.",
  },
  {
    id: "tsavo-east",
    name: "Tsavo East National Park",
    type: "national-park",
    region: "Taita-Taveta / coast hinterland",
    blurb:
      "Vast savannah with red elephants - the nearest big-park safari from the Tana corridor.",
    about:
      "Tsavo East is the classic big-park option if you have time for an overnight from the Tana corridor. Red elephants, open skies, and Mudanda Rock. Reach it via the Malindi–Mombasa corridor with a licensed operator.",
    tips: [
      "Book a licensed operator; overnight is better than a rushed day",
      "Carry dust protection for cameras",
      "Combine Mudanda Rock viewpoints with afternoon drives",
    ],
    highlights: ["Red elephants", "Mudanda Rock", "Lugard Falls", "Predators"],
    bestFor: ["safari", "overnight", "wildlife"],
    dayTripPossible: false,
    estEntryKes: 3600,
    durationHours: 24,
    imageUrl: img.tsavoEastElephants,
    kwsUrl: "https://www.kws.go.ke/tsavo-east-national-park",
    bookingTip:
      "Best as 1–2 nights with a licensed safari operator from the coast corridor.",
  },
  {
    id: "shimba-hills",
    name: "Shimba Hills National Reserve",
    type: "reserve",
    region: "Kwale (south of Mombasa)",
    blurb:
      "Coast rainforest day trip - elephants, sable antelope, and Sheldrick Falls.",
    about:
      "Shimba Hills is a full day from Mombasa or Diani: coastal rainforest, elephants, and Sheldrick Falls. A strong south-coast nature day when you are based near the beach.",
    tips: [
      "Start early for cooler game drives",
      "Wear closed shoes for short waterfall walks",
      "Confirm guide and park fees before departure",
    ],
    highlights: ["Sable antelope", "Elephants", "Sheldrick Falls", "Forest views"],
    bestFor: ["day trip", "nature", "photography"],
    dayTripPossible: true,
    estEntryKes: 2200,
    durationHours: 8,
    imageUrl: img.shimbaHills,
    kwsUrl: "https://www.kws.go.ke/shimba-hills-national-reserve",
    bookingTip: "Arrange a guided day safari from Diani or Mombasa; start early.",
  },
  {
    id: "tsavo-west",
    name: "Tsavo West National Park",
    type: "national-park",
    region: "Taita-Taveta",
    blurb:
      "Volcanic landscapes, Mzima Springs, and Ngulia rhino country.",
    about:
      "Tsavo West pairs with Tsavo East on a multi-day circuit. Mzima Springs and rhino sanctuary areas are the usual highlights. Plan overnight lodging.",
    tips: [
      "Mzima Springs is a highlight - allow time",
      "Overnight lodges make the drive worthwhile",
      "Ask operators about Ngulia access rules",
    ],
    highlights: ["Mzima Springs", "Ngulia Rhino Sanctuary", "Chaimu Crater"],
    bestFor: ["safari", "photography", "overnight"],
    dayTripPossible: false,
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
      "East Africa's largest coastal forest - birding and quiet walks near Malindi.",
    about:
      "Arabuko Sokoke is a north-coast nature day: forest trails, birding, and endemic species. Pair with Gede Ruins or Watamu if you are already on that corridor.",
    tips: [
      "Bring binoculars for birding",
      "Hire a local forest guide if available",
      "Carry water and insect repellent",
    ],
    highlights: ["Birding", "Forest walks", "Endemic species"],
    bestFor: ["birding", "nature", "day trip"],
    dayTripPossible: true,
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
      "Snorkeling and reef life - boats from Watamu beaches.",
    about:
      "A snorkel and reef day out of Watamu. Glass-bottom and snorkel boats work well for families when seas are calm.",
    tips: [
      "Check tide and weather with your boat captain",
      "Use reef-safe sunscreen",
      "Book ahead on weekends and holidays",
    ],
    highlights: ["Snorkeling", "Coral reefs", "Dolphins (seasonal)"],
    bestFor: ["water", "families", "day trip"],
    dayTripPossible: true,
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
      "South-coast marine park - dolphins, snorkeling, and Wasini Island lunches.",
    about:
      "Kisite Mpunguti is a full water day via Shimoni boats. Dolphins, snorkeling, and Wasini seafood - a classic south-coast outing.",
    tips: [
      "Join a reputable Shimoni operator",
      "Confirm whether park fees are included",
      "Bring a dry bag for phones and cameras",
    ],
    highlights: ["Dolphins", "Snorkeling", "Wasini Island"],
    bestFor: ["water", "day trip", "families"],
    dayTripPossible: true,
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
      "Easy sanctuary near Bamburi - giraffes, hippos, and short walks.",
    about:
      "Not a KWS park. Useful if you are already in Mombasa and want wildlife without a long drive. Giraffes, hippos, and family-friendly trails.",
    tips: [
      "Tickets are sold on arrival",
      "Good half-day with children",
      "Combine with a north-coast beach afternoon",
    ],
    highlights: ["Giraffes", "Hippos", "Family walks"],
    bestFor: ["families", "half day", "easy access"],
    dayTripPossible: true,
    estEntryKes: 1500,
    durationHours: 2.5,
    imageUrl: img.hallerParkGiraffe,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Buy tickets on arrival; combine with Bamburi Beach.",
  },
  {
    id: "nairobi-np",
    name: "Nairobi National Park",
    type: "national-park",
    region: "Nairobi",
    blurb: "Big-game park on the edge of the capital.",
    about:
      "Rhinos, lions, and open plains with the Nairobi skyline behind them. Perfect first safari when you land at JKIA or Wilson.",
    tips: [
      "Morning drives are best",
      "Book a guide if you are new to self-drive parks",
      "Allow 3–5 hours",
    ],
    highlights: ["Black rhino", "Lions", "City skyline views"],
    bestFor: ["safari", "half day", "families"],
    dayTripPossible: true,
    estEntryKes: 4300,
    durationHours: 4,
    imageUrl: img.tsavoEastElephants,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Enter at opening; shared game drives book from Nairobi hotels.",
  },
  {
    id: "maasai-mara-nr",
    name: "Maasai Mara National Reserve",
    type: "reserve",
    region: "Maasai Mara",
    blurb: "Kenya's flagship savannah for Big Five and migration season.",
    about:
      "Plan multiple game-drive days. The Great Migration (roughly July–October) is peak season; shoulder months can be quieter and greener.",
    tips: [
      "Budget park fees per person per 24 hours",
      "Flying safari saves a long Narok road day",
      "Book lodges early for migration months",
    ],
    highlights: ["Big Five", "Migration (seasonal)", "Hot-air balloons"],
    bestFor: ["safari", "photography", "overnight"],
    dayTripPossible: false,
    estEntryKes: 8000,
    durationHours: 48,
    imageUrl: img.tsavoEastElephants,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Book lodge + park fees with a licensed operator; 2+ nights ideal.",
  },
  {
    id: "amboseli-np",
    name: "Amboseli National Park",
    type: "national-park",
    region: "Amboseli",
    blurb: "Elephant country with Kilimanjaro as a backdrop.",
    about:
      "Famous for large elephant herds and dawn mountain views. Dusty in the dry season; magical when the peak is clear.",
    tips: [
      "Dawn for the best Kilimanjaro chance",
      "Protect cameras from dust",
      "2 nights is better than a rushed day",
    ],
    highlights: ["Elephants", "Kilimanjaro views", "Wetlands"],
    bestFor: ["safari", "photography", "overnight"],
    dayTripPossible: false,
    estEntryKes: 6000,
    durationHours: 24,
    imageUrl: img.tsavoWestMzima,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Combine with a Nairobi overnight transfer or fly-in lodge.",
  },
  {
    id: "lake-nakuru-np",
    name: "Lake Nakuru National Park",
    type: "national-park",
    region: "Nakuru",
    blurb: "Rift lake park - rhinos and waterbirds.",
    about:
      "A strong day or overnight from Nairobi. Flamingo numbers vary with water levels; rhinos and baboon cliffs remain reliable draws.",
    tips: [
      "Start early from Nairobi for a day trip",
      "Ask guides about current bird concentrations",
      "Pair with Naivasha if you have two days",
    ],
    highlights: ["Rhinos", "Waterbirds", "Baboon cliffs"],
    bestFor: ["safari", "day trip", "birding"],
    dayTripPossible: true,
    estEntryKes: 4300,
    durationHours: 8,
    imageUrl: img.beachTropical,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Day safari from Nairobi or overnight lodge inside/near the park.",
  },
  {
    id: "hells-gate-np",
    name: "Hell's Gate National Park",
    type: "national-park",
    region: "Naivasha",
    blurb: "Bikeable park with gorges and geothermal vents.",
    about:
      "One of the few Kenyan parks where cycling is a highlight. Cliffs, a gorge walk, and zebras on open roads near Naivasha.",
    tips: [
      "Hire bikes at the main gate",
      "Carry sun cover and water for the gorge",
      "Combine with a Lake Naivasha boat",
    ],
    highlights: ["Cycling", "Gorge walk", "Geothermal vents"],
    bestFor: ["adventure", "day trip", "families"],
    dayTripPossible: true,
    estEntryKes: 3000,
    durationHours: 6,
    imageUrl: img.shimbaHills,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Self-drive or day tour from Nairobi / Naivasha.",
  },
  {
    id: "mount-kenya-np",
    name: "Mount Kenya National Park",
    type: "national-park",
    region: "Nanyuki / Mount Kenya",
    blurb: "Alpine trails and forest approaches from Nanyuki and Naro Moru.",
    about:
      "Africa's second-highest peak. Day hikers use lower trails; summit bids need multi-day permits and licensed guides via Sirimon, Naro Moru, or Chogoria.",
    tips: [
      "Acclimatize in Nanyuki before long climbs",
      "Nights are cold even on short overnight treks",
      "Use KWS-registered mountain guides",
    ],
    highlights: ["Alpine scenery", "Forest wildlife", "Peak attempts"],
    bestFor: ["hiking", "adventure", "overnight"],
    dayTripPossible: false,
    estEntryKes: 3500,
    durationHours: 24,
    imageUrl: img.forestTrail,
    kwsUrl: "https://www.kws.go.ke/",
    bookingTip: "Base in Nanyuki; book a licensed Mount Kenya operator.",
  },
  {
    id: "ol-pejeta-wildlife",
    name: "Ol Pejeta Conservancy",
    type: "sanctuary",
    region: "Nanyuki / Laikipia",
    blurb: "Rhinos, chimps, and Laikipia plains near Nanyuki.",
    about:
      "A working conservancy with strong rhino programs and a chimpanzee sanctuary. Easy full day or overnight from Nanyuki.",
    tips: [
      "Book chimp sanctuary slots ahead",
      "Self-drive or guided options both work",
      "Support conservancy fees - they fund protection",
    ],
    highlights: ["Rhinos", "Chimpanzees", "Plains game"],
    bestFor: ["safari", "conservation", "families"],
    dayTripPossible: true,
    estEntryKes: 4500,
    durationHours: 6,
    imageUrl: img.tsavoWestMzima,
    kwsUrl: "https://www.olpejetaconservancy.org/",
    bookingTip: "Day visit or lodge stay from Nanyuki.",
  },
];

export const WILDLIFE_SITES: WildlifeSite[] = WILDLIFE_SITES_BASE.map((w) => ({
  ...w,
  imageUrl: placePhoto(w.id, w.imageUrl),
}));

export function getWildlifeSite(id: string) {
  return WILDLIFE_SITES.find((w) => w.id === id) ?? null;
}
