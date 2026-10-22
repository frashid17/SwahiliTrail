"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  Hourglass,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Marquee } from "@/components/shadcn-space/radix/animations/marquee";
import { DynamicButton } from "@/components/motion/dynamic-button";
import { ScrambleText } from "@/components/motion/scramble-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Overview = {
  generatedAt: string;
  period: string;
  kpis: {
    revenueKes: number;
    revenueFormatted: string;
    paymentsSuccess: number;
    paymentsPending: number;
    paymentsFailed: number;
    activeSubscribers: number;
    aiCallsThisMonth: number;
    eventsSampled: number;
  };
  deltas: { revenue30d: string; payments30d: number };
  revenueSeries: {
    day: string;
    label: string;
    amount: number;
    count: number;
  }[];
  planMix: {
    active: number;
    inactive: number;
    past_due: number;
    cancelled: number;
  };
  recentPayments: {
    id: string;
    reference: string;
    userId: string;
    amountFormatted: string;
    status: string;
    description: string;
    at: string;
  }[];
  topAiUsers: {
    userId: string;
    count: number;
    lastSource: string | null;
    updatedAt: string;
  }[];
  recentEvents: { event_type: string; created_at: string }[];
  eventBreakdown: { type: string; count: number }[];
  note: string;
};

const PIE_COLORS = [
  "var(--aqua)",
  "var(--ocean)",
  "var(--gold)",
  "var(--coral)",
];

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-KE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusTone(status: string) {
  if (status === "success")
    return "bg-[color-mix(in_oklab,var(--aqua)_14%,transparent)] text-ocean";
  if (status === "pending")
    return "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-ocean-deep";
  return "bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-coral";
}

export function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const boot = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, []);

  if (error && !data) {
    return (
      <Card className="border-coral/30 bg-surface">
        <CardContent className="py-10 text-center text-coral">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return <AdminSkeleton />;

  const barStats = [
    {
      title: "Gross revenue",
      value: data.kpis.revenueFormatted,
      hint: `${data.deltas.revenue30d} · 30d`,
      icon: Wallet,
      badge: "+ live",
      tone: "gold" as const,
    },
    {
      title: "Cleared payments",
      value: String(data.kpis.paymentsSuccess),
      hint: `${data.deltas.payments30d} in 30 days`,
      icon: CreditCard,
      badge: "success",
      tone: "ocean" as const,
    },
    {
      title: "Pending",
      value: String(data.kpis.paymentsPending),
      hint: "Awaiting Paystack",
      icon: Hourglass,
      badge: "open",
      tone: "gold" as const,
    },
    {
      title: "Trail Plus active",
      value: String(data.kpis.activeSubscribers),
      hint: `${data.planMix.past_due} past due`,
      icon: Users,
      badge: "subs",
      tone: "aqua" as const,
    },
  ];

  const planPie = [
    { name: "Active", value: data.planMix.active, fill: "var(--aqua)" },
    { name: "Inactive", value: data.planMix.inactive, fill: "var(--ocean)" },
    { name: "Past due", value: data.planMix.past_due, fill: "var(--gold)" },
    { name: "Cancelled", value: data.planMix.cancelled, fill: "var(--coral)" },
  ].filter((d) => d.value > 0);

  const pending = data.recentPayments.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      {/* Hero command strip — statistics-01 energy */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-7"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--gold)_28%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--aqua)_22%,transparent),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 bottom-0 hidden h-40 w-56 opacity-90 sm:block"
          style={{
            backgroundImage:
              "url(https://images.shadcnspace.com/assets/backgrounds/stats-01.webp)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right bottom",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Ops · live
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ocean-deep sm:text-4xl">
              <ScrambleText>Kenya travel console</ScrambleText>
            </h2>
            <p className="mt-2 text-sm text-muted">{data.note}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--aqua)_35%,var(--border))] bg-[color-mix(in_oklab,var(--aqua)_10%,transparent)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-ocean">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aqua opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aqua" />
              </span>
              Live
            </span>
            <DynamicButton
              variant="secondary"
              size="sm"
              stateKey={refreshing ? "busy" : "idle"}
              icon={
                <RefreshCw
                  className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                />
              }
              onClick={() => void load()}
              disabled={refreshing}
            >
              {refreshing ? "Syncing…" : "Refresh"}
            </DynamicButton>
          </div>
        </div>
        <p className="relative mt-4 text-xs text-muted">
          Updated {formatWhen(data.generatedAt)} · AI period {data.period}
        </p>
      </motion.div>

      {pending.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--gold)_40%,var(--border))] bg-[color-mix(in_oklab,var(--gold)_12%,var(--surface))] px-4 py-3"
        >
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-ocean-deep">
              {pending.length} payment{pending.length === 1 ? "" : "s"} still
              pending
            </p>
            <p className="text-xs text-muted">
              Not counted as revenue until Paystack status is{" "}
              <code className="rounded bg-foam px-1">success</code>. Abandoned
              checkouts stay pending or move to failed after sync.
            </p>
          </div>
        </motion.div>
      ) : null}

      {/* statistics-02 style KPI bar */}
      <Card className="overflow-hidden border-border/80 bg-surface/95 p-0 shadow-[0_18px_40px_-28px_rgba(6,42,46,0.45)]">
        <CardContent className="flex w-full flex-wrap items-stretch px-0 lg:flex-nowrap">
          {barStats.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="w-full border-b border-border last:border-b-0 md:w-6/12 md:border-e md:even:border-e-0 md:nth-[n+3]:border-b-0 lg:w-3/12 lg:border-b-0 lg:even:border-e lg:last:border-e-0"
            >
              <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-ocean-deep">
                    {item.title}
                  </p>
                  <div>
                    <p className="font-display text-2xl font-semibold text-ocean-deep">
                      <ScrambleText>{item.value}</ScrambleText>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-muted">{item.hint}</p>
                      <Badge
                        className={cn(
                          "font-normal",
                          item.tone === "gold" && "bg-gold/15 text-ocean-deep",
                          item.tone === "ocean" && "bg-ocean/10 text-ocean",
                          item.tone === "aqua" && "bg-aqua/15 text-ocean",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="rounded-full p-3 outline outline-border">
                  <item.icon className="h-4 w-4 text-aqua" />
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Event marquee */}
      {data.recentEvents.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-brand-deep py-3 text-on-brand">
          <Marquee pauseOnHover className="[--duration:40s]">
            {data.recentEvents.map((e, i) => (
              <span
                key={`${e.created_at}-${i}`}
                className="mx-4 inline-flex items-center gap-2 text-xs"
              >
                <Activity className="h-3 w-3 text-gold" />
                <span className="font-semibold text-gold">{e.event_type}</span>
                <span className="text-on-brand/55">{formatWhen(e.created_at)}</span>
              </span>
            ))}
          </Marquee>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5" id="revenue">
        <MotionPanel className="lg:col-span-3" delay={0.08}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display text-lg">
                Revenue · 30 days
              </CardTitle>
              <p className="text-xs text-muted">
                Cleared Paystack charges only (KES)
              </p>
            </div>
            <Badge className="bg-aqua/15 text-ocean">Live chart</Badge>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueSeries}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--aqua)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--aqua)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="color-mix(in oklab, var(--border) 80%, transparent)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `KES ${Number(value ?? 0).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--ocean)"
                  strokeWidth={2.5}
                  fill="url(#revFill)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </MotionPanel>

        <MotionPanel className="lg:col-span-2" delay={0.12} id="subscribers">
          <CardHeader>
            <CardTitle className="font-display text-lg">Plan mix</CardTitle>
            <p className="text-xs text-muted">Subscription statuses</p>
          </CardHeader>
          <CardContent className="flex h-72 flex-col items-center justify-center gap-3">
            {planPie.length === 0 ? (
              <p className="text-sm text-muted">No subscriptions yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={planPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      animationDuration={900}
                    >
                      {planPie.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill || PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2">
                  {planPie.map((p) => (
                    <Badge
                      key={p.name}
                      className="bg-foam text-ocean-deep ring-1 ring-border"
                    >
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ background: p.fill }}
                      />
                      {p.name} {p.value}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </MotionPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MotionPanel delay={0.16}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">
                Payment ledger
              </CardTitle>
              <p className="text-xs text-muted">
                All statuses · pending is not revenue
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <AnimatedList
              empty="No payments yet"
              items={data.recentPayments.map((p) => ({
                key: p.id,
                title: p.description,
                subtitle: `${shortId(p.reference)} · ${shortId(p.userId)}`,
                meta: p.amountFormatted,
                badge: p.status,
                badgeClass: statusTone(p.status),
              }))}
            />
          </CardContent>
        </MotionPanel>

        <MotionPanel delay={0.2} id="ai">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Top AI travelers
            </CardTitle>
            <p className="text-xs text-muted">
              {data.kpis.aiCallsThisMonth.toLocaleString()} calls · {data.period}
            </p>
          </CardHeader>
          <CardContent>
            <AnimatedList
              empty="No AI usage this month"
              items={data.topAiUsers.map((u) => ({
                key: u.userId,
                title: shortId(u.userId),
                subtitle: u.lastSource ?? "guide",
                meta: `${u.count} calls`,
                badge: formatWhen(u.updatedAt),
                badgeClass:
                  "bg-[color-mix(in_oklab,var(--aqua)_12%,transparent)] text-ocean",
              }))}
            />
          </CardContent>
        </MotionPanel>
      </div>

      <MotionPanel delay={0.24} id="pulse">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display text-lg">Product pulse</CardTitle>
            <p className="text-xs text-muted">
              analytics_events · {data.kpis.eventsSampled} sampled
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-gold" />
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-wrap gap-2">
            {data.kpis.paymentsFailed > 0 ? (
              <Badge className="bg-coral/15 text-coral">
                <XCircle className="mr-1 h-3 w-3" />
                {data.kpis.paymentsFailed} failed
              </Badge>
            ) : null}
            {data.eventBreakdown.length === 0 ? (
              <p className="text-sm text-muted">No event types yet</p>
            ) : (
              data.eventBreakdown.map((e) => (
                <Badge
                  key={e.type}
                  className="bg-foam text-ocean-deep ring-1 ring-border"
                >
                  {e.type}
                  <span className="ml-1.5 text-aqua">{e.count}</span>
                </Badge>
              ))
            )}
          </div>
          <AnimatedList
            empty="Waiting for product events"
            dense
            items={data.recentEvents.map((e, i) => ({
              key: `${e.created_at}-${i}`,
              title: e.event_type,
              subtitle: formatWhen(e.created_at),
              meta: "",
              badge: "event",
              badgeClass: "bg-foam text-ocean-deep",
            }))}
          />
        </CardContent>
      </MotionPanel>
    </div>
  );
}

function MotionPanel({
  children,
  className,
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="h-full border-border/80 bg-surface/95 shadow-[0_18px_40px_-28px_rgba(6,42,46,0.4)]">
        {children}
      </Card>
    </motion.div>
  );
}

function AnimatedList({
  items,
  empty,
  dense,
}: {
  items: {
    key: string;
    title: string;
    subtitle: string;
    meta: string;
    badge: string;
    badgeClass?: string;
  }[];
  empty: string;
  dense?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{empty}</p>;
  }

  return (
    <ul
      ref={ref}
      className={cn("space-y-0", dense && "max-h-72 overflow-auto")}
    >
      {items.map((item, i) => (
        <motion.li
          key={item.key}
          initial={{ opacity: 0, x: -14 }}
          animate={inView ? { opacity: 1, x: 0 } : undefined}
          transition={{ delay: 0.035 * i, duration: 0.35 }}
        >
          {i > 0 ? <Separator className="my-0" /> : null}
          <div className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ocean-deep">
                {item.title}
              </p>
              <p className="truncate text-xs text-muted">{item.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              {item.meta ? (
                <p className="text-sm font-semibold text-ocean-deep">
                  {item.meta}
                </p>
              ) : null}
              <Badge
                className={cn(
                  "mt-0.5 font-normal capitalize",
                  item.badgeClass,
                )}
              >
                {item.badge}
              </Badge>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-2xl bg-foam" />
      <div className="h-28 animate-pulse rounded-xl bg-foam" />
      <div className="h-72 animate-pulse rounded-xl bg-foam" />
    </div>
  );
}
