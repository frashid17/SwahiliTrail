import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  Compass,
  Languages,
  MapPin,
  Sparkles,
  Sunrise,
  Trees,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const tools = [
  {
    href: "/planner",
    title: "AI Trip Planner",
    description:
      "Build a multi-day Mombasa itinerary with stay, activities, and a full damage cost estimate.",
    icon: Sparkles,
    accent: "from-teal-700 via-cyan-600 to-sky-400",
    cta: "Plan a trip",
  },
  {
    href: "/hotels",
    title: "Stay & Eat",
    description:
      "Match hotels and restaurants across Nyali, Old Town, Diani, and the waterfront.",
    icon: BedDouble,
    accent: "from-sky-800 via-teal-600 to-emerald-400",
    cta: "Find stays & food",
  },
  {
    href: "/attractions",
    title: "Attractions",
    description:
      "Explore Fort Jesus, beaches, culture stops, and add favorites to your trip list.",
    icon: MapPin,
    accent: "from-cyan-700 via-teal-500 to-sky-400",
    cta: "Browse attractions",
  },
  {
    href: "/wildlife",
    title: "Kenya Wildlife",
    description:
      "Shimba Hills, Tsavo, marine parks, and more KWS experiences from the coast.",
    icon: Trees,
    accent: "from-emerald-800 via-teal-600 to-lime-500",
    cta: "Explore wildlife",
  },
  {
    href: "/guide",
    title: "Multilingual Guide",
    description:
      "Ask about ferries, food, Fort Jesus, and Swahili phrases in six languages.",
    icon: Languages,
    accent: "from-cyan-800 via-teal-500 to-lime-400",
    cta: "Ask the guide",
  },
  {
    href: "/analytics",
    title: "Tourism Analytics",
    description:
      "Show visitor trends, attraction performance, and sentiment to stakeholders.",
    icon: BarChart3,
    accent: "from-blue-900 via-cyan-700 to-teal-400",
    cta: "View insights",
  },
];

const highlights = [
  {
    title: "Fort Jesus",
    detail: "UNESCO fort · Old Town",
    tip: "Go early for cooler alleys and clearer photos.",
  },
  {
    title: "Mama Ngina Waterfront",
    detail: "Sunset promenade",
    tip: "Best light an hour before sunset - food stalls open late.",
  },
  {
    title: "Nyali Beach",
    detail: "North coast swim day",
    tip: "Pair with Haller Park if you’re traveling with family.",
  },
];

const flow = [
  { step: "01", label: "Save places", href: "/attractions" },
  { step: "02", label: "Match a stay", href: "/hotels" },
  { step: "03", label: "Plan days", href: "/planner" },
  { step: "04", label: "Ask locally", href: "/guide" },
];

export default async function DashboardPage() {
  await auth.protect();
  const user = await currentUser();
  const name = user?.firstName ?? "Traveler";

  return (
    <div className="coastal-grid min-h-[80vh]">
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            className="object-cover object-[70%_35%] opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foam via-foam/92 to-foam/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-foam via-transparent to-foam/40" />
        </div>

        <div className="relative mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
                <Compass className="h-4 w-4" />
                Dashboard
              </p>
              <h1 className="mt-3 font-display text-4xl leading-tight text-ocean-deep sm:text-5xl lg:text-6xl">
                Karibu, {name}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">
                Your AI coastal workspace for Mombasa - plan the trip, find the
                stay, ask the guide, and brief stakeholders with analytics.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white shadow-md shadow-coral/25 transition hover:brightness-110"
              >
                Start planning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-5 py-3 text-sm font-semibold text-ocean-deep backdrop-blur transition hover:border-aqua/40"
              >
                Ask the guide
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-surface/75 px-4 py-3 backdrop-blur transition hover:border-aqua/40 hover:bg-surface"
              >
                <span className="font-display text-lg text-aqua">{item.step}</span>
                <span className="text-sm font-semibold text-ocean-deep group-hover:text-ocean">
                  {item.label}
                </span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted transition group-hover:translate-x-0.5 group-hover:text-aqua" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ocean-deep sm:text-3xl">
              Your tools
            </h2>
            <p className="mt-1 text-sm text-muted">
              Four AI surfaces for travelers and destination teams.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:-translate-y-1 hover:border-aqua/35 hover:shadow-lg"
            >
              <div className={`h-28 bg-gradient-to-br ${tool.accent}`} />
              <div className="flex flex-1 flex-col p-5">
                <span className="-mt-10 mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-ocean text-white shadow-md">
                  <tool.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl text-ocean-deep">
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {tool.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aqua">
                  {tool.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 text-aqua">
              <MapPin className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                Coastal picks
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl text-ocean-deep sm:text-3xl">
              Places worth opening with
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {highlights.map((spot) => (
                <div
                  key={spot.title}
                  className="rounded-2xl bg-foam px-4 py-4"
                >
                  <p className="font-display text-lg text-ocean-deep">
                    {spot.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-aqua">
                    {spot.detail}
                  </p>
                  <p className="mt-2 text-sm text-muted">{spot.tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-brand-deep p-6 text-on-brand sm:p-8">
            <Sunrise className="absolute -right-2 -top-2 h-28 w-28 text-aqua/20" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-aqua">
              Demo tip
            </p>
            <h2 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">
              Walk the flow for Digital Tourism Day
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-on-brand/75">
              Generate a 3-day itinerary, match a Nyali stay, ask the guide in
              Kiswahili, then open analytics for stakeholder storytelling.
            </p>
            <Link
              href="/planner"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Begin with the planner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
