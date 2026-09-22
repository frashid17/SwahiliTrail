export type PlaceReview = {
  id: string;
  placeType: "attraction" | "wildlife" | "explore";
  placeId: string;
  author: string;
  rating: number;
  text: string;
  imageDataUrl?: string;
  createdAt: string;
};

const STORAGE_KEY = "swahili-trail-place-reviews";

function loadAll(): PlaceReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlaceReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(reviews: PlaceReview[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews.slice(0, 400)));
}

export function loadReviewsForPlace(
  placeType: PlaceReview["placeType"],
  placeId: string,
): PlaceReview[] {
  return loadAll()
    .filter((r) => r.placeType === placeType && r.placeId === placeId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function averageRating(reviews: PlaceReview[]) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function addPlaceReview(
  review: Omit<PlaceReview, "id" | "createdAt">,
): PlaceReview[] {
  const next: PlaceReview = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const all = [next, ...loadAll()];
  saveAll(all);
  return loadReviewsForPlace(review.placeType, review.placeId);
}

/** Compress image file to a data URL for local demo storage */
export function fileToReviewImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    if (file.size > 4_000_000) {
      reject(new Error("Image should be under 4MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
