import { COAST_IMAGES as img } from "@/lib/data/coast-images";
import { placePhoto } from "@/lib/data/place-photo-urls";

export type ExploreCategory =
  | "all"
  | "food"
  | "beaches"
  | "marine"
  | "wildlife"
  | "heritage"
  | "adventure"
  | "trails"
  | "giveback";

export type ExplorePlace = {
  id: string;
  name: string;
  category: Exclude<ExploreCategory, "all">;
  area: string;
  blurb: string;
  about: string;
  vibe: string;
  tags: string[];
  imageUrl: string;
  websiteUrl: string | null;
  mapsUrl: string;
  /** Search query used for Google Places Text Search */
  googleQuery: string;
  /** Optional known Place ID (ChIJ…) when available */
  googlePlaceId?: string;
  tripadvisorUrl: string;
  hoursHint: string;
  priceHint: string;
  bookingHint: string;
  phoneHint?: string;
};

export const EXPLORE_FILTERS: { id: ExploreCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "food", label: "Food & Nightlife" },
  { id: "beaches", label: "Beaches" },
  { id: "marine", label: "Marine & Ocean" },
  { id: "wildlife", label: "Wildlife & Parks" },
  { id: "heritage", label: "History & Culture" },
  { id: "adventure", label: "Adventure & Sports" },
  { id: "trails", label: "Trails & Hikes" },
  { id: "giveback", label: "Give Back" },
];

const EXPLORE_PLACES_BASE: ExplorePlace[] = [
  // Food & Nightlife — clubs, bars, restaurants
  {
    id: "florida-club",
    name: "Florida Club Mombasa",
    category: "food",
    area: "Mama Ngina Drive",
    blurb: "Legendary waterfront nightclub with ocean views and late sets.",
    about:
      "Florida Club is one of Mombasa's best-known nightlife rooms - sea breeze, DJ sets, and a mixed local-and-visitor crowd along Mama Ngina Drive. Arrive after dinner; dress smart-casual and expect security checks.",
    vibe: "Club · late night",
    tags: ["club", "nightlife", "dj", "dancing", "cocktails"],
    imageUrl: img.clubConcert,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Florida+Club+Mombasa",
    googleQuery: "Florida Club Mombasa Mama Ngina",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Florida%20Club%20Mombasa",
    hoursHint: "Typically evenings to late · check event nights",
    priceHint: "Cover + drinks (varies by night)",
    bookingHint: "Walk-in common; table bookings via venue WhatsApp on event nights.",
  },
  {
    id: "tembo-disco",
    name: "Tembo Disco",
    category: "food",
    area: "Nyali",
    blurb: "North-coast club energy - Afrobeat, gengetone, and weekend crowds.",
    about:
      "Tembo Disco pulls a lively Nyali crowd for dance nights. Expect local hits, bottle service options, and a later start. Pair with a nearby grill dinner before you go.",
    vibe: "Club · weekend peak",
    tags: ["club", "nightlife", "afrobeats", "Nyali"],
    imageUrl: img.clubDj,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Tembo+Disco+Nyali+Mombasa",
    googleQuery: "Tembo Disco Nyali Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Tembo%20Disco%20Nyali",
    hoursHint: "Fri–Sat busiest · from ~10pm",
    priceHint: "Entry + drinks",
    bookingHint: "Follow promoters on Instagram for guest-list nights.",
  },
  {
    id: "cubana-mombasa",
    name: "Cubana Mombasa",
    category: "food",
    area: "Nyali",
    blurb: "Lounge-bar vibes - cocktails, Afro-Caribbean energy, and dinner-to-night flow.",
    about:
      "Cubana blends restaurant and nightlife: start with plates, stay for music and cocktails. Popular with groups celebrating birthdays and coastal weekends.",
    vibe: "Lounge · bar · dining",
    tags: ["bar", "nightlife", "cocktails", "restaurant", "lounge"],
    imageUrl: img.barInterior,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Cubana+Nyali+Mombasa",
    googleQuery: "Cubana Restaurant Nyali Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Cubana%20Nyali%20Mombasa",
    hoursHint: "Lunch to late evening",
    priceHint: "KES $$–$$$",
    bookingHint: "Reserve tables for weekends via phone or walk-in early.",
  },
  {
    id: "mv-plus-bar",
    name: "MV+ Bar & Lounge",
    category: "food",
    area: "Nyali",
    blurb: "Modern bar lounge for sundowners, sharers, and weekend DJs.",
    about:
      "A north-coast lounge pick for after-beach drinks and soft nightlife - less intense than full clubs, good for mixed groups.",
    vibe: "Bar · lounge",
    tags: ["bar", "nightlife", "lounge", "cocktails"],
    imageUrl: img.barCocktails,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=MV%2B+Bar+Nyali+Mombasa",
    googleQuery: "MV+ Bar Lounge Nyali Mombasa",
    tripadvisorUrl: "https://www.tripadvisor.com/Search?q=MV%2B%20Bar%20Nyali",
    hoursHint: "Evenings · weekends later",
    priceHint: "Drinks & bites mid-range",
    bookingHint: "Walk-in friendly; book for larger groups.",
  },
  {
    id: "tamarind-dhow",
    name: "Tamarind Dhow Dinner Cruise",
    category: "food",
    area: "Tudor Creek",
    blurb: "Iconic seafood dinner cruise - sunset, live music, and creek views.",
    about:
      "The Tamarind Dhow is a classic Mombasa night out: board for a creek cruise with seafood dinner and entertainment. Book ahead - popular with couples and visitors.",
    vibe: "Dining · nightlife experience",
    tags: ["restaurant", "seafood", "romantic", "nightlife", "cruise"],
    imageUrl: img.seafoodDining,
    websiteUrl: "https://tamarind.co.ke/",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Tamarind+Dhow+Mombasa",
    googleQuery: "Tamarind Dhow Mombasa Kenya",
    googlePlaceId: "ChIJ3YP-0FATQBgRSxJ3g2lxBbQ",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d319098-Reviews-Tamarind_Dhow-Mombasa_Coast_Province.html",
    hoursHint: "Evening sailings · seasonal schedule",
    priceHint: "Premium dinner package",
    bookingHint: "Book online at tamarind.co.ke or via hotel concierge.",
  },
  {
    id: "blaze-grill-night",
    name: "Blaze Grill",
    category: "food",
    area: "Nyali",
    blurb: "Grill house for meat platters and lively dinner groups before club hours.",
    about:
      "Hearty grills and sharers - a solid pre-nightlife dinner stop in Nyali after the beach.",
    vibe: "Restaurant · casual night out",
    tags: ["restaurant", "grill", "nightlife-adjacent", "Nyali"],
    imageUrl: img.grill,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Blaze+Grill+Nyali",
    googleQuery: "Blaze Grill Nyali Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Blaze%20Grill%20Nyali",
    hoursHint: "Lunch & dinner",
    priceHint: "KES $$",
    bookingHint: "Walk-in or call ahead on busy weekends.",
  },
  {
    id: "sails-diani-night",
    name: "Sails Beach Bar & Restaurant",
    category: "food",
    area: "Diani",
    blurb: "Feet-in-sand dining and cocktails - South Coast sunset nights.",
    about:
      "Beachfront seafood and cocktails for Diani evenings. Book ahead on weekends; stay for the social sunset crowd.",
    vibe: "Beach bar · restaurant",
    tags: ["restaurant", "bar", "beach", "cocktails", "Diani"],
    imageUrl: img.restaurantBeach,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Sails+Restaurant+Diani",
    googleQuery: "Sails Restaurant Diani Beach",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Sails%20Restaurant%20Diani",
    hoursHint: "Day to late evening",
    priceHint: "KES $$$",
    bookingHint: "Reserve for sunset tables via phone / hotel desk.",
  },

  // Beaches
  {
    id: "nyali-beach",
    name: "Nyali Beach",
    category: "beaches",
    area: "Nyali",
    blurb: "Soft sand, resorts, and easy beach days north of the island.",
    about:
      "Nyali is the classic north-coast beach day: soft sand, resorts, and easy access from Mombasa Island. Swim, lounge, or book a glass-bottom reef trip.",
    vibe: "Beach day",
    tags: ["beach", "swim", "family", "resorts"],
    imageUrl: img.nyaliBeach,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Nyali+Beach+Mombasa",
    googleQuery: "Nyali Beach Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d311643-Reviews-Nyali_Beach-Mombasa_Coast_Province.html",
    hoursHint: "Daylight · check tides for swimming",
    priceHint: "Public access; loungers via hotels/clubs",
    bookingHint: "Day passes via beach hotels or clubs when available.",
  },
  {
    id: "diani-beach",
    name: "Diani Beach",
    category: "beaches",
    area: "South Coast",
    blurb: "Powder sand and turquoise water - ferry + drive from the island.",
    about:
      "Diani is the postcard South Coast beach. Reach via Likoni ferry plus a short drive, or as a day trip with a driver.",
    vibe: "Beach · resort strip",
    tags: ["beach", "swim", "kite", "resorts"],
    imageUrl: img.beachDiani,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Diani+Beach+Kenya",
    googleQuery: "Diani Beach Kenya",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294208-d324409-Reviews-Diani_Beach-Diani_Beach_Kwale_County_Coast_Province.html",
    hoursHint: "All day",
    priceHint: "Public stretches free",
    bookingHint: "Book beach clubs / hotels ahead in peak season.",
  },
  {
    id: "bamburi-beach",
    name: "Bamburi Beach",
    category: "beaches",
    area: "Bamburi",
    blurb: "North-coast stretch near Haller Park - resorts and reef trips.",
    about:
      "Bamburi offers a long sandy stretch with hotels and easy pairings with Haller Park for a family day.",
    vibe: "Beach · family",
    tags: ["beach", "family", "reef"],
    imageUrl: img.beachTropical,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Bamburi+Beach+Mombasa",
    googleQuery: "Bamburi Beach Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Bamburi%20Beach%20Mombasa",
    hoursHint: "Daylight",
    priceHint: "Public / hotel access",
    bookingHint: "Combine with Haller Park tickets on site.",
  },

  // Marine
  {
    id: "wasini-kisite",
    name: "Wasini Island & Kisite boat day",
    category: "marine",
    area: "South Coast / Shimoni",
    blurb: "Dolphins, snorkeling, and seafood lunch on Wasini.",
    about:
      "Boat from Shimoni toward Kisite-Mpunguti Marine Park for dolphins and reef snorkeling, then lunch on Wasini Island.",
    vibe: "Boat day · snorkel",
    tags: ["snorkel", "dolphins", "marine-park", "boat"],
    imageUrl: img.kisiteMpunguti,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Kisite+Mpunguti+Marine+Park",
    googleQuery: "Kisite Mpunguti Marine National Park",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294208-d479960-Reviews-Kisite_Mpunguti_Marine_National_Park-Kwale_County_Coast_Province.html",
    hoursHint: "Full day · early start",
    priceHint: "KES 6,000–12,000+ packages",
    bookingHint: "Book a licensed operator from Diani or Shimoni; confirm park fees.",
  },
  {
    id: "glass-bottom-nyali",
    name: "Glass-bottom boat (Nyali / Bamburi)",
    category: "marine",
    area: "Nyali / Bamburi",
    blurb: "Shallow reef viewing without diving - good with kids.",
    about:
      "Short glass-bottom trips let you see reef life without snorkeling gear. Popular from Nyali and Bamburi hotels.",
    vibe: "Family marine",
    tags: ["reef", "family", "boat"],
    imageUrl: img.reefAerial,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=glass+bottom+boat+Nyali+Mombasa",
    googleQuery: "glass bottom boat Nyali Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=glass%20bottom%20boat%20Nyali",
    hoursHint: "Morning seas often calmer",
    priceHint: "~KES 2,000–4,000",
    bookingHint: "Book via beach hotels or promenade operators.",
  },
  {
    id: "watamu-marine",
    name: "Watamu Marine National Park",
    category: "marine",
    area: "Watamu",
    blurb: "Protected reef and turtle waters north of Mombasa.",
    about:
      "Watamu Marine National Park is a KWS-managed marine park known for clear water, coral, and turtle nesting beaches nearby.",
    vibe: "Marine park",
    tags: ["snorkel", "kws", "turtles", "reef"],
    imageUrl: img.watamuMarine,
    websiteUrl: "https://www.kws.go.ke/",
    mapsUrl: "https://maps.google.com/?q=Watamu+Marine+National+Park",
    googleQuery: "Watamu Marine National Park",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294209-d479958-Reviews-Watamu_Marine_National_Park-Watamu_Coast_Province.html",
    hoursHint: "Day trips · boat slots",
    priceHint: "Park fees + boat",
    bookingHint: "Pay KWS fees; book boats via Watamu hotels.",
  },

  // Wildlife
  {
    id: "shimba-hills",
    name: "Shimba Hills National Reserve",
    category: "wildlife",
    area: "Kwale / South Coast",
    blurb: "Closest big-game reserve feel from the South Coast.",
    about:
      "Shimba Hills offers coastal forest, elephants, and viewpoints - a half- or full-day safari option from Diani.",
    vibe: "Safari day",
    tags: ["safari", "kws", "elephants", "forest"],
    imageUrl: img.shimbaHills,
    websiteUrl: "https://www.kws.go.ke/",
    mapsUrl: "https://maps.google.com/?q=Shimba+Hills+National+Reserve",
    googleQuery: "Shimba Hills National Reserve",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294208-d479961-Reviews-Shimba_Hills_National_Reserve-Kwale_County_Coast_Province.html",
    hoursHint: "Morning game drives preferred",
    priceHint: "KWS entry + vehicle/guide",
    bookingHint: "Book via Diani safari desks or KWS gates.",
  },
  {
    id: "haller-park",
    name: "Haller Park",
    category: "wildlife",
    area: "Bamburi",
    blurb: "Rehabilitated quarry sanctuary with giraffes and hippos.",
    about:
      "Haller Park transformed a coral quarry into a green sanctuary - giraffes, hippos, and easy trails for families.",
    vibe: "Wildlife walk",
    tags: ["family", "giraffes", "nature"],
    imageUrl: img.hallerParkGiraffe,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Haller+Park+Mombasa",
    googleQuery: "Haller Park Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d324408-Reviews-Haller_Park-Mombasa_Coast_Province.html",
    hoursHint: "Morning cooler for walking",
    priceHint: "~KES 1,000–2,000",
    bookingHint: "Buy tickets on arrival.",
  },
  {
    id: "tsavo-west-day",
    name: "Tsavo West (from Mombasa)",
    category: "wildlife",
    area: "Tsavo",
    blurb: "Iconic red-earth safari country - overnight or long day trip.",
    about:
      "Tsavo West is reachable as a long day or overnight from the coast. Famous for landscapes, elephants, and Mzima Springs.",
    vibe: "Safari",
    tags: ["safari", "kws", "elephants", "overnight"],
    imageUrl: img.tsavoWestMzima,
    websiteUrl: "https://www.kws.go.ke/",
    mapsUrl: "https://maps.google.com/?q=Tsavo+West+National+Park",
    googleQuery: "Tsavo West National Park",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d479963-Reviews-Tsavo_West_National_Park-Coast_Province.html",
    hoursHint: "Overnight recommended",
    priceHint: "Park fees + lodge/tour",
    bookingHint: "Book licensed safari operators from Mombasa or Diani.",
  },

  // Heritage
  {
    id: "fort-jesus",
    name: "Fort Jesus",
    category: "heritage",
    area: "Old Town",
    blurb: "UNESCO Portuguese fort overlooking the Indian Ocean.",
    about:
      "Built in the late 1500s, Fort Jesus is Mombasa's signature landmark - ramparts, museum rooms, and harbor views.",
    vibe: "Heritage · museum",
    tags: ["unesco", "museum", "history"],
    imageUrl: img.fortJesus,
    websiteUrl: "https://museums.or.ke/",
    mapsUrl: "https://maps.google.com/?q=Fort+Jesus+Mombasa",
    googleQuery: "Fort Jesus Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d311642-Reviews-Fort_Jesus-Mombasa_Coast_Province.html",
    hoursHint: "Daytime museum hours",
    priceHint: "Museum entry fee",
    bookingHint: "Tickets at the gate; guides available on site.",
  },
  {
    id: "old-town-mombasa",
    name: "Mombasa Old Town",
    category: "heritage",
    area: "Old Town",
    blurb: "Narrow lanes, carved doors, spice scents, and Swahili architecture.",
    about:
      "A living Swahili quarter - walk slowly, respect homes, and combine with Fort Jesus for a full heritage morning.",
    vibe: "Walking · culture",
    tags: ["culture", "architecture", "walking"],
    imageUrl: img.oldTownStreet,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Mombasa+Old+Town",
    googleQuery: "Mombasa Old Town",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294207-d311644-Reviews-Old_Town-Mombasa_Coast_Province.html",
    hoursHint: "Morning or late afternoon",
    priceHint: "Free to wander · guide optional",
    bookingHint: "Hire a local guide near Fort Jesus.",
  },
  {
    id: "ngomongo",
    name: "Ngomongo Villages",
    category: "heritage",
    area: "Mtwapa",
    blurb: "Cultural villages experience - crafts, communities, and performances.",
    about:
      "Curated look at Kenyan community traditions north of Mombasa - accessible culture stop for first-time visitors.",
    vibe: "Cultural park",
    tags: ["culture", "family", "crafts"],
    imageUrl: img.cultureCraft,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Ngomongo+Villages+Mtwapa",
    googleQuery: "Ngomongo Villages Mtwapa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Ngomongo%20Villages",
    hoursHint: "Check opening hours before travel",
    priceHint: "Entry fee",
    bookingHint: "Tickets on arrival; group bookings via phone.",
  },

  // Adventure
  {
    id: "kite-diani",
    name: "Kitesurfing Diani",
    category: "adventure",
    area: "Diani",
    blurb: "World-class kite conditions on the South Coast trade winds.",
    about:
      "Diani's flat water and consistent winds make it a kite hub. Schools offer lessons and rentals for all levels.",
    vibe: "Water sports",
    tags: ["kite", "sports", "beach", "lessons"],
    imageUrl: img.kiteSurf,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=kitesurfing+Diani+Beach",
    googleQuery: "kitesurfing school Diani Beach",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=kitesurfing%20Diani",
    hoursHint: "Wind windows seasonal · mornings often best",
    priceHint: "Lesson packages vary",
    bookingHint: "Book a certified kite school in advance.",
  },
  {
    id: "scuba-diani",
    name: "Scuba & dive centers (Diani / Watamu)",
    category: "adventure",
    area: "South & North Coast",
    blurb: "PADI dives on coastal reefs and marine parks.",
    about:
      "Licensed dive centers run discover-scuba and certified dives from Diani and Watamu. Bring certification cards if you have them.",
    vibe: "Diving",
    tags: ["scuba", "dive", "reef", "sports"],
    imageUrl: img.scuba,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=scuba+diving+Diani+Kenya",
    googleQuery: "scuba diving Diani Kenya",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=scuba%20diving%20Diani",
    hoursHint: "Morning boat dives",
    priceHint: "Discover dive to full courses",
    bookingHint: "Book PADI centers; confirm marine park fees.",
  },
  {
    id: "camel-rides",
    name: "Beach camel rides (Nyali / Bamburi)",
    category: "adventure",
    area: "North Coast",
    blurb: "Sunset camel walks along the north-coast sand.",
    about:
      "Short camel rides are a popular photo activity on Nyali and Bamburi beaches - negotiate clearly and prefer established handlers near hotels.",
    vibe: "Fun · photo",
    tags: ["camel", "beach", "family"],
    imageUrl: img.nyaliCamels,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=camel+ride+Nyali+Beach",
    googleQuery: "camel ride Nyali Beach Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=camel%20ride%20Nyali",
    hoursHint: "Late afternoon / sunset",
    priceHint: "Per short ride · agree price first",
    bookingHint: "Arrange via hotel activity desk when possible.",
  },

  // Trails
  {
    id: "arabuko-trails",
    name: "Arabuko-Sokoke Forest trails",
    category: "trails",
    area: "Kilifi / Watamu",
    blurb: "Coastal forest walks - birds, butterflies, and cool shade.",
    about:
      "One of East Africa's important coastal forests. Guided walks help with birding and navigation.",
    vibe: "Nature hike",
    tags: ["hike", "birds", "forest"],
    imageUrl: img.arabukoSokoke,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Arabuko+Sokoke+Forest",
    googleQuery: "Arabuko Sokoke Forest",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Attraction_Review-g294209-d479956-Reviews-Arabuko_Sokoke_Forest-Watamu_Coast_Province.html",
    hoursHint: "Morning walks",
    priceHint: "Entry + guide",
    bookingHint: "Guides at the forest station / Watamu hotels.",
  },
  {
    id: "mama-ngina-walk",
    name: "Mama Ngina Waterfront promenade",
    category: "trails",
    area: "CBD / Waterfront",
    blurb: "Sea-breeze promenade walk with public art and sunset views.",
    about:
      "An easy urban coastal walk - ocean air, art, evening food stalls, and skyline views.",
    vibe: "Urban stroll",
    tags: ["walk", "sunset", "family", "waterfront"],
    imageUrl: img.mamaNginaWaterfront,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Mama+Ngina+Waterfront+Mombasa",
    googleQuery: "Mama Ngina Waterfront Mombasa",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Mama%20Ngina%20Waterfront",
    hoursHint: "Late afternoon best light",
    priceHint: "Free",
    bookingHint: "No ticket needed.",
  },

  // Give back
  {
    id: "ocean-cleanup",
    name: "Beach clean-up meetups",
    category: "giveback",
    area: "Nyali / Bamburi / Diani",
    blurb: "Join community clean-ups along the strand.",
    about:
      "Local groups and hotels periodically host beach clean-ups. Bring gloves, water, and sun protection - a meaningful half-morning on the coast.",
    vibe: "Volunteer",
    tags: ["volunteer", "beach", "community"],
    imageUrl: img.beachCleanup,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Nyali+Beach+Mombasa",
    googleQuery: "beach cleanup Mombasa Nyali",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=beach%20cleanup%20Mombasa",
    hoursHint: "Often weekend mornings",
    priceHint: "Free to join",
    bookingHint: "Watch hotel noticeboards, Swahilipot, and local eco-groups.",
  },
  {
    id: "turtle-conservation",
    name: "Watamu turtle conservation visits",
    category: "giveback",
    area: "Watamu",
    blurb: "Learn about turtle rescue and coastal conservation.",
    about:
      "Visitor programs around Watamu support turtle rehabilitation and awareness. Confirm current open days before traveling.",
    vibe: "Conservation visit",
    tags: ["turtles", "conservation", "education"],
    imageUrl: img.turtle,
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Watamu+turtle+conservation",
    googleQuery: "Local Ocean Conservation Watamu turtles",
    tripadvisorUrl:
      "https://www.tripadvisor.com/Search?q=Watamu%20turtle%20conservation",
    hoursHint: "Visitor hours vary",
    priceHint: "Donation / entry",
    bookingHint: "Check the centre's site or Watamu hotels for slots.",
  },
];

export const EXPLORE_PLACES: ExplorePlace[] = EXPLORE_PLACES_BASE.map((p) => ({
  ...p,
  imageUrl: placePhoto(p.id, p.imageUrl),
}));

export function getExplorePlace(id: string) {
  return EXPLORE_PLACES.find((p) => p.id === id) ?? null;
}

export function placesForCategory(category: ExploreCategory) {
  if (category === "all") return EXPLORE_PLACES;
  return EXPLORE_PLACES.filter((p) => p.category === category);
}
