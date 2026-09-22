import { placePhoto } from "@/lib/data/place-photo-urls";
import { COAST_IMAGES as img } from "@/lib/data/coast-images";

export type Restaurant = {
  id: string;
  name: string;
  area: string;
  cuisine: string;
  priceLevel: "KES $" | "KES $$" | "KES $$$";
  avgMealKes: number;
  rating: number;
  tags: string[];
  vibe: string;
  description: string;
  imageUrl: string;
  websiteUrl: string | null;
  mapsUrl: string;
};

export function restaurantsForArea(area: string): Restaurant[] {
  if (!area || area === "whole-coast") return RESTAURANTS;
  const needle = area.toLowerCase();
  const filtered = RESTAURANTS.filter(
    (r) =>
      r.area.toLowerCase().includes(needle) ||
      needle.includes(r.area.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(needle)),
  );
  return filtered.length > 0 ? filtered : RESTAURANTS;
}

export function hydrateRestaurants(items: Restaurant[]): Restaurant[] {
  return items
    .map((item) => RESTAURANTS.find((r) => r.id === item.id) ?? null)
    .filter((r): r is Restaurant => Boolean(r));
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: "tamarind-mombasa",
    name: "Tamarind Restaurant",
    area: "Nyali",
    cuisine: "Seafood / Swahili",
    priceLevel: "KES $$$",
    avgMealKes: 4500,
    rating: 4.7,
    tags: ["seafood", "romantic", "views", "Nyali"],
    vibe: "Iconic creek-side seafood",
    description:
      "Classic Mombasa seafood terrace overlooking Tudor Creek - lobster, prawns, and sunset dining.",
    imageUrl: placePhoto("tamarind-mombasa", img.seafoodDining),
    websiteUrl: "https://tamarind.co.ke/",
    mapsUrl: "https://maps.google.com/?q=Tamarind+Restaurant+Mombasa",
  },
  {
    id: "forodhani",
    name: "Forodhani Restaurant",
    area: "Mombasa Old Town",
    cuisine: "Swahili / Coastal",
    priceLevel: "KES $$",
    avgMealKes: 1800,
    rating: 4.4,
    tags: ["swahili", "local", "Old Town"],
    vibe: "Old Town flavors",
    description:
      "Coastal Swahili plates near the heritage lanes - biryani, coconut fish, and chai stops nearby.",
    imageUrl: placePhoto("forodhani", img.restaurantBeach),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Forodhani+Restaurant+Mombasa",
  },
  {
    id: "galaxy",
    name: "Galaxy Chinese Restaurant",
    area: "Nyali",
    cuisine: "Chinese / Asian",
    priceLevel: "KES $$",
    avgMealKes: 2200,
    rating: 4.3,
    tags: ["family", "chinese", "Nyali"],
    vibe: "North-coast family favorite",
    description:
      "Long-running Nyali Chinese restaurant popular with families and mixed groups.",
    imageUrl: placePhoto("galaxy", img.grill),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Galaxy+Chinese+Restaurant+Nyali",
  },
  {
    id: "java-nyali",
    name: "Java House Nyali",
    area: "Nyali",
    cuisine: "Cafe / Casual",
    priceLevel: "KES $",
    avgMealKes: 1200,
    rating: 4.2,
    tags: ["cafe", "breakfast", "wifi", "Nyali"],
    vibe: "Easy daytime cafe",
    description:
      "Reliable coffee, breakfast, and light meals between beach and shopping stops.",
    imageUrl: placePhoto("java-nyali", img.barInterior),
    websiteUrl: "https://www.javahouseafrica.com/",
    mapsUrl: "https://maps.google.com/?q=Java+House+Nyali",
  },
  {
    id: "shehnai",
    name: "Shehnai Restaurant",
    area: "Mombasa CBD",
    cuisine: "Indian",
    priceLevel: "KES $$",
    avgMealKes: 2000,
    rating: 4.5,
    tags: ["indian", "family", "city"],
    vibe: "Island Indian classic",
    description:
      "Well-loved Indian dining on Mombasa island - good for groups after Old Town or CBD errands.",
    imageUrl: placePhoto("shehnai", img.grill),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Shehnai+Restaurant+Mombasa",
  },
  {
    id: "sails",
    name: "Sails Beach Bar & Restaurant",
    area: "Diani Beach",
    cuisine: "Seafood / Grill",
    priceLevel: "KES $$$",
    avgMealKes: 3800,
    rating: 4.6,
    tags: ["beach", "seafood", "sunset", "Diani"],
    vibe: "Feet-in-sand dining",
    description:
      "Beachfront seafood and cocktails for Diani evenings - book ahead on weekends.",
    imageUrl: placePhoto("sails", img.restaurantBeach),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Sails+Restaurant+Diani",
  },
  {
    id: "nomad",
    name: "Nomad Beach Bar",
    area: "Diani Beach",
    cuisine: "International / Coastal",
    priceLevel: "KES $$",
    avgMealKes: 2800,
    rating: 4.4,
    tags: ["casual", "beach", "Diani"],
    vibe: "South coast casual",
    description:
      "Relaxed Diani beach bar with pizza, seafood, and a social sunset crowd.",
    imageUrl: placePhoto("nomad", img.restaurantBeach),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Nomad+Beach+Bar+Diani",
  },
  {
    id: "blaze",
    name: "Blaze Grill",
    area: "Nyali",
    cuisine: "Grill / Steak",
    priceLevel: "KES $$",
    avgMealKes: 2600,
    rating: 4.3,
    tags: ["grill", "meat", "Nyali"],
    vibe: "North-coast grill night",
    description:
      "Hearty grills and sharers - solid pick after a beach day in Nyali.",
    imageUrl: placePhoto("blaze", img.grill),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Blaze+Grill+Nyali",
  },
  {
    id: "coffee-house",
    name: "Miss Port Coffee House",
    area: "Mama Ngina Waterfront",
    cuisine: "Cafe / Light bites",
    priceLevel: "KES $",
    avgMealKes: 900,
    rating: 4.1,
    tags: ["cafe", "waterfront", "views"],
    vibe: "Promenade coffee stop",
    description:
      "Light bites and coffee with Mama Ngina Waterfront energy - good sunset staging point.",
    imageUrl: placePhoto("coffee-house", img.barInterior),
    websiteUrl: null,
    mapsUrl: "https://maps.google.com/?q=Mama+Ngina+Waterfront+Mombasa+cafe",
  },
  {
    id: "kilifi-beach",
    name: "Distant Relatives Ecolodge Kitchen",
    area: "Kilifi",
    cuisine: "Farm-to-table / Coastal",
    priceLevel: "KES $$",
    avgMealKes: 2100,
    rating: 4.5,
    tags: ["nature", "community", "Kilifi"],
    vibe: "Creek community dining",
    description:
      "Communal, creative meals near Kilifi Creek - great after a nature day.",
    imageUrl: placePhoto("kilifi-beach", img.restaurantBeach),
    websiteUrl: "https://www.distantrelatives.cc/",
    mapsUrl: "https://maps.google.com/?q=Distant+Relatives+Ecolodge+Kilifi",
  },
];
