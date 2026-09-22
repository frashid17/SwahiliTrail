import { NextResponse } from "next/server";
import { fetchEventsFeed } from "@/lib/events-feed";

export async function GET() {
  const feed = await fetchEventsFeed();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
