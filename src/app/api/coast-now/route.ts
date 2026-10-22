import { NextResponse } from "next/server";
import {
  FALLBACK_COORDS,
  clampCoord,
  isCoastalLocation,
  type CoastNowPayload,
} from "@/lib/coast-now";

/**
 * Open-Meteo with an IANA timezone returns wall-clock strings like
 * "2026-09-22T06:10" (no offset). Prefer extracting HH:mm directly.
 */
function formatHm(isoOrUnix: string | number, timeZone: string) {
  if (typeof isoOrUnix === "number") {
    return new Date(isoOrUnix * 1000).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
  }
  const match = isoOrUnix.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;

  const d = new Date(isoOrUnix);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

function findNextTideExtremum(
  timesUnix: number[],
  heights: (number | null)[],
  nowMs: number,
  timeZone: string,
): CoastNowPayload["nextTide"] {
  const points: { t: number; h: number }[] = [];
  for (let i = 0; i < timesUnix.length; i++) {
    const h = heights[i];
    if (h == null || Number.isNaN(h)) continue;
    points.push({ t: timesUnix[i] * 1000, h });
  }
  if (points.length < 3) return null;

  type Ext = { type: "high" | "low"; t: number; h: number };
  const extrema: Ext[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (cur.h >= prev.h && cur.h >= next.h) {
      extrema.push({ type: "high", t: cur.t, h: cur.h });
    } else if (cur.h <= prev.h && cur.h <= next.h) {
      extrema.push({ type: "low", t: cur.t, h: cur.h });
    }
  }

  const upcoming = extrema.find((e) => e.t >= nowMs - 15 * 60 * 1000);
  if (!upcoming) return null;
  return {
    type: upcoming.type,
    time: formatHm(upcoming.t / 1000, timeZone),
    heightM: Math.round(upcoming.h * 100) / 100,
  };
}

async function reverseLabel(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "10");
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SwahiliTrail/1.0 (kenya travel platform)",
        Accept: "application/json",
      },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          county?: string;
          state?: string;
          country?: string;
        };
        name?: string;
        display_name?: string;
      };
      const a = json.address ?? {};
      const place =
        a.city || a.town || a.village || a.municipality || json.name;
      const region = a.state || a.county;
      if (place && region && place !== region) return `${place}, ${region}`;
      if (place) return place;
      if (json.display_name) {
        return json.display_name.split(",").slice(0, 2).join(",").trim();
      }
    }
  } catch {
    /* fall through */
  }

  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

function fallbackPayload(
  location: string,
  coastal: boolean,
  source: CoastNowPayload["source"],
): CoastNowPayload {
  return {
    location,
    temperatureC: 24,
    sunrise: "06:30",
    sunset: "18:40",
    nextTide: null,
    coastal,
    updatedAt: new Date().toISOString(),
    source,
  };
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const latParam = reqUrl.searchParams.get("lat");
  const lonParam = reqUrl.searchParams.get("lon");
  const rawLat = latParam != null && latParam !== "" ? Number(latParam) : NaN;
  const rawLon = lonParam != null && lonParam !== "" ? Number(lonParam) : NaN;
  const labelHint = reqUrl.searchParams.get("label")?.trim() || "";
  const hasGeo =
    Number.isFinite(rawLat) &&
    Number.isFinite(rawLon) &&
    Math.abs(rawLat) <= 90 &&
    Math.abs(rawLon) <= 180;

  const { lat, lon } = hasGeo
    ? clampCoord(rawLat, rawLon)
    : { lat: FALLBACK_COORDS.lat, lon: FALLBACK_COORDS.lon };
  const source: CoastNowPayload["source"] = hasGeo
    ? "geolocation"
    : "fallback";
  const coastal = isCoastalLocation(lat, lon);
  const defaultLabel = labelHint || FALLBACK_COORDS.label;

  try {
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", String(lat));
    weatherUrl.searchParams.set("longitude", String(lon));
    weatherUrl.searchParams.set("current", "temperature_2m");
    weatherUrl.searchParams.set("daily", "sunrise,sunset");
    weatherUrl.searchParams.set("timezone", "auto");
    weatherUrl.searchParams.set("forecast_days", "1");

    const weatherPromise = fetch(weatherUrl, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    }).catch(() => null);

    const marinePromise = coastal
      ? fetch(
          (() => {
            const marineUrl = new URL(
              "https://marine-api.open-meteo.com/v1/marine",
            );
            marineUrl.searchParams.set("latitude", String(lat));
            marineUrl.searchParams.set("longitude", String(lon));
            marineUrl.searchParams.set("hourly", "sea_level_height_msl");
            marineUrl.searchParams.set("timezone", "auto");
            marineUrl.searchParams.set("timeformat", "unixtime");
            marineUrl.searchParams.set("forecast_days", "2");
            return marineUrl;
          })(),
          {
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(4000),
          },
        ).catch(() => null)
      : Promise.resolve(null);

    const labelPromise = labelHint
      ? Promise.resolve(labelHint)
      : hasGeo
        ? reverseLabel(lat, lon).catch(() => defaultLabel)
        : Promise.resolve(FALLBACK_COORDS.label);

    const [weatherRes, marineRes, location] = await Promise.all([
      weatherPromise,
      marinePromise,
      labelPromise,
    ]);

    if (!weatherRes?.ok) {
      // Upstream timed out / failed - still return usable conditions.
      return NextResponse.json(
        fallbackPayload(location || defaultLabel, coastal, source),
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          },
        },
      );
    }

    const weather = (await weatherRes.json()) as {
      timezone?: string;
      current?: { temperature_2m?: number };
      daily?: { sunrise?: string[]; sunset?: string[] };
    };

    const timeZone = weather.timezone || FALLBACK_COORDS.tz;

    let nextTide: CoastNowPayload["nextTide"] = null;
    if (marineRes?.ok) {
      const marine = (await marineRes.json()) as {
        hourly?: {
          time?: number[];
          sea_level_height_msl?: (number | null)[];
        };
      };
      nextTide = findNextTideExtremum(
        marine.hourly?.time ?? [],
        marine.hourly?.sea_level_height_msl ?? [],
        Date.now(),
        timeZone,
      );
    }

    const temp = weather.current?.temperature_2m;
    const sunriseIso = weather.daily?.sunrise?.[0];
    const sunsetIso = weather.daily?.sunset?.[0];

    if (temp == null || !sunriseIso || !sunsetIso) {
      return NextResponse.json(
        fallbackPayload(location || defaultLabel, coastal, source),
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          },
        },
      );
    }

    const payload: CoastNowPayload = {
      location: location || defaultLabel,
      temperatureC: Math.round(temp),
      sunrise: formatHm(sunriseIso, timeZone),
      sunset: formatHm(sunsetIso, timeZone),
      nextTide,
      coastal,
      updatedAt: new Date().toISOString(),
      source,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[coast-now]", error);
    return NextResponse.json(
      fallbackPayload(defaultLabel, coastal, source),
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  }
}
