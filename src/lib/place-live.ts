export type GoogleReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  authorUri?: string;
};

export type PlaceLivePayload = {
  placeId: string;
  source: "google-places" | "links-only";
  displayName?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  reviews: GoogleReview[];
  note: string;
};
