export type EventSource = "coast-calendar" | "ticketmaster";

export type CoastEvent = {
  id: string;
  title: string;
  venue: string;
  area: string;
  startsAt: string; // ISO
  endsAt?: string;
  imageUrl: string;
  category: string;
  summary: string;
  about: string;
  priceFromKes: number | null;
  isFree: boolean;
  ticketPlatform: string;
  ticketUrl: string;
  bookingSteps: string[];
  organizer: string;
  contactHint?: string;
  mapsUrl: string;
  source: EventSource;
};

/** Curated coast calendar — always available; enriched with real ticket platforms. */
export const COAST_EVENTS: CoastEvent[] = [
  {
    id: "ibs-2026",
    title: "Innovation and Business Summit 2026 (IBS 2026)",
    venue: "Tana River Training, Innovation & Youth Empowerment Centre",
    area: "Hola, Tana River",
    startsAt: "2026-10-07T09:00:00+03:00",
    endsAt: "2026-10-10T17:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    category: "Summit · Innovation",
    summary:
      "Happening in Hola this week - farming, coast livelihoods, tech, and health investment talks.",
    about:
      "Four days in Hola with county leaders, innovators, and investors. Hosted with H.E. Maj. (Rtd.) Dr. Dhadho Godhana (Governor of Tana River County; Chairperson, Jumuiya ya Kaunti za Pwani). Theme: Commercialization of Innovations for Sustainable Growth.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "Summit registration",
    ticketUrl: "https://maps.google.com/?q=Hola+Tana+River+County",
    bookingSteps: [
      "Confirm registration details with summit organizers / county channels.",
      "Plan travel to Hola (road via Garsen or Malindi corridor).",
      "Book lodging early - inventory is limited around summit week.",
      "Arrive with business cards and a one-pager if you are pitching.",
    ],
    organizer: "Tana River County · Jumuiya ya Kaunti za Pwani partners",
    contactHint: "Follow county and Jumuiya channels for gate passes",
    mapsUrl:
      "https://maps.google.com/?q=Tana+River+Training+Innovation+Youth+Empowerment+Centre+Hola",
    source: "coast-calendar",
  },
  {
    id: "ibs-youth-expo",
    title: "IBS Youth & Innovators Expo",
    venue: "Tana River Training, Innovation & Youth Empowerment Centre",
    area: "Hola, Tana River",
    startsAt: "2026-10-08T10:00:00+03:00",
    endsAt: "2026-10-09T16:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    category: "Expo · Tech",
    summary:
      "Student and startup demos running alongside IBS 2026 - pitch corners and product tables.",
    about:
      "A side expo for young founders and student teams showing work in agriculture, health, and digital services. Walk the floor, ask hard questions, and swap contacts. No ticket fee if you already have summit access.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "Summit badge / walk-in",
    ticketUrl: "https://maps.google.com/?q=Hola+Tana+River+County",
    bookingSteps: [
      "Bring your IBS 2026 badge if you have one.",
      "Walk-ins: check with registration for day passes.",
      "Come ready with a short intro if you are exhibiting.",
      "Leave time for the main plenary sessions.",
    ],
    organizer: "Tana River County youth desk · summit partners",
    mapsUrl:
      "https://maps.google.com/?q=Tana+River+Training+Innovation+Youth+Empowerment+Centre+Hola",
    source: "coast-calendar",
  },
  {
    id: "tana-delta-boat-day",
    title: "Tana Delta Boat & Bird Morning",
    venue: "Kipini landing",
    area: "Tana Delta",
    startsAt: "2026-10-09T07:30:00+03:00",
    endsAt: "2026-10-09T12:30:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    category: "Nature · Delta",
    summary:
      "Guided boat morning on the delta - birds, mangroves, and fishing livelihoods.",
    about:
      "Local boat crews run a half-day loop for visitors. Bring sun protection, cash for the crew, and ask before photographing people on the water.",
    priceFromKes: 2500,
    isFree: false,
    ticketPlatform: "Local operator (cash / M-Pesa)",
    ticketUrl: "https://maps.google.com/?q=Kipini+Tana+River",
    bookingSteps: [
      "Ask your hotel or the county tourism desk for a vetted boat contact.",
      "Confirm departure time the night before - tides matter.",
      "Pay on arrival; keep small notes.",
      "Wear shoes you can get wet.",
    ],
    organizer: "Kipini boat cooperatives",
    contactHint: "Book through your host or county tourism desk",
    mapsUrl: "https://maps.google.com/?q=Kipini+Kenya",
    source: "coast-calendar",
  },
  {
    id: "hola-agri-roundtable",
    title: "Agriculture Value-Chain Roundtable",
    venue: "County boardroom annex, Hola",
    area: "Hola, Tana River",
    startsAt: "2026-10-08T14:00:00+03:00",
    endsAt: "2026-10-08T17:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    category: "Agriculture · Investment",
    summary:
      "Closed-door chat on crops, cold chain, and buyer links - RSVP with the agriculture desk.",
    about:
      "County agronomists and buyers talk through practical bottlenecks: transport, storage, and market access. Bring notes. Seats are limited.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "RSVP via county agriculture desk",
    ticketUrl: "https://maps.google.com/?q=Hola+Tana+River+County",
    bookingSteps: [
      "Confirm the date with the agriculture desk.",
      "RSVP early if the session requires a name list.",
      "Arrive 10 minutes early - rooms fill fast.",
      "Bring business cards if you are buying or selling.",
    ],
    organizer: "Tana River County Agriculture · partners",
    mapsUrl: "https://maps.google.com/?q=Hola+Tana+River",
    source: "coast-calendar",
  },
  {
    id: "garsen-market-evening",
    title: "Garsen Trade & Food Evening",
    venue: "Garsen town market stretch",
    area: "Garsen",
    startsAt: "2026-10-09T17:00:00+03:00",
    endsAt: "2026-10-09T20:30:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    category: "Food · Community",
    summary:
      "Informal evening stop between Hola and the coast - street food, produce, and travel chat.",
    about:
      "If you are driving the Malindi–Lamu corridor, Garsen is a natural pause. Sample local food, buy fruit for the road, and ask vendors about current road conditions toward Hola or Kipini.",
    priceFromKes: 300,
    isFree: false,
    ticketPlatform: "Walk-up",
    ticketUrl: "https://maps.google.com/?q=Garsen+Kenya",
    bookingSteps: [
      "No ticket - just show up.",
      "Carry small notes and M-Pesa.",
      "Ask before photographing stall owners.",
      "Plan daylight for the drive back if possible.",
    ],
    organizer: "Local traders",
    mapsUrl: "https://maps.google.com/?q=Garsen+Tana+River",
    source: "coast-calendar",
  },
  {
    id: "ai-tourism-day",
    title: "AI & Digital Tourism Day",
    venue: "Swahilipot Hub Foundation",
    area: "Mombasa",
    startsAt: "2026-09-23T09:00:00+03:00",
    endsAt: "2026-09-23T17:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    summary:
      "Coast teams looking at AI for trips, stays, and visitor numbers.",
    about:
      "A day of talks and product showcases at Swahilipot on digital tools for coastal tourism.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "Event registration",
    ticketUrl: "https://www.swahilipothub.co.ke/",
    bookingSteps: [
      "Register on the organizer link.",
      "Save the confirmation email.",
      "Bring ID for entry.",
      "Arrive a bit early for a seat.",
    ],
    organizer: "Swahilipot Hub · partners",
    mapsUrl: "https://maps.google.com/?q=Swahilipot+Hub+Mombasa",
    source: "coast-calendar",
  },
  {
    id: "mombasa-drift",
    title: "Mombasa Drift and Takeover",
    venue: "Mama Ngina Drive Waterfront",
    area: "Mombasa CBD",
    startsAt: "2026-09-24T18:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    category: "Motorsport · Nightlife",
    summary: "Cars, music, and a late crowd on the waterfront.",
    about:
      "A motorsport meet on Mama Ngina Drive. Check promoter posts for gate time and vehicle entry rules.",
    priceFromKes: 500,
    isFree: false,
    ticketPlatform: "eGotickets",
    ticketUrl: "https://egotickets.com/explore?q=mombasa",
    bookingSteps: [
      "Buy on eGotickets or the promoter link.",
      "Pick general / VIP / vehicle entry if listed.",
      "Pay and download the ticket.",
      "Bring ID for the gate.",
    ],
    organizer: "Coast motorsport promoters",
    mapsUrl: "https://maps.google.com/?q=Mama+Ngina+Waterfront+Mombasa",
    source: "coast-calendar",
  },
  {
    id: "women-summit",
    title: "Women Empowerment Summit 2026",
    venue: "Swahilipot Hub Foundation",
    area: "Mombasa",
    startsAt: "2026-09-25T09:00:00+03:00",
    endsAt: "2026-09-25T16:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1200&q=80",
    category: "Summit",
    summary: "Talks and workshops for women founders and tourism workers.",
    about:
      "Panels on funding, digital skills, and storytelling. Modest, practical schedule.",
    priceFromKes: 0,
    isFree: true,
    ticketPlatform: "Quicket",
    ticketUrl: "https://www.quicket.co.ke/events/?search=mombasa",
    bookingSteps: [
      "Find the event on Quicket.",
      "Register your seat.",
      "Show the digital ticket at reception.",
      "Bring a notebook.",
    ],
    organizer: "Coast community organizers",
    mapsUrl: "https://maps.google.com/?q=Swahilipot+Hub+Mombasa",
    source: "coast-calendar",
  },
  {
    id: "kilifi-dancehall",
    title: "Kilifi East Africa Dancehall Concert",
    venue: "Kilifi Creek venues",
    area: "Kilifi",
    startsAt: "2026-09-26T18:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
    category: "Concert",
    summary: "Dancehall and Afro sets by the creek.",
    about:
      "North Coast concert night. Plan a ride home if you are not sleeping in Kilifi.",
    priceFromKes: 1500,
    isFree: false,
    ticketPlatform: "eGotickets",
    ticketUrl: "https://egotickets.com/explore?q=kilifi",
    bookingSteps: [
      "Search the show on eGotickets.",
      "Pick your ticket tier.",
      "Pay with M-Pesa and keep the SMS.",
      "Arrive before the headliner.",
    ],
    organizer: "North Coast promoters",
    mapsUrl: "https://maps.google.com/?q=Kilifi+Creek+Kenya",
    source: "coast-calendar",
  },
  {
    id: "nyali-cleanup",
    title: "Beach Clean-up & Activities",
    venue: "Nyali Beach",
    area: "Nyali",
    startsAt: "2026-09-27T08:00:00+03:00",
    endsAt: "2026-09-27T11:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
    category: "Community",
    summary: "Morning clean-up, then a short stretch and meet-up.",
    about:
      "Free community clean-up. Bring water, sunscreen, and closed shoes. Gloves are often provided.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "RSVP / walk-up",
    ticketUrl: "https://www.instagram.com/explore/tags/mombasabeachcleanup/",
    bookingSteps: [
      "RSVP on the organizer post if there is one.",
      "Meet at the published landmark.",
      "Sign the volunteer sheet.",
      "Collect gloves and bags.",
    ],
    organizer: "Coast eco groups & hotels",
    mapsUrl: "https://maps.google.com/?q=Nyali+Beach+Mombasa",
    source: "coast-calendar",
  },
  {
    id: "old-town-walk",
    title: "Old Town Heritage Night Walk",
    venue: "Mombasa Old Town",
    area: "Old Town",
    startsAt: "2026-09-28T17:30:00+03:00",
    endsAt: "2026-09-28T20:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
    category: "Culture",
    summary: "Guided dusk walk through doors, lanes, and spice stories.",
    about:
      "Short heritage walk from near Fort Jesus. Wear modest clothes and comfortable shoes.",
    priceFromKes: 800,
    isFree: false,
    ticketPlatform: "Guide desk / Quicket",
    ticketUrl: "https://www.quicket.co.ke/events/?search=mombasa",
    bookingSteps: [
      "Book on Quicket or pay the guide at the gate.",
      "Confirm the meetup point.",
      "Bring small notes for tips.",
      "Stay with the group after dark.",
    ],
    organizer: "Licensed Old Town guides",
    mapsUrl: "https://maps.google.com/?q=Fort+Jesus+Mombasa",
    source: "coast-calendar",
  },
  {
    id: "beneath-baobabs",
    title: "Journey to the Baobabs (Kilifi)",
    venue: "Beneath the Baobabs",
    area: "Kilifi",
    startsAt: "2026-10-10T18:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
    category: "Festival",
    summary: "Afro-house weekend under the baobabs.",
    about:
      "Music weekend in Kilifi. Check Quicket for the current pass types and book a bed early.",
    priceFromKes: 3500,
    isFree: false,
    ticketPlatform: "Quicket",
    ticketUrl: "https://www.quicket.co.ke/events/?search=baobabs",
    bookingSteps: [
      "Search the festival on Quicket.",
      "Pick a day or weekend pass.",
      "Save the ticket PDF or app pass.",
      "Book lodging before you travel.",
    ],
    organizer: "Beneath the Baobabs",
    contactHint: "support@quicket.co.ke for ticket issues",
    mapsUrl: "https://maps.google.com/?q=Beneath+the+Baobabs+Kilifi",
    source: "coast-calendar",
  },
  {
    id: "nairobi-jazz-garden",
    title: "Nairobi Jazz in the Gardens",
    venue: "Uhuru Gardens / city green stages",
    area: "Nairobi",
    startsAt: "2026-10-11T15:00:00+03:00",
    endsAt: "2026-10-11T21:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    category: "Music · Outdoor",
    summary: "Afternoon jazz sets and food stalls in the capital.",
    about:
      "An outdoor music afternoon popular with Nairobi locals and visitors. Check the promoter page for the exact lawn or amphitheatre each edition.",
    priceFromKes: 1500,
    isFree: false,
    ticketPlatform: "Ticketmaster / Quicket",
    ticketUrl: "https://www.ticketmaster.co.ke/",
    bookingSteps: [
      "Buy on the listed ticket platform.",
      "Arrive early for picnic space.",
      "Carry a light jacket for evening chill.",
      "Use ride-hail for the return if parking is tight.",
    ],
    organizer: "Nairobi arts promoters",
    mapsUrl: "https://maps.google.com/?q=Uhuru+Gardens+Nairobi",
    source: "coast-calendar",
  },
  {
    id: "karura-sunrise-run",
    title: "Karura Forest Sunrise Run",
    venue: "Karura Forest — Limuru Road gate",
    area: "Nairobi",
    startsAt: "2026-10-12T06:30:00+03:00",
    endsAt: "2026-10-12T08:30:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    category: "Sport · Community",
    summary: "Easy group jog through Nairobi's urban forest.",
    about:
      "Community run with forest entry covered or reimbursed depending on the host. Bring water and trail-friendly shoes.",
    priceFromKes: 600,
    isFree: false,
    ticketPlatform: "RSVP",
    ticketUrl: "https://maps.google.com/?q=Karura+Forest+Nairobi",
    bookingSteps: [
      "RSVP on the organizer link.",
      "Buy or show forest entry as instructed.",
      "Meet at the published gate 15 minutes early.",
      "Stay on marked trails.",
    ],
    organizer: "Nairobi running clubs",
    mapsUrl: "https://maps.google.com/?q=Karura+Forest+Limuru+Road",
    source: "coast-calendar",
  },
  {
    id: "nanyuki-equator-market",
    title: "Nanyuki Equator Craft & Food Fair",
    venue: "Nanyuki town fairground",
    area: "Nanyuki",
    startsAt: "2026-10-13T10:00:00+03:00",
    endsAt: "2026-10-13T17:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    category: "Market · Culture",
    summary: "Highland crafts, coffee, and lunch stalls near the equator line.",
    about:
      "A weekend fair for travelers based in Nanyuki - wool crafts, farm produce, and easy lunch stops before an Ol Pejeta or Mount Kenya afternoon.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "Walk-up",
    ticketUrl: "https://maps.google.com/?q=Nanyuki+Kenya",
    bookingSteps: [
      "No ticket needed.",
      "Carry small notes and M-Pesa.",
      "Ask before photographing makers.",
      "Evenings cool quickly - bring a layer.",
    ],
    organizer: "Nanyuki traders & tourism desk",
    mapsUrl: "https://maps.google.com/?q=Nanyuki+town",
    source: "coast-calendar",
  },
  {
    id: "ol-pejeta-rhino-talk",
    title: "Ol Pejeta Rhino Conservation Talk",
    venue: "Ol Pejeta Conservancy",
    area: "Nanyuki / Laikipia",
    startsAt: "2026-10-14T11:00:00+03:00",
    endsAt: "2026-10-14T12:30:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    category: "Wildlife · Education",
    summary: "Ranger talk on rhino protection for day visitors and lodge guests.",
    about:
      "Short conservation briefing that pairs well with a game drive. Confirm the day's talk time at the gate or lodge desk.",
    priceFromKes: 0,
    isFree: true,
    ticketPlatform: "Included with entry",
    ticketUrl: "https://www.olpejetaconservancy.org/",
    bookingSteps: [
      "Pay conservancy entry.",
      "Ask at reception for the talk schedule.",
      "Arrive 10 minutes early.",
      "Tips for rangers are optional but welcome.",
    ],
    organizer: "Ol Pejeta Conservancy",
    mapsUrl: "https://maps.google.com/?q=Ol+Pejeta+Conservancy",
    source: "coast-calendar",
  },
  {
    id: "nakuru-birding-morning",
    title: "Lake Nakuru Birding Morning",
    venue: "Lake Nakuru National Park",
    area: "Nakuru",
    startsAt: "2026-10-15T06:30:00+03:00",
    endsAt: "2026-10-15T11:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    category: "Nature · Wildlife",
    summary: "Guided birding and rhino spotting at the Rift lake.",
    about:
      "Early park entry with a bird guide. Flamingo numbers vary with water levels - rhinos and cliffs remain strong backups.",
    priceFromKes: 4500,
    isFree: false,
    ticketPlatform: "Operator / park gate",
    ticketUrl: "https://www.kws.go.ke/",
    bookingSteps: [
      "Book a Nakuru day operator or self-drive.",
      "Pay park fees at the gate.",
      "Bring binoculars and a warm morning layer.",
      "Carry water and packed snacks.",
    ],
    organizer: "Licensed Nakuru guides",
    mapsUrl: "https://maps.google.com/?q=Lake+Nakuru+National+Park",
    source: "coast-calendar",
  },
  {
    id: "naivasha-bike-day",
    title: "Hell's Gate Bike & Gorge Day",
    venue: "Hell's Gate National Park",
    area: "Naivasha",
    startsAt: "2026-10-16T08:00:00+03:00",
    endsAt: "2026-10-16T15:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
    category: "Adventure",
    summary: "Cycle the park roads, then walk the gorge.",
    about:
      "Active day trip from Nairobi or Naivasha. Bike hire is usually available at the gate.",
    priceFromKes: 3500,
    isFree: false,
    ticketPlatform: "Park gate + bike hire",
    ticketUrl: "https://www.kws.go.ke/",
    bookingSteps: [
      "Arrive early for cooler cycling.",
      "Pay park fees and hire bikes.",
      "Carry sun cover and water for the gorge.",
      "Optional Lake Naivasha boat after.",
    ],
    organizer: "Naivasha activity desks",
    mapsUrl: "https://maps.google.com/?q=Hells+Gate+National+Park",
    source: "coast-calendar",
  },
  {
    id: "mara-cultural-evening",
    title: "Mara Lodge Cultural Evening",
    venue: "Maasai Mara lodge bomas",
    area: "Maasai Mara",
    startsAt: "2026-10-17T19:00:00+03:00",
    endsAt: "2026-10-17T21:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    category: "Culture · Safari",
    summary: "Song, dance, and storytelling after game drives.",
    about:
      "Many Mara lodges host evening cultural performances. Ask your lodge what is included versus a community visit fee.",
    priceFromKes: 0,
    isFree: true,
    ticketPlatform: "Lodge schedule",
    ticketUrl: "https://maps.google.com/?q=Maasai+Mara",
    bookingSteps: [
      "Ask reception on arrival day.",
      "Confirm if a community fee applies.",
      "Dress warmly for evening savannah chill.",
      "Tip performers if you enjoyed the set.",
    ],
    organizer: "Mara lodges & community partners",
    mapsUrl: "https://maps.google.com/?q=Maasai+Mara+National+Reserve",
    source: "coast-calendar",
  },
  {
    id: "kisumu-lake-festival",
    title: "Kisumu Lake Food Festival",
    venue: "Kisumu waterfront",
    area: "Kisumu",
    startsAt: "2026-10-18T12:00:00+03:00",
    endsAt: "2026-10-18T20:00:00+03:00",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    category: "Food · Festival",
    summary: "Tilapia, lake views, and western Kenya music.",
    about:
      "Weekend food stalls along the lake - a good reason to base a night in Kisumu.",
    priceFromKes: 500,
    isFree: false,
    ticketPlatform: "Gate / walk-up",
    ticketUrl: "https://maps.google.com/?q=Kisumu+waterfront",
    bookingSteps: [
      "Pay any gate fee listed on the day.",
      "Carry M-Pesa for food stalls.",
      "Try Lake Victoria tilapia.",
      "Plan a ride back after dark.",
    ],
    organizer: "Kisumu county & food vendors",
    mapsUrl: "https://maps.google.com/?q=Kisumu+Kenya",
    source: "coast-calendar",
  },
];

export function getCoastEvent(id: string) {
  return COAST_EVENTS.find((e) => e.id === id) ?? null;
}
