"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsPayload = {
  datasetYear: number;
  kpis: {
    totalVisitors: number;
    arrivalsGrowthPct: number;
    peakMonth: string;
    peakVisitors: number;
    inboundEarningsKesBn: number;
    earningsGrowthPct: number;
    holidayLeisureShare: number;
    internationalBedShare: number;
    parksVisits: number;
    outlook2025: {
      internationalArrivals: number;
      domesticTravelers: number;
      totalTourists: number;
      earningsKesTn: number;
    };
  };
  monthly: { month: string; arrivals: number }[];
  annual: { year: string; arrivals: number; provisional: boolean }[];
  attractions: { name: string; visits: number }[];
  markets: { market: string; share: number; arrivals: number }[];
  purpose: { theme: string; score: number }[];
  sources: { id: string; label: string; url: string; year: number | null }[];
  note: string;
};

const pieColors = [
  "#062a2e",
  "#1a7a7e",
  "#2bb5b0",
  "#c4a35a",
  "#d4653a",
  "#8b6b3d",
  "#4a6fa5",
  "#6b8f71",
  "#9b59b6",
  "#e2ddd4",
];

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-KE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatCount(n: number | undefined | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-KE");
}

function isKenyaTourismPayload(json: unknown): json is AnalyticsPayload {
  if (!json || typeof json !== "object") return false;
  const record = json as Record<string, unknown>;
  const kpis = record.kpis;
  if (!kpis || typeof kpis !== "object") return false;
  const k = kpis as Record<string, unknown>;
  return (
    typeof k.totalVisitors === "number" &&
    typeof k.peakVisitors === "number" &&
    typeof k.inboundEarningsKesBn === "number" &&
    k.outlook2025 != null &&
    typeof k.outlook2025 === "object" &&
    Array.isArray(record.monthly) &&
    Array.isArray(record.markets)
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        if (!isKenyaTourismPayload(json)) {
          throw new Error(
            "Analytics data is outdated or incomplete. Refresh the page.",
          );
        }
        setData(json);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  if (error) {
    return (
      <div className="coastal-grid flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-coral">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="coastal-grid flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted">Loading Kenya tourism analytics…</p>
      </div>
    );
  }

  const outlook = data.kpis.outlook2025;
  const year = data.datasetYear ?? 2024;

  return (
    <div className="paper-grain coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Destination Analytics
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ocean-deep">
          Kenya travel pulse
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{data.note}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: `International arrivals (${year})`,
              value: formatCount(data.kpis.totalVisitors),
              hint: `+${data.kpis.arrivalsGrowthPct}% vs prior year`,
            },
            {
              label: `Peak month (${data.kpis.peakMonth})`,
              value: formatCount(data.kpis.peakVisitors),
              hint: "Highest inbound month",
            },
            {
              label: "Inbound earnings",
              value: `KES ${Number(data.kpis.inboundEarningsKesBn).toFixed(1)}B`,
              hint: `+${data.kpis.earningsGrowthPct}% vs prior year`,
            },
            {
              label: "Holiday / leisure share",
              value: `${data.kpis.holidayLeisureShare}%`,
              hint: "Purpose of visit",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                {kpi.label}
              </p>
              <p className="mt-2 font-display text-3xl text-ocean-deep">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-muted">{kpi.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-border/80 bg-surface/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            2025 outlook (preliminary)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "International",
                value: formatCompact(outlook.internationalArrivals),
              },
              {
                label: "Domestic travelers",
                value: formatCompact(outlook.domesticTravelers),
              },
              {
                label: "Total tourists",
                value: formatCompact(outlook.totalTourists),
              },
              {
                label: "Sector earnings",
                value: `KES ${outlook.earningsKesTn}T`,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted">{item.label}</p>
                <p className="font-display text-xl text-ocean-deep">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Monthly inbound arrivals ({data.datasetYear})
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e8e7" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => formatCompact(Number(v))}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString("en-KE"),
                      "Arrivals",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="arrivals"
                    name="International arrivals"
                    stroke="#0b6e7a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Source markets ({data.datasetYear})
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.markets}
                    dataKey="share"
                    nameKey="market"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {data.markets.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const arrivals = (
                        item?.payload as { arrivals?: number } | undefined
                      )?.arrivals;
                      return [
                        `${Number(value).toFixed(1)}%${
                          arrivals
                            ? ` · ${arrivals.toLocaleString("en-KE")}`
                            : ""
                        }`,
                        "Share",
                      ];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Top parks & reserves ({data.datasetYear})
            </h2>
            <p className="mt-1 text-xs text-muted">
              {formatCount(data.kpis.parksVisits)} visits to parks & game
              reserves overall
            </p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attractions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e8e7" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => formatCompact(Number(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString("en-KE"),
                      "Visits",
                    ]}
                  />
                  <Bar dataKey="visits" fill="#1aa6b5" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Purpose of visit ({data.datasetYear})
            </h2>
            <div className="mt-4 space-y-3">
              {data.purpose.map((item) => (
                <div key={item.theme}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ocean-deep">{item.theme}</span>
                    <span className="font-semibold text-aqua">
                      {item.score}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foam">
                    <div
                      className="h-full rounded-full bg-ocean"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-8 font-display text-lg text-ocean-deep">
              Arrivals recovery (2020–2025)
            </h3>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.annual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e8e7" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatCompact(Number(v))}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString("en-KE"),
                      "Arrivals",
                    ]}
                  />
                  <Bar dataKey="arrivals" fill="#0b6e7a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-surface p-5">
          <h2 className="font-display text-xl text-ocean-deep">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {data.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ocean-deep underline-offset-2 hover:underline"
                >
                  {source.label}
                </a>
                {source.year ? (
                  <span className="text-muted"> · {source.year}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
