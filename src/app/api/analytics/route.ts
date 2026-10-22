import { NextResponse } from "next/server";
import {
  ANNUAL_INBOUND,
  KENYA_TOURISM_KPIS,
  KENYA_TOURISM_SOURCES,
  MONTHLY_INBOUND_2024,
  PURPOSE_OF_VISIT_2024,
  SOURCE_MARKETS_2024,
  TOP_PARKS_2024,
} from "@/lib/data/kenya-tourism";

/**
 * Public destination analytics — official Kenya tourism figures (TRI / Ministry / KWS),
 * not Swahili Trail product metrics.
 */
export async function GET() {
  const k = KENYA_TOURISM_KPIS;
  const internationalShare = Math.round(
    (k.bedNightsInternational / k.bedNightsTotal) * 100,
  );

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      datasetYear: k.year,
      kpis: {
        totalVisitors: k.internationalArrivals,
        arrivalsGrowthPct: k.arrivalsGrowthPct,
        peakMonth: k.peakMonth,
        peakVisitors: k.peakArrivals,
        inboundEarningsKesBn: k.inboundEarningsKesBn,
        earningsGrowthPct: k.earningsGrowthPct,
        holidayLeisureShare: k.holidayLeisureShare,
        internationalBedShare: internationalShare,
        parksVisits: k.parksAndReservesVisits,
        outlook2025: k.outlook2025,
      },
      monthly: MONTHLY_INBOUND_2024.map((m) => ({
        month: m.month,
        arrivals: m.arrivals,
      })),
      annual: ANNUAL_INBOUND.map((a) => ({
        year: String(a.year),
        arrivals: a.arrivals,
        provisional: "provisional" in a ? Boolean(a.provisional) : false,
      })),
      attractions: TOP_PARKS_2024.map((p) => ({
        name: p.name,
        visits: p.visits,
      })),
      markets: SOURCE_MARKETS_2024.map((m) => ({
        market: m.market,
        share: m.share,
        arrivals: m.arrivals,
      })),
      purpose: PURPOSE_OF_VISIT_2024.map((p) => ({
        theme: p.theme,
        score: p.score,
      })),
      sources: [...KENYA_TOURISM_SOURCES],
      note: `Official Kenya tourism figures for ${k.year} from the Tourism Research Institute and Ministry of Tourism & Wildlife. 2025 outlook is preliminary. Updated when new national reports are published.`,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
