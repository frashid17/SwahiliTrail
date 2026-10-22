import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  description: string | null;
  reference: string;
};

type SubRow = {
  user_id: string;
  status: string;
  email: string | null;
  current_period_end: string | null;
  updated_at: string;
};

type AiRow = {
  user_id: string;
  period: string;
  count: number;
  last_source: string | null;
  updated_at: string;
};

function periodKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatKes(subunits: number) {
  const major = subunits / 100;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(major);
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const period = periodKey();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  const sinceIso = since.toISOString();

  const [paymentsRes, subsRes, aiRes, eventsRes] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, amount, currency, status, paid_at, created_at, description, reference",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("subscriptions")
      .select("user_id, status, email, current_period_end, updated_at")
      .limit(2000),
    supabase
      .from("ai_usage")
      .select("user_id, period, count, last_source, updated_at")
      .eq("period", period)
      .order("count", { ascending: false })
      .limit(50),
    supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const subs = (subsRes.data ?? []) as SubRow[];
  const aiRows = (aiRes.data ?? []) as AiRow[];
  const events = (eventsRes.data ?? []) as {
    event_type: string;
    created_at: string;
  }[];

  const successPayments = payments.filter((p) => p.status === "success");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const failedPayments = payments.filter((p) => p.status === "failed");
  const revenueKes = successPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const recentWindow = successPayments.filter((p) => {
    const t = p.paid_at ?? p.created_at;
    return t >= sinceIso;
  });

  const byDay = new Map<string, { amount: number; count: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (29 - i));
    byDay.set(d.toISOString().slice(0, 10), { amount: 0, count: 0 });
  }
  for (const p of recentWindow) {
    const key = dayKey(p.paid_at ?? p.created_at);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.amount += p.amount;
      bucket.count += 1;
    }
  }

  const revenueSeries = [...byDay.entries()].map(([day, v]) => ({
    day,
    label: day.slice(5),
    amount: v.amount / 100,
    count: v.count,
  }));

  const planMix = {
    active: subs.filter((s) => s.status === "active").length,
    inactive: subs.filter((s) => s.status === "inactive").length,
    past_due: subs.filter((s) => s.status === "past_due").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
  };

  const aiCallsThisMonth = aiRows.reduce((s, r) => s + (r.count ?? 0), 0);

  const eventCounts = new Map<string, number>();
  for (const e of events) {
    eventCounts.set(e.event_type, (eventCounts.get(e.event_type) ?? 0) + 1);
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    period,
    kpis: {
      revenueKes,
      revenueFormatted: formatKes(revenueKes),
      paymentsSuccess: successPayments.length,
      paymentsPending: pendingPayments.length,
      paymentsFailed: failedPayments.length,
      activeSubscribers: planMix.active,
      aiCallsThisMonth,
      eventsSampled: events.length,
    },
    deltas: {
      revenue30d: formatKes(
        recentWindow.reduce((s, p) => s + p.amount, 0),
      ),
      payments30d: recentWindow.length,
    },
    revenueSeries,
    planMix,
    recentPayments: payments.slice(0, 40).map((p) => ({
      id: p.id,
      reference: p.reference,
      userId: p.user_id,
      amountFormatted: formatKes(p.amount),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      description: p.description ?? "Trail Plus",
      at: p.paid_at ?? p.created_at,
    })),
    subscribers: subs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 80)
      .map((s) => ({
        userId: s.user_id,
        email: s.email,
        status: s.status,
        periodEnd: s.current_period_end,
        updatedAt: s.updated_at,
      })),
    topAiUsers: aiRows.slice(0, 24).map((r) => ({
      userId: r.user_id,
      count: r.count,
      lastSource: r.last_source,
      updatedAt: r.updated_at,
    })),
    recentEvents: events.slice(0, 40),
    eventBreakdown: [...eventCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    note:
      payments.length === 0 && subs.length === 0
        ? "Live tables are empty so far. KPIs will fill as travelers upgrade and use AI."
        : "Live ops snapshot from payments, subscriptions, AI usage, and product analytics.",
  });
}
