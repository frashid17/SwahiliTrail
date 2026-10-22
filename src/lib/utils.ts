import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Remote CDNs (Unsplash, Ticketmaster, …) - skip /_next/image to avoid fetch timeouts. */
export function isRemoteImageSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}
