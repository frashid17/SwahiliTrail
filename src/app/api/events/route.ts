import { NextResponse } from "next/server";
import { fetchEventsFeed } from "@/lib/events-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await fetchEventsFeed();
  return NextResponse.json(feed, {
    headers: {
      // Short CDN cache so HustleSasa / Ticketmaster updates show quickly.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
