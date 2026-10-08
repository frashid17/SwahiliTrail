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
    id: "tana-delta",
    name: "Tana River Delta",
    category: "nature",
    area: "Tana Delta",
    blurb: "Mangroves, birdlife, and the river meeting the Indian Ocean.",
    about:
      "The Tana Delta is one of Kenya's major wetland systems. Visitors come for birdwatching, boat trips, mangrove landscapes, and fishing communities. Pair with Kipini if you want to see where the river meets the sea.",
    tips: [
      "Go with a local boat operator who knows channels and tides",
      "Carry mosquito protection and sun cover",
      "Ask about community guidelines before photographing people or ceremonies",
    ],
    durationHours: 4,
    estCostKes: 3500,
    familyFriendly: true,
    imageUrl: img.beachTropical,
    websiteUrl: null,
  },
  {
    id: "hola-ibs",
    name: "Hola Town Circuit",
    category: "culture",
    area: "Hola",
    blurb: "County seat - markets, youth venues, and a practical trip base.",
    about:
      "Hola is the county seat of Tana River. Use it as a base for markets, local meetings, and short visits to nearby river communities before heading to the delta or Garsen corridor.",
    tips: [
      "Book lodging early in peak months and busy county weeks",
      "Ask locally about market days and venue open hours",
      "Combine with a delta day trip if your schedule allows",
    ],
    durationHours: 3,
    estCostKes: 0,
    familyFriendly: true,
    imageUrl: img.mamaNginaWaterfront,
    websiteUrl: null,
  },
  {
    id: "tana-primate-reserve",
    name: "Tana River Primate National Reserve",
    category: "wildlife",
    area: "Tana River",
    blurb: "Rare riverine forest habitat protecting endemic Tana River primates.",
    about:
      "This reserve protects fragments of riverine forest along the lower Tana and is known for endemic primates and birdlife. Visits usually need advance planning with guides who understand access rules and seasonal conditions.",
    tips: [
      "Arrange a guide through recognized operators",
      "Expect rough access roads in wet periods",
      "Support community conservation messaging",
    ],
    durationHours: 5,
    estCostKes: 4500,
    familyFriendly: false,
    imageUrl: img.hallerParkGiraffe,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "kipini-coast",
    name: "Kipini & river mouth",
    category: "beach",
    area: "Tana Delta",
    blurb: "Where the Tana meets the sea - quieter than the south coast resorts.",
    about:
      "Kipini sits near the Tana River mouth. Good for fishing culture, quiet coast time, and seeing how river and ocean livelihoods meet.",
    tips: [
      "Check tide and road conditions before travel",
      "Pack water and snacks - services can be sparse",
      "Respect landing and fishing spaces",
    ],
    durationHours: 4,
    estCostKes: 2000,
    familyFriendly: true,
    imageUrl: img.nyaliBeach,
    websiteUrl: null,
  },
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
  {
    id: "nairobi-national-park",
    name: "Nairobi National Park",
    category: "wildlife",
    area: "Nairobi",
    blurb: "Wildlife against the city skyline - rhinos, lions, and open plains.",
    about:
      "Kenya's oldest national park sits on Nairobi's doorstep. Morning game drives can deliver rhinos, giraffes, and lions with skyscrapers on the horizon. Ideal first or last safari day.",
    tips: [
      "Enter at opening for cooler wildlife activity",
      "Book a licensed guide or join a shared drive",
      "Combine with the David Sheldrick orphanage when slots allow",
    ],
    durationHours: 4,
    estCostKes: 4300,
    familyFriendly: true,
    imageUrl: img.tsavoEastElephants,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "giraffe-centre",
    name: "Giraffe Centre",
    category: "wildlife",
    area: "Karen, Nairobi",
    blurb: "Feed Rothschild's giraffes and learn about conservation.",
    about:
      "A classic Nairobi stop in Karen. Walk the elevated platform, feed giraffes, and support breeding and education work for Rothschild's giraffes.",
    tips: [
      "Arrive early to avoid school groups",
      "Pair with Kazuri Beads or the Karen Blixen Museum",
      "Keep phones secure on the feeding platform",
    ],
    durationHours: 1.5,
    estCostKes: 1500,
    familyFriendly: true,
    imageUrl: img.hallerParkGiraffe,
    websiteUrl: "https://www.giraffecentre.org/",
  },
  {
    id: "nairobi-national-museum",
    name: "Nairobi National Museum",
    category: "heritage",
    area: "Nairobi",
    blurb: "Kenya's story in one building - fossils, cultures, and birds.",
    about:
      "The national museum anchors Museum Hill with archaeology, ethnography, and a strong bird gallery. A solid rainy-day or first-day orientation to the country.",
    tips: [
      "Allow 2–3 hours if you read the galleries",
      "Snake park next door is optional with kids",
      "Cafe on site for a short break",
    ],
    durationHours: 2.5,
    estCostKes: 1200,
    familyFriendly: true,
    imageUrl: img.cultureCraft,
    websiteUrl: "https://museums.or.ke/",
  },
  {
    id: "karura-forest",
    name: "Karura Forest",
    category: "nature",
    area: "Nairobi",
    blurb: "Trails, waterfalls, and green space inside the capital.",
    about:
      "Karura is Nairobi's urban forest: cycling and walking trails, caves, and a waterfall. Buy a day ticket at the gate and stick to marked paths.",
    tips: [
      "Weekday mornings are quieter",
      "Carry water; some loops are longer than they look",
      "Use official entry points only",
    ],
    durationHours: 3,
    estCostKes: 600,
    familyFriendly: true,
    imageUrl: img.forestTrail,
    websiteUrl: null,
  },
  {
    id: "mount-kenya-nanyuki",
    name: "Mount Kenya day from Nanyuki",
    category: "adventure",
    area: "Nanyuki",
    blurb: "Highland air, ranch views, and trailheads toward Africa's second peak.",
    about:
      "Nanyuki is the practical base for Mount Kenya approaches, ranch stays, and cool-climate walks. Day hikers can join short forest or ridge walks; multi-day climbers start from Naro Moru or Sirimon.",
    tips: [
      "Nights are cold - pack a warm layer",
      "Book guides through licensed mountain operators",
      "Altitude can surprise - take it slow on first days",
    ],
    durationHours: 8,
    estCostKes: 8000,
    familyFriendly: false,
    imageUrl: img.forestTrail,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "nanyuki-town",
    name: "Nanyuki town & equator",
    category: "leisure",
    area: "Nanyuki",
    blurb: "Equator markers, highland markets, and a calm trip base.",
    about:
      "Nanyuki mixes a small highland town with tourist infrastructure - cafes, craft shops, and the famous equator photo stops on the Nanyuki–Nyeri corridor.",
    tips: [
      "Equator demos vary - agree a tip before the show",
      "Good base for Ol Pejeta or Mount Kenya day trips",
      "Evenings cool quickly after sunset",
    ],
    durationHours: 2,
    estCostKes: 500,
    familyFriendly: true,
    imageUrl: img.mamaNginaWaterfront,
    websiteUrl: null,
  },
  {
    id: "ol-pejeta",
    name: "Ol Pejeta Conservancy",
    category: "wildlife",
    area: "Nanyuki / Laikipia",
    blurb: "Rhino sanctuary, chimps, and open Laikipia plains.",
    about:
      "Ol Pejeta near Nanyuki is known for black and northern white rhino conservation, a chimpanzee sanctuary, and classic plains game. Easy overnight or full-day from Nanyuki.",
    tips: [
      "Book conservation talks and chimp visits ahead",
      "Self-drive is possible; guides add value",
      "Combine with a Nanyuki town evening",
    ],
    durationHours: 6,
    estCostKes: 4500,
    familyFriendly: true,
    imageUrl: img.tsavoWestMzima,
    websiteUrl: "https://www.olpejetaconservancy.org/",
  },
  {
    id: "lake-nakuru",
    name: "Lake Nakuru National Park",
    category: "wildlife",
    area: "Nakuru",
    blurb: "Flamingos (seasonal), rhinos, and Rift Valley viewpoints.",
    about:
      "Lake Nakuru is a classic Rift day or overnight from Nairobi. Rhinos, waterbirds, and baboon cliffs are the usual highlights when water levels cooperate.",
    tips: [
      "Check current flamingo numbers - they move with water levels",
      "Allow a full day from Nairobi with an early start",
      "Pair with Elementaita or Naivasha if you have two days",
    ],
    durationHours: 8,
    estCostKes: 4300,
    familyFriendly: true,
    imageUrl: img.beachTropical,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "hells-gate",
    name: "Hell's Gate National Park",
    category: "adventure",
    area: "Naivasha",
    blurb: "Bike or walk among cliffs, gorges, and geothermal steam.",
    about:
      "Hell's Gate near Naivasha lets you cycle past zebras and into a dramatic gorge. Geothermal vents and climbing cliffs make it a favorite active day from Nairobi.",
    tips: [
      "Hire bikes at the gate or bring your own",
      "Carry water - the gorge walk is dry and warm",
      "Combine with a Lake Naivasha boat in the afternoon",
    ],
    durationHours: 6,
    estCostKes: 3000,
    familyFriendly: true,
    imageUrl: img.shimbaHills,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "maasai-mara-viewpoint",
    name: "Maasai Mara game drives",
    category: "wildlife",
    area: "Maasai Mara",
    blurb: "Kenya's signature savannah - Big Five and the Great Migration season.",
    about:
      "The Mara is the country's best-known safari landscape. Plan at least two full game-drive days; migration timing (roughly July–October) draws peak crowds and rates.",
    tips: [
      "Fly or drive via Narok; flying saves a long road day",
      "Budget for park fees per person per day",
      "Book lodges early for July–October",
    ],
    durationHours: 48,
    estCostKes: 12000,
    familyFriendly: true,
    imageUrl: img.tsavoEastElephants,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "amboseli-kilimanjaro",
    name: "Amboseli & Kilimanjaro views",
    category: "wildlife",
    area: "Amboseli",
    blurb: "Elephant herds with Africa's highest peak on clear mornings.",
    about:
      "Amboseli is famous for large elephant families and dawn views of Kilimanjaro when clouds lift. A strong 2-night add-on from Nairobi or the coast.",
    tips: [
      "Clear Kilimanjaro views are most common at dawn",
      "Dust is real - protect cameras and lenses",
      "Combine with a Maasai cultural visit if offered ethically",
    ],
    durationHours: 24,
    estCostKes: 9000,
    familyFriendly: true,
    imageUrl: img.tsavoWestMzima,
    websiteUrl: "https://www.kws.go.ke/",
  },
  {
    id: "kisumu-impala",
    name: "Kisumu Impala Sanctuary & lake shore",
    category: "nature",
    area: "Kisumu",
    blurb: "Lake Victoria breeze, sanctuary walks, and western Kenya flavors.",
    about:
      "Kisumu is the gateway to Lake Victoria. The Impala Sanctuary and waterfront make an easy half-day before fish lunches and sunset over the lake.",
    tips: [
      "Try Lake Victoria tilapia at a lakeside eatery",
      "Evenings can be humid - light clothes help",
      "Ask about boat trips to nearby islands",
    ],
    durationHours: 3,
    estCostKes: 1500,
    familyFriendly: true,
    imageUrl: img.beachTropical,
    websiteUrl: "https://www.kws.go.ke/",
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
