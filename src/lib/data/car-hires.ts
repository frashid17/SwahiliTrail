export type CarHire = {
  id: string;
  name: string;
  services: ("self-drive" | "chauffeur" | "airport-pickup")[];
  phone: string;
  phoneDisplay: string;
  websiteUrl: string;
  areas: string;
  note: string;
};

/** Established Kenya / coast car hire & transfer operators (demo catalogue). */
export const CAR_HIRES: CarHire[] = [
  {
    id: "avis-kenya",
    name: "Avis Kenya",
    services: ["self-drive", "chauffeur", "airport-pickup"],
    phone: "+254722205082",
    phoneDisplay: "+254 722 205 082",
    websiteUrl: "https://www.avis.co.ke/",
    areas: "Nairobi & Mombasa (Moi International Airport)",
    note: "International brand; book airport pickup for MBA in advance.",
  },
  {
    id: "budget-kenya",
    name: "Budget Rent a Car Kenya",
    services: ["self-drive", "chauffeur", "airport-pickup"],
    phone: "+254709885000",
    phoneDisplay: "+254 709 885 000",
    websiteUrl: "https://www.budget.co.ke/",
    areas: "Major airports including Mombasa",
    note: "Self-drive and chauffeur options; confirm coast fleet availability.",
  },
  {
    id: "europcar-kenya",
    name: "Europcar Kenya",
    services: ["self-drive", "chauffeur", "airport-pickup"],
    phone: "+254709392000",
    phoneDisplay: "+254 709 392 000",
    websiteUrl: "https://www.europcar.co.ke/",
    areas: "Kenya network with airport desks",
    note: "Useful for multi-day hire around the coast and day trips.",
  },
  {
    id: "hertz-kenya",
    name: "Hertz Kenya",
    services: ["self-drive", "chauffeur", "airport-pickup"],
    phone: "+254709885100",
    phoneDisplay: "+254 709 885 100",
    websiteUrl: "https://www.hertz.co.ke/",
    areas: "Airport and city pickup",
    note: "Ask for Mombasa / coast vehicle class when booking.",
  },
  {
    id: "glory-car-hire",
    name: "Glory Car Hire & Tours",
    services: ["self-drive", "chauffeur", "airport-pickup"],
    phone: "+254722714414",
    phoneDisplay: "+254 722 714 414",
    websiteUrl: "https://www.glorycarhire.com/",
    areas: "Mombasa, Diani, north coast",
    note: "Coast-focused operator - good for airport transfers and daily hire.",
  },
  {
    id: "xtreme-tours",
    name: "Xtreme Outdoor Adventures / Coast transfers",
    services: ["chauffeur", "airport-pickup"],
    phone: "+254722705884",
    phoneDisplay: "+254 722 705 884",
    websiteUrl: "https://www.xtremeoutdooradventures.com/",
    areas: "Mombasa & South Coast",
    note: "Chauffeur and transfer style trips; confirm rates before arrival.",
  },
];

export type TransportMode =
  | "none"
  | "airport-pickup"
  | "car-hire"
  | "chauffeur"
  | "airport-and-car";

export function carHiresForMode(mode: TransportMode): CarHire[] {
  if (mode === "none") return [];
  if (mode === "airport-pickup") {
    return CAR_HIRES.filter((c) => c.services.includes("airport-pickup"));
  }
  if (mode === "car-hire") {
    return CAR_HIRES.filter((c) => c.services.includes("self-drive"));
  }
  if (mode === "chauffeur") {
    return CAR_HIRES.filter((c) => c.services.includes("chauffeur"));
  }
  return CAR_HIRES;
}
