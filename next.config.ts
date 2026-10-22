import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer smaller optimized variants for place cards / hero.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    // Must list every quality= used by <Image /> (Next 16 default is [75] only).
    qualities: [65, 70, 75],
    // Cache remote optimizations longer so slow CDNs are hit less often.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "**.ticketm.net",
      },
      {
        protocol: "https",
        hostname: "media.ticketmaster.com",
      },
      {
        protocol: "https",
        hostname: "media.ticketmaster.eu",
      },
      {
        protocol: "https",
        hostname: "hustle.imgix.net",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      // Google Places photo CDN (AI-matched stays / restaurants)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
