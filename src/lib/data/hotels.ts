import { placePhoto } from "@/lib/data/place-photo-urls";

export type Hotel = {
  id: string;
  name: string;
  area: string;
  rating: number;
  pricePerNight: number;
  currency: "KES" | "USD";
  tags: string[];
  vibe: string;
  description: string;
  amenities: string[];
  imageGradient: string;
  imageUrl: string;
  websiteUrl: string | null;
  bookingUrl: string;
};

export const COAST_AREAS = [
  {
    value: "whole-coast",
    label: "Anywhere in Kenya",
    hint: "Nairobi, safari circuits, Rift Valley, and the coast",
  },
  {
    value: "Nairobi",
    label: "Nairobi",
    hint: "Capital · museums, nightlife, park day trips",
  },
  {
    value: "Maasai Mara",
    label: "Maasai Mara",
    hint: "Safari lodges and camps",
  },
  {
    value: "Amboseli",
    label: "Amboseli",
    hint: "Elephants and Kilimanjaro views",
  },
  {
    value: "Nakuru / Naivasha",
    label: "Nakuru / Naivasha",
    hint: "Rift lakes, Hell's Gate, flamingos",
  },
  {
    value: "Nanyuki / Mount Kenya",
    label: "Nanyuki / Mount Kenya",
    hint: "Highlands, climbs, and ranch stays",
  },
  {
    value: "Kisumu",
    label: "Kisumu / Lake Victoria",
    hint: "Western Kenya lake city",
  },
  {
    value: "Mombasa Old Town",
    label: "Mombasa",
    hint: "Island city · Old Town and north coast",
  },
  { value: "Nyali", label: "Nyali", hint: "North-coast beach resorts" },
  {
    value: "Diani Beach",
    label: "Diani Beach",
    hint: "South-coast white sand",
  },
  {
    value: "Watamu / Malindi",
    label: "Watamu / Malindi",
    hint: "Marine parks and north coast",
  },
  {
    value: "Lamu",
    label: "Lamu",
    hint: "UNESCO island town",
  },
  {
    value: "Hola",
    label: "Hola / Tana River",
    hint: "Delta and river-county base",
  },
  {
    value: "Kilifi",
    label: "Kilifi",
    hint: "Creek-side north coast",
  },
] as const;

export function hotelPrimaryLink(hotel: Hotel): {
  href: string;
  label: string;
} {
  if (hotel.websiteUrl) {
    return { href: hotel.websiteUrl, label: "Visit hotel website" };
  }
  return { href: hotel.bookingUrl, label: "Book on Booking.com" };
}

export function resolveHotel(hotel: Pick<Hotel, "id">): Hotel | null {
  return HOTELS.find((h) => h.id === hotel.id) ?? null;
}

export function hydrateHotels(hotels: Hotel[]): Hotel[] {
  // Prefer live catalogue data when id matches; keep AI-discovered stays as-is.
  return hotels
    .map((hotel) => resolveHotel(hotel) ?? hotel)
    .filter((hotel): hotel is Hotel => Boolean(hotel?.id && hotel?.name));
}

/** Aliases for Stay & Eat area filter - never silently fall back to other regions. */
const STAY_AREA_ALIASES: Record<string, string[]> = {
  Nairobi: [
    "nairobi",
    "westlands",
    "karen",
    "kilimani",
    "langata",
    "gigiri",
    "upper hill",
    "jkia",
  ],
  "Maasai Mara": ["maasai mara", "masai mara", "mara", "narok", "talek"],
  Amboseli: ["amboseli", "loitokitok", "kimana"],
  "Nakuru / Naivasha": [
    "nakuru",
    "naivasha",
    "elementaita",
    "hell's gate",
    "hells gate",
  ],
  "Nanyuki / Mount Kenya": [
    "nanyuki",
    "mount kenya",
    "mt kenya",
    "laikipia",
    "naro moru",
  ],
  Kisumu: ["kisumu", "lake victoria", "kisumu / lake victoria"],
  "Mombasa Old Town": [
    "mombasa",
    "old town",
    "mombasa old town",
    "mombasa cbd",
    "mama ngina",
  ],
  Nyali: ["nyali"],
  "Diani Beach": ["diani", "diani beach", "ukunda"],
  "Watamu / Malindi": ["watamu", "malindi", "north coast"],
  Lamu: ["lamu", "shela"],
  Hola: ["hola", "tana", "tana river", "tana delta"],
};

function placeMatchesArea(
  areaLabel: string,
  tags: string[],
  selectedArea: string,
): boolean {
  const aliases =
    STAY_AREA_ALIASES[selectedArea]?.map((a) => a.toLowerCase()) ?? [
      selectedArea.toLowerCase(),
    ];
  const hay = `${areaLabel} ${tags.join(" ")}`.toLowerCase();
  return aliases.some(
    (alias) => hay.includes(alias) || alias.includes(areaLabel.toLowerCase()),
  );
}

export function hotelsForArea(area: string): Hotel[] {
  if (!area || area === "whole-coast") return HOTELS;
  // Strict: empty means “nothing in this area”, not “show the whole country”.
  return HOTELS.filter((h) => placeMatchesArea(h.area, h.tags, area));
}

export { placeMatchesArea, STAY_AREA_ALIASES };

const HOTELS_BASE: Hotel[] = [
  {
    id: "nairobi-serena",
    name: "Nairobi Serena Hotel",
    area: "Nairobi",
    rating: 4.6,
    pricePerNight: 22000,
    currency: "KES",
    tags: ["city", "pool", "spa", "business", "Nairobi"],
    vibe: "Central city calm",
    description:
      "Garden-courtyard hotel in central Nairobi with a pool, spa, and easy access to museums and CBD meetings.",
    amenities: ["Wi-Fi", "Pool", "Spa", "Restaurant", "Gym"],
    imageGradient: "from-emerald-800 via-teal-600 to-cyan-400",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.serenahotels.com/nairobi",
    bookingUrl: "https://www.booking.com/hotel/ke/nairobi-serena.html",
  },
  {
    id: "tribe-hotel",
    name: "Tribe Hotel",
    area: "Gigiri, Nairobi",
    rating: 4.7,
    pricePerNight: 28000,
    currency: "KES",
    tags: ["design", "pool", "spa", "Westlands", "Nairobi"],
    vibe: "Design-forward city stay",
    description:
      "Stylish Gigiri hotel near UN offices and Westlands dining - strong pool deck and suites for couples.",
    amenities: ["Wi-Fi", "Pool", "Spa", "Restaurant", "Bar"],
    imageGradient: "from-slate-800 via-amber-600 to-rose-400",
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.tribehotel.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/tribe.html",
  },
  {
    id: "hemingways-nairobi",
    name: "Hemingways Nairobi",
    area: "Karen, Nairobi",
    rating: 4.8,
    pricePerNight: 45000,
    currency: "KES",
    tags: ["luxury", "spa", "romantic", "Karen", "Nairobi"],
    vibe: "Quiet Karen luxury",
    description:
      "Boutique luxury in Karen with spa treatments, gardens, and easy giraffe-centre day trips.",
    amenities: ["Wi-Fi", "Spa", "Pool", "Restaurant", "Butler"],
    imageGradient: "from-amber-800 via-orange-500 to-rose-400",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.hemingways-collection.com/nairobi/",
    bookingUrl: "https://www.booking.com/hotel/ke/hemingways-nairobi.html",
  },
  {
    id: "sankara-nairobi",
    name: "Sankara Nairobi",
    area: "Westlands, Nairobi",
    rating: 4.6,
    pricePerNight: 26000,
    currency: "KES",
    tags: ["rooftop", "business", "pool", "Westlands", "Nairobi"],
    vibe: "Westlands urban polish",
    description:
      "Westlands hotel with rooftop dining, a compact pool, and walkable access to shopping and nightlife.",
    amenities: ["Wi-Fi", "Pool", "Gym", "Restaurant", "Rooftop"],
    imageGradient: "from-blue-900 via-cyan-600 to-teal-400",
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.sankara.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/sankara-nairobi.html",
  },
  {
    id: "villa-rosa",
    name: "Villa Rosa Kempinski",
    area: "Westlands, Nairobi",
    rating: 4.7,
    pricePerNight: 32000,
    currency: "KES",
    tags: ["luxury", "spa", "pool", "family", "Nairobi"],
    vibe: "Full-service city resort feel",
    description:
      "Large Westlands hotel with spa, multiple restaurants, and a pool - practical for couples and families in Nairobi.",
    amenities: ["Wi-Fi", "Pool", "Spa", "Breakfast", "Kids club"],
    imageGradient: "from-rose-800 via-amber-500 to-yellow-400",
    imageUrl:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d0?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.kempinski.com/en/villa-rosa",
    bookingUrl: "https://www.booking.com/hotel/ke/villa-rosa-kempinski.html",
  },
  {
    id: "ole-sereni",
    name: "Ole Sereni Hotel",
    area: "Nairobi",
    rating: 4.4,
    pricePerNight: 18000,
    currency: "KES",
    tags: ["airport", "pool", "views", "Nairobi"],
    vibe: "Park-view layover base",
    description:
      "Hotel overlooking Nairobi National Park - handy for JKIA arrivals and short city stays with a pool.",
    amenities: ["Wi-Fi", "Pool", "Restaurant", "Airport shuttle", "Gym"],
    imageGradient: "from-lime-800 via-emerald-600 to-teal-400",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.ole-sereni.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/ole-sereni.html",
  },
  {
    id: "fairmont-norfolk",
    name: "Fairmont The Norfolk",
    area: "Nairobi",
    rating: 4.5,
    pricePerNight: 24000,
    currency: "KES",
    tags: ["heritage", "garden", "breakfast", "Nairobi"],
    vibe: "Historic garden hotel",
    description:
      "Classic Nairobi hotel with courtyard gardens - central for museums, CBD, and evening outings.",
    amenities: ["Wi-Fi", "Breakfast", "Restaurant", "Garden", "Gym"],
    imageGradient: "from-stone-700 via-amber-600 to-orange-400",
    imageUrl:
      "https://images.unsplash.com/photo-1618773928122-d162df870cd4?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.fairmont.com/norfolk-hotel-nairobi/",
    bookingUrl: "https://www.booking.com/hotel/ke/fairmont-the-norfolk.html",
  },
  {
    id: "eka-hotel",
    name: "Eka Hotel Nairobi",
    area: "Nairobi",
    rating: 4.3,
    pricePerNight: 14000,
    currency: "KES",
    tags: ["airport", "pool", "business", "Nairobi"],
    vibe: "Practical city / airport base",
    description:
      "Modern mid-range hotel near JKIA and the city - pool, gym, and solid value for short Nairobi stays.",
    amenities: ["Wi-Fi", "Pool", "Gym", "Restaurant", "Breakfast"],
    imageGradient: "from-cyan-800 via-teal-500 to-sky-400",
    imageUrl:
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.ekahotel.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/eka-nairobi.html",
  },
  {
    id: "concord-hotel",
    name: "The Concord Hotel & Suites",
    area: "Parklands, Nairobi",
    rating: 4.2,
    pricePerNight: 12000,
    currency: "KES",
    tags: ["suite", "pool", "family", "Nairobi"],
    vibe: "Apartment-style city stay",
    description:
      "Suite-style rooms in Parklands with a pool - good for couples or families who want space in Nairobi.",
    amenities: ["Wi-Fi", "Pool", "Kitchenette", "Breakfast", "Parking"],
    imageGradient: "from-indigo-800 via-blue-600 to-cyan-400",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: null,
    bookingUrl: "https://www.booking.com/hotel/ke/the-concord-and-suites.html",
  },
  {
    id: "nyali-breeze",
    name: "Serena Beach Resort & Spa",
    area: "Nyali",
    rating: 4.7,
    pricePerNight: 18500,
    currency: "KES",
    tags: ["beachfront", "family", "pool", "Nyali"],
    vibe: "Relaxed beach luxury",
    description:
      "Ocean-facing rooms steps from Nyali Beach with a calm pool deck and sunset dining.",
    amenities: ["Wi-Fi", "Pool", "Restaurant", "Airport shuttle"],
    imageGradient: "from-teal-600 via-cyan-500 to-sky-400",
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.serenahotels.com/serenabeach",
    bookingUrl:
      "https://www.booking.com/hotel/ke/serena-beach-resort-and-spa.html",
  },
  {
    id: "sarova-whitesands",
    name: "Sarova Whitesands Beach Resort",
    area: "Bamburi",
    rating: 4.5,
    pricePerNight: 16000,
    currency: "KES",
    tags: ["beachfront", "family", "conference", "Bamburi"],
    vibe: "Classic north-coast resort",
    description:
      "Large beachfront resort with multiple pools, kids clubs, and easy Haller Park access.",
    amenities: ["Wi-Fi", "Pool", "Kids club", "Spa"],
    imageGradient: "from-sky-700 via-cyan-500 to-teal-400",
    imageUrl:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d0?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.sarovahotels.com/whitesands-mombasa/",
    bookingUrl: "https://www.booking.com/hotel/ke/sarova-whitesands.html",
  },
  {
    id: "old-town-haven",
    name: "Tamarind Village",
    area: "Mombasa Old Town",
    rating: 4.5,
    pricePerNight: 9800,
    currency: "KES",
    tags: ["heritage", "culture", "boutique", "Old Town"],
    vibe: "Swahili heritage charm",
    description:
      "Courtyard-style coastal stay near Old Town highlights - Fort Jesus and spice markets are an easy outing.",
    amenities: ["Wi-Fi", "Breakfast", "Rooftop terrace", "Guided walks"],
    imageGradient: "from-amber-700 via-orange-500 to-rose-400",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://tamarind.co.ke/tamarind-village/",
    bookingUrl: "https://www.booking.com/hotel/ke/tamarind-village.html",
  },
  {
    id: "diani-horizon",
    name: "Baobab Beach Resort & Spa",
    area: "Diani Beach",
    rating: 4.8,
    pricePerNight: 24000,
    currency: "KES",
    tags: ["beachfront", "romantic", "spa", "Diani"],
    vibe: "Quiet coastal escape",
    description:
      "White-sand Diani stays with spa treatments and water-sport packages.",
    amenities: ["Spa", "Kayaks", "Wi-Fi", "Bar"],
    imageGradient: "from-sky-700 via-teal-500 to-emerald-400",
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.baobab-beach-resort.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/baobab-beach-resort.html",
  },
  {
    id: "leopard-beach",
    name: "Leopard Beach Resort & Spa",
    area: "Diani Beach",
    rating: 4.6,
    pricePerNight: 22000,
    currency: "KES",
    tags: ["beachfront", "spa", "romantic", "Diani"],
    vibe: "South coast luxury",
    description:
      "Palm-lined Diani resort with spa, water sports, and strong sunset dining.",
    amenities: ["Spa", "Wi-Fi", "Pool", "Water sports"],
    imageGradient: "from-teal-800 via-cyan-600 to-sky-400",
    imageUrl:
      "https://images.unsplash.com/photo-1610641818989-c2051b5e2fcb?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.leopard-beach-resort.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/leopard-beach-resort.html",
  },
  {
    id: "bamburi-bay",
    name: "Voyager Beach Resort",
    area: "Bamburi",
    rating: 4.2,
    pricePerNight: 7200,
    currency: "KES",
    tags: ["budget", "family", "wildlife", "Bamburi"],
    vibe: "Value near Haller Park",
    description:
      "Practical beach base near Haller Park and Bamburi Beach - great for families and short stays.",
    amenities: ["Wi-Fi", "Parking", "Restaurant", "Kids club"],
    imageGradient: "from-emerald-700 via-teal-600 to-cyan-400",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: null,
    bookingUrl: "https://www.booking.com/hotel/ke/voyager-beach-resort.html",
  },
  {
    id: "mama-ngina-view",
    name: "PrideInn Paradise Beach Resort",
    area: "Shanzu",
    rating: 4.6,
    pricePerNight: 14500,
    currency: "KES",
    tags: ["city", "waterfront", "business", "Shanzu"],
    vibe: "Harbor city pulse",
    description:
      "Modern coastal resort close to Mombasa island trips, Mama Ngina Waterfront, and city events.",
    amenities: ["Wi-Fi", "Gym", "Coworking nook", "Cafe"],
    imageGradient: "from-blue-800 via-cyan-600 to-teal-400",
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.prideinnparadise.com/",
    bookingUrl:
      "https://www.booking.com/hotel/ke/prideinn-paradise-beach-resort-spa-and-conference-centre.html",
  },
  {
    id: "english-point",
    name: "English Point Marina Hotel",
    area: "Nyali",
    rating: 4.4,
    pricePerNight: 13500,
    currency: "KES",
    tags: ["marina", "business", "city", "Nyali"],
    vibe: "Modern marina stay",
    description:
      "Contemporary rooms by the marina - handy for city, Old Town, and north-coast beach hops.",
    amenities: ["Wi-Fi", "Restaurant", "Gym", "Marina views"],
    imageGradient: "from-slate-700 via-cyan-600 to-teal-400",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://englishpointmarina.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/english-point-marina.html",
  },
  {
    id: "kilifi-creek",
    name: "Mnarani Club",
    area: "Kilifi",
    rating: 4.4,
    pricePerNight: 16000,
    currency: "KES",
    tags: ["nature", "quiet", "romantic", "Kilifi"],
    vibe: "Creek-side calm",
    description:
      "A peaceful creek-side retreat for travelers pairing Mombasa city days with coastal nature.",
    amenities: ["Wi-Fi", "Kayaks", "Breakfast", "Garden"],
    imageGradient: "from-cyan-800 via-teal-500 to-lime-400",
    imageUrl:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.mnarani.co.ke/",
    bookingUrl: "https://www.booking.com/hotel/ke/mnarani-club.html",
  },
  {
    id: "driiftwood",
    name: "Driftwood Beach Club",
    area: "Malindi / north coast trip",
    rating: 4.3,
    pricePerNight: 12000,
    currency: "KES",
    tags: ["beachfront", "quiet", "romantic"],
    vibe: "Laid-back coastal club",
    description:
      "Informal beach club vibe for travelers stretching a Mombasa trip toward Malindi.",
    amenities: ["Wi-Fi", "Restaurant", "Beach access", "Pool"],
    imageGradient: "from-orange-700 via-amber-500 to-yellow-400",
    imageUrl:
      "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: null,
    bookingUrl: "https://www.booking.com/hotel/ke/driftwood-beach-club.html",
  },
  {
    id: "fountain-beach",
    name: "Neptune Beach Resort",
    area: "Bamburi",
    rating: 4.1,
    pricePerNight: 8500,
    currency: "KES",
    tags: ["family", "beachfront", "all-inclusive", "Bamburi"],
    vibe: "All-inclusive family value",
    description:
      "Popular family-friendly beach resort with entertainment and easy beach access.",
    amenities: ["Wi-Fi", "Pool", "Kids club", "Entertainment"],
    imageGradient: "from-blue-700 via-teal-500 to-cyan-400",
    imageUrl:
      "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: "https://www.neptunehotels.com/",
    bookingUrl: "https://www.booking.com/hotel/ke/neptune-beach.html",
  },
  {
    id: "city-royal",
    name: "Royal Court Hotel",
    area: "Mama Ngina Waterfront",
    rating: 4.0,
    pricePerNight: 6500,
    currency: "KES",
    tags: ["city", "business", "budget"],
    vibe: "Island city base",
    description:
      "Practical Mombasa island hotel for Old Town walks, ferry trips, and waterfront evenings.",
    amenities: ["Wi-Fi", "Restaurant", "Parking", "AC"],
    imageGradient: "from-slate-800 via-blue-600 to-cyan-400",
    imageUrl:
      "https://images.unsplash.com/photo-1618773928122-d162df870cd4?auto=format&fit=crop&w=1200&q=80",
    websiteUrl: null,
    bookingUrl: "https://www.booking.com/hotel/ke/royal-court.html",
  },
];

export const HOTELS: Hotel[] = HOTELS_BASE.map((h) => ({
  ...h,
  imageUrl: placePhoto(h.id, h.imageUrl),
}));
