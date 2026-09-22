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
  kpis: {
    totalVisitors: number;
    peakMonth: string;
    peakVisitors: number;
    avgSatisfaction: number;
    internationalShare: number;
  };
  monthly: {
    month: string;
    visitors: number;
    international: number;
    domestic: number;
  }[];
  attractions: { name: string; visits: number; satisfaction: number }[];
  markets: { market: string; share: number }[];
  sentiment: { theme: string; score: number }[];
  recentEvents: { event_type: string; created_at: string }[];
  note: string;
};

const pieColors = ["#043844", "#0b6e7a", "#1aa6b5", "#5ec8d1", "#e07a45", "#f2ebe0"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
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
        <p className="text-muted">Loading tourism analytics…</p>
      </div>
    );
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
          Tourism Analytics
        </p>
        <h1 className="mt-2 font-display text-4xl text-ocean-deep">
          Destination pulse
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{data.note}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Annual visitors (demo)",
              value: data.kpis.totalVisitors.toLocaleString(),
            },
            {
              label: `Peak month (${data.kpis.peakMonth})`,
              value: data.kpis.peakVisitors.toLocaleString(),
            },
            {
              label: "Avg satisfaction",
              value: `${data.kpis.avgSatisfaction}/5`,
            },
            {
              label: "International share",
              value: `${data.kpis.internationalShare}%`,
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
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Monthly visitor trend
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e8e7" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="domestic"
                    stroke="#0b6e7a"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="international"
                    stroke="#e07a45"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Source markets
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
                    paddingAngle={3}
                  >
                    {data.markets.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Top attractions
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attractions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e8e7" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#1aa6b5" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="font-display text-xl text-ocean-deep">
              Visitor sentiment themes
            </h2>
            <div className="mt-4 space-y-3">
              {data.sentiment.map((item) => (
                <div key={item.theme}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ocean-deep">{item.theme}</span>
                    <span className="font-semibold text-aqua">{item.score}</span>
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
          </div>
        </div>

        {data.recentEvents.length > 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-5">
            <h2 className="font-display text-xl text-ocean-deep">
              Recent product events
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {data.recentEvents.map((event, i) => (
                <li key={`${event.created_at}-${i}`}>
                  <span className="font-medium text-ocean-deep">
                    {event.event_type}
                  </span>{" "}
                  · {new Date(event.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
