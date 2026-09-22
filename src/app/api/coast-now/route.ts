import { NextResponse } from "next/server";
import {
  MOMBASA_COORDS,
  type CoastNowPayload,
} from "@/lib/coast-now";

const { lat: LAT, lon: LON, tz: TZ } = MOMBASA_COORDS;

/**
 * Open-Meteo with timezone=Africa/Nairobi returns wall-clock strings like
 * "2026-09-22T06:10" (no offset). Parsing those with `new Date()` uses the
 * *server* local zone — UTC on Vercel — then formatting into Nairobi adds +3h
 * and shows wrong sunrise/sunset/tides in production.
 */
function formatHm(iso: string) {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

/** Parse Open-Meteo Nairobi wall-clock timestamps into epoch ms. */
function parseCoastLocalMs(iso: string): number {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) {
    return new Date(iso).getTime();
  }
  // Africa/Nairobi is UTC+3 year-round (no DST)
  const withOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)
    ? `${iso}:00+03:00`
    : `${iso}+03:00`;
  return new Date(withOffset).getTime();
}

function findNextTideExtremum(
  times: string[],
  heights: (number | null)[],
  nowMs: number,
): CoastNowPayload["nextTide"] {
  const points: { t: number; h: number; iso: string }[] = [];
  for (let i = 0; i < times.length; i++) {
    const h = heights[i];
    if (h == null || Number.isNaN(h)) continue;
    points.push({ t: parseCoastLocalMs(times[i]), h, iso: times[i] });
  }
  if (points.length < 3) return null;

  type Ext = { type: "high" | "low"; iso: string; h: number; t: number };
  const extrema: Ext[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (cur.h >= prev.h && cur.h >= next.h) {
      extrema.push({ type: "high", iso: cur.iso, h: cur.h, t: cur.t });
    } else if (cur.h <= prev.h && cur.h <= next.h) {
      extrema.push({ type: "low", iso: cur.iso, h: cur.h, t: cur.t });
    }
  }

  const upcoming = extrema.find((e) => e.t >= nowMs - 15 * 60 * 1000);
  if (!upcoming) return null;
  return {
    type: upcoming.type,
    time: formatHm(upcoming.iso),
    heightM: Math.round(upcoming.h * 100) / 100,
  };
}

export async function GET() {
  try {
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", String(LAT));
    weatherUrl.searchParams.set("longitude", String(LON));
    weatherUrl.searchParams.set("current", "temperature_2m");
    weatherUrl.searchParams.set("daily", "sunrise,sunset");
    weatherUrl.searchParams.set("timezone", TZ);
    weatherUrl.searchParams.set("forecast_days", "1");

    const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
    marineUrl.searchParams.set("latitude", String(LAT));
    marineUrl.searchParams.set("longitude", String(LON));
    marineUrl.searchParams.set("hourly", "sea_level_height_msl");
    marineUrl.searchParams.set("timezone", TZ);
    marineUrl.searchParams.set("forecast_days", "2");

    const [weatherRes, marineRes] = await Promise.all([
      fetch(weatherUrl, { next: { revalidate: 300 } }),
      fetch(marineUrl, { next: { revalidate: 300 } }),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather upstream ${weatherRes.status}`);
    }

    const weather = (await weatherRes.json()) as {
      current?: { temperature_2m?: number };
      daily?: { sunrise?: string[]; sunset?: string[] };
    };

    let nextTide: CoastNowPayload["nextTide"] = null;
    if (marineRes.ok) {
      const marine = (await marineRes.json()) as {
        hourly?: {
          time?: string[];
          sea_level_height_msl?: (number | null)[];
        };
      };
      nextTide = findNextTideExtremum(
        marine.hourly?.time ?? [],
        marine.hourly?.sea_level_height_msl ?? [],
        Date.now(),
      );
    }

    const temp = weather.current?.temperature_2m;
    const sunriseIso = weather.daily?.sunrise?.[0];
    const sunsetIso = weather.daily?.sunset?.[0];

    if (temp == null || !sunriseIso || !sunsetIso) {
      throw new Error("Incomplete weather payload");
    }

    const payload: CoastNowPayload = {
      location: "Mombasa",
      temperatureC: Math.round(temp),
      sunrise: formatHm(sunriseIso),
      sunset: formatHm(sunsetIso),
      nextTide,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[coast-now]", error);
    return NextResponse.json(
      { error: "Unable to load coast conditions" },
      { status: 502 },
    );
  }
}
