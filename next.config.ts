import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
