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
      "County and tourism stakeholders explore AI for coastal journeys, stays, and analytics.",
    about:
      "A showcase day for digital tourism prototypes, demos, and conversations with Mombasa Tourism Council partners. Expect panels, student demos, and networking at Swahilipot Hub.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "Event registration",
    ticketUrl: "https://www.swahilipothub.co.ke/",
    bookingSteps: [
      "Open the Swahilipot Hub site or event registration link shared by organizers.",
      "Register with your name, email, and organization (if any).",
      "Save the confirmation email / QR for gate entry.",
      "Arrive early for seating - bring a notebook and water.",
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
    summary: "Car culture meet, music, and waterfront energy after dark.",
    about:
      "A coast motorsport and lifestyle meet along Mama Ngina Drive - showcase cars, DJs, and a late social crowd. Follow promoters for gate times and vehicle registration rules.",
    priceFromKes: 500,
    isFree: false,
    ticketPlatform: "eGotickets",
    ticketUrl: "https://egotickets.com/explore?q=mombasa",
    bookingSteps: [
      "Open the ticket link (eGotickets or the promoter's posted checkout).",
      "Choose ticket type (general / VIP / vehicle entry if listed).",
      "Pay with M-Pesa or card and download your e-ticket.",
      "Arrive with ID; expect security checks at the waterfront gate.",
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
    summary: "Talks, mentors, and coastal founders' sessions.",
    about:
      "A day of panels and workshops for women founders, creatives, and tourism professionals on the coast. Sessions typically cover funding, digital skills, and storytelling.",
    priceFromKes: 0,
    isFree: true,
    ticketPlatform: "Quicket",
    ticketUrl: "https://www.quicket.co.ke/events/?search=mombasa",
    bookingSteps: [
      "Search the summit name on Quicket or use the organizer's registration page.",
      "Create / sign in to a Quicket account.",
      "Select free or paid seats and complete checkout.",
      "Show the digital ticket at Swahilipot reception.",
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
    summary: "Dancehall and Afro sounds under the North Coast sky.",
    about:
      "A Kilifi creek concert night featuring regional dancehall and Afro acts. Bring light layers for evening breeze; plan transport back to Mombasa if you are not staying overnight.",
    priceFromKes: 1500,
    isFree: false,
    ticketPlatform: "eGotickets",
    ticketUrl: "https://egotickets.com/explore?q=kilifi",
    bookingSteps: [
      "Open eGotickets and search the concert title or Kilifi date.",
      "Pick Early Bird / Gate / VIP if tiers exist.",
      "Pay via M-Pesa and keep the SMS / app ticket.",
      "Arrive before headline time - creek venues fill early.",
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
    summary: "Morning clean-up, stretch, and coastal community meet.",
    about:
      "Join neighbors and visitors for a shoreline clean-up followed by light activities. Gloves often provided; bring sunscreen, water, and closed shoes.",
    priceFromKes: null,
    isFree: true,
    ticketPlatform: "RSVP / walk-up",
    ticketUrl: "https://www.instagram.com/explore/tags/mombasabeachcleanup/",
    bookingSteps: [
      "RSVP on the organizer's Instagram / WhatsApp broadcast when posted.",
      "No paid ticket - free community event.",
      "Meet at the published Nyali landmark (hotel or lifeguard tower).",
      "Sign the volunteer sheet and collect gloves / bags.",
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
    summary: "Guided dusk walk through carved doors, lanes, and spice stories.",
    about:
      "A guided heritage walk as the Old Town softens into evening - architecture, trade history, and respectful photography tips. Modest dress recommended.",
    priceFromKes: 800,
    isFree: false,
    ticketPlatform: "Guide desk / Quicket",
    ticketUrl: "https://www.quicket.co.ke/events/?search=mombasa",
    bookingSteps: [
      "Book via Quicket if listed, or pay the licensed guide at Fort Jesus gate.",
      "Confirm meetup point (usually near Fort Jesus).",
      "Wear comfortable shoes; bring small notes for tips.",
      "Stay with the group after dark in narrower lanes.",
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
    summary: "Afro-house weekend under the iconic baobabs.",
    about:
      "A North Coast music weekend known for Afro-house and Afro-tech stages among baobab trees. Check Quicket for the current edition dates and VIP tiers.",
    priceFromKes: 3500,
    isFree: false,
    ticketPlatform: "Quicket",
    ticketUrl:
      "https://www.quicket.co.ke/events/?search=baobabs",
    bookingSteps: [
      "Open Quicket and search Journey to the Baobabs / Beneath the Baobabs.",
      "Choose day or weekend pass (Early Bird / VIP when available).",
      "Pay and save your Quicket ticket in the app or PDF.",
      "Plan Kilifi lodging early - on-site beds sell out.",
    ],
    organizer: "Beneath the Baobabs",
    contactHint: "support@quicket.co.ke for ticket issues",
    mapsUrl: "https://maps.google.com/?q=Beneath+the+Baobabs+Kilifi",
    source: "coast-calendar",
  },
];

export function getCoastEvent(id: string) {
  return COAST_EVENTS.find((e) => e.id === id) ?? null;
}
