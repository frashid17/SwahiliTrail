"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  CreditCard,
  Hourglass,
  RefreshCw,
  Settings,
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
import {
  AdminSettingsPanel,
  AiControlList,
  PaymentControlList,
  PulseControls,
  SubscriberControlList,
} from "@/components/admin/admin-controls";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { Marquee } from "@/components/shadcn-space/radix/animations/marquee";
import { DynamicButton } from "@/components/motion/dynamic-button";
import { ScrambleText } from "@/components/motion/scramble-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMIN_SECTION_META,
  type AdminSection,
} from "@/lib/admin/sections";
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
  subscribers: {
    userId: string;
    email: string | null;
    status: string;
    periodEnd: string | null;
    updatedAt: string;
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

export function AdminDashboard({
  section = "overview",
}: {
  section?: AdminSection;
}) {
  const { goTo } = useAdminNav();
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
  const sectionMeta = ADMIN_SECTION_META[section];

  const hero = (
    <motion.div
      key={`hero-${section}`}
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
            <ScrambleText>
              {section === "overview"
                ? "Kenya travel console"
                : sectionMeta.title}
            </ScrambleText>
          </h2>
          <p className="mt-2 text-sm text-muted">
            {section === "overview" ? data.note : sectionMeta.description}
          </p>
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
  );

  const kpiBar = (
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
  );

  const pendingBanner =
    pending.length > 0 ? (
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
    ) : null;

  const eventMarquee =
    data.recentEvents.length > 0 ? (
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-brand-deep py-3 text-on-brand">
        <Marquee pauseOnHover className="[--duration:40s]">
          {data.recentEvents.map((e, i) => (
            <span
              key={`${e.created_at}-${i}`}
              className="mx-4 inline-flex items-center gap-2 text-xs"
            >
              <Activity className="h-3 w-3 text-gold" />
              <span className="font-semibold text-gold">{e.event_type}</span>
              <span className="text-on-brand/55">
                {formatWhen(e.created_at)}
              </span>
            </span>
          ))}
        </Marquee>
      </div>
    ) : null;

  const revenueChart = (
    <MotionPanel delay={0.08}>
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
  );

  const planMix = (
    <MotionPanel delay={0.12}>
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
  );

  const jumpCards = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(
        [
          ["revenue", "Reconcile & ledger controls", CreditCard],
          ["subscribers", "Grant / extend / revoke Plus", Users],
          ["ai", "Reset traveler AI quotas", Sparkles],
          ["pulse", "Inspect & purge events", Activity],
          ["settings", "Platform toggles & health", Settings],
        ] as const
      ).map(([id, blurb, Icon], index) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * index }}
        >
          <button
            type="button"
            onClick={() => goTo(id)}
            className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-aqua/40 hover:shadow-md"
          >
            <Icon className="h-4 w-4 text-aqua" />
            <p className="mt-2 text-sm font-semibold text-ocean-deep">
              {ADMIN_SECTION_META[id].label}
            </p>
            <p className="mt-0.5 text-xs text-muted">{blurb}</p>
          </button>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {hero}

      {section === "overview" ? (
        <>
          {pendingBanner}
          {kpiBar}
          {eventMarquee}
          {jumpCards}
        </>
      ) : null}

      {section === "revenue" ? (
        <>
          {pendingBanner}
          <div className="grid gap-4 sm:grid-cols-3">
            {barStats.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
              >
                <Card className="border-border/80 bg-surface/95">
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div>
                      <p className="text-sm text-muted">{item.title}</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-ocean-deep">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-muted">{item.hint}</p>
                    </div>
                    <item.icon className="h-4 w-4 text-aqua" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {revenueChart}
          <PaymentControlList
            payments={data.recentPayments}
            onDone={() => void load()}
          />
        </>
      ) : null}

      {section === "subscribers" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/80 bg-surface/95">
              <CardContent className="p-5">
                <p className="text-sm text-muted">Trail Plus active</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ocean-deep">
                  {data.kpis.activeSubscribers}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {data.planMix.past_due} past due · {data.planMix.cancelled}{" "}
                  cancelled
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-surface/95">
              <CardContent className="p-5">
                <p className="text-sm text-muted">Inactive</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ocean-deep">
                  {data.planMix.inactive}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Free / expired seats in the mix
                </p>
              </CardContent>
            </Card>
          </div>
          {planMix}
          <SubscriberControlList
            subscribers={data.subscribers ?? []}
            onDone={() => void load()}
          />
        </>
      ) : null}

      {section === "ai" ? (
        <>
          <Card className="border-border/80 bg-surface/95">
            <CardContent className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div>
                <p className="text-sm text-muted">AI calls this month</p>
                <p className="mt-1 font-display text-3xl font-semibold text-ocean-deep">
                  {data.kpis.aiCallsThisMonth.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted">Period {data.period}</p>
              </div>
              <Sparkles className="h-5 w-5 text-gold" />
            </CardContent>
          </Card>
          <AiControlList
            users={data.topAiUsers}
            period={data.period}
            onDone={() => void load()}
          />
        </>
      ) : null}

      {section === "pulse" ? (
        <>
          {eventMarquee}
          <div className="mb-1 flex flex-wrap gap-2">
            {data.kpis.paymentsFailed > 0 ? (
              <Badge className="bg-coral/15 text-coral">
                <XCircle className="mr-1 h-3 w-3" />
                {data.kpis.paymentsFailed} failed payments
              </Badge>
            ) : null}
            {data.eventBreakdown.map((e) => (
              <Badge
                key={e.type}
                className="bg-foam text-ocean-deep ring-1 ring-border"
              >
                {e.type}
                <span className="ml-1.5 text-aqua">{e.count}</span>
              </Badge>
            ))}
          </div>
          <PulseControls
            events={data.recentEvents}
            onDone={() => void load()}
          />
        </>
      ) : null}

      {section === "settings" ? <AdminSettingsPanel /> : null}
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

function AdminSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-2xl bg-foam" />
      <div className="h-28 animate-pulse rounded-xl bg-foam" />
      <div className="h-72 animate-pulse rounded-xl bg-foam" />
    </div>
  );
}
