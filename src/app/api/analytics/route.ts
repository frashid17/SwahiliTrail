import { NextResponse } from "next/server";
import {
  MONTHLY_VISITORS,
  SOURCE_MARKETS,
  TOP_ATTRACTIONS,
  SENTIMENT_THEMES,
} from "@/lib/data/analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Public stakeholder dashboard — no auth required
  let recentEvents: { event_type: string; created_at: string }[] = [];
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    recentEvents = data ?? [];
  }

  const totalVisitors = MONTHLY_VISITORS.reduce((s, m) => s + m.visitors, 0);
  const peak = MONTHLY_VISITORS.reduce((a, b) =>
    a.visitors > b.visitors ? a : b,
  );

  return NextResponse.json({
    kpis: {
      totalVisitors,
      peakMonth: peak.month,
      peakVisitors: peak.visitors,
      avgSatisfaction: 4.6,
      internationalShare: 38,
    },
    monthly: MONTHLY_VISITORS,
    attractions: TOP_ATTRACTIONS,
    markets: SOURCE_MARKETS,
    sentiment: SENTIMENT_THEMES,
    recentEvents,
    note: "Demo dataset inspired by coastal tourism patterns for Mombasa stakeholder storytelling.",
  });
}
