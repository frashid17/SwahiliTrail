import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  CalendarDays,
  Languages,
  MapPin,
  PawPrint,
  Route,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COAST_IMAGES as img } from "@/lib/data/coast-images";
import { placePhoto } from "@/lib/data/place-photo-urls";

const primary = [
  {
    href: "/planner",
    title: "Trip Planner",
    description: "Build multi-day Kenya itineraries with a rough KES total.",
    icon: Route,
    image: img.beachTropical,
    cta: "Plan days",
    featured: true,
  },
  {
    href: "/guide",
    title: "Guide",
    description: "Ask about roads, food, parks, and phrases in six languages.",
    icon: Languages,
    image: placePhoto("old-town", img.oldTownStreet),
    cta: "Ask anything",
  },
  {
    href: "/hotels",
    title: "Stay & Eat",
    description: "Match hotels and meals to budget, vibe, and region.",
    icon: BedDouble,
    image: placePhoto("tamarind-mombasa", img.seafoodDining),
    cta: "Find a match",
  },
] as const;

const secondary = [
  {
    href: "/explore",
    title: "Explore",
    description: "Places across Kenya",
    icon: MapPin,
  },
  {
    href: "/events",
    title: "Events",
    description: "What's on this week",
    icon: CalendarDays,
  },
  {
    href: "/wildlife",
    title: "Wildlife",
    description: "Parks & reserves",
    icon: PawPrint,
  },
  {
    href: "/analytics",
    title: "Analytics",
    description: "Visitor pulse",
    icon: BarChart3,
  },
] as const;

const corridors = [
  {
    href: "/wildlife",
    label: "Safari",
    line: "Mara · Tsavo · Amboseli",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=75",
  },
  {
    href: "/explore",
    label: "Nairobi",
    line: "City base & day trips",
    image: placePhoto("hola-ibs", img.mamaNginaWaterfront),
  },
  {
    href: "/explore",
    label: "Coast",
    line: "Nyali · Diani · Old Town",
    image: img.nyaliBeach,
  },
] as const;

export default async function DashboardPage() {
  await auth.protect();
  const user = await currentUser();
  const name = user?.firstName ?? "Traveler";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Habari za asubuhi" : hour < 17 ? "Habari za mchana" : "Habari za jioni";

  return (
    <div className="w-full overflow-x-clip bg-background">
      {/* Immersive welcome */}
      <section className="relative min-h-[min(52vh,28rem)] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=2200&q=80"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[50%_40%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/75 to-brand-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-transparent to-brand-deep/40" />

        <div className="relative z-[1] mx-auto flex min-h-[min(52vh,28rem)] max-w-[90rem] flex-col justify-end px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:pb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            {greeting}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[0.95] tracking-tight text-white">
            Karibu, {name}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/75 sm:text-base">
            Your Kenya workspace - plan days, match stays, and ask the guide
            without leaving the trail.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/planner" className="btn-solid">
              Continue planning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/trips" className="btn-ghost">
              My trips
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
        {/* Primary tools - bento */}
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          {primary.map((tool, i) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={
                i === 0
                  ? "group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2 lg:min-h-[22rem]"
                  : "group relative flex min-h-[11rem] flex-col justify-end overflow-hidden rounded-2xl"
              }
            >
              <Image
                src={tool.image}
                alt=""
                fill
                unoptimized
                sizes={i === 0 ? "(max-width: 1024px) 100vw, 66vw" : "33vw"}
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/50 to-transparent" />
              <div className="relative z-[1] p-5 sm:p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                  <tool.icon className="h-5 w-5" />
                </span>
                <h2
                  className={
                    i === 0
                      ? "mt-4 font-display text-3xl font-semibold text-white sm:text-4xl"
                      : "mt-3 font-display text-xl font-semibold text-white"
                  }
                >
                  {tool.title}
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-white/70">
                  {tool.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                  {tool.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-10">
          <Badge
            variant="outline"
            className="h-auto border-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold outline outline-border"
          >
            Quick open
          </Badge>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {secondary.map((item) => (
              <Link key={item.href} href={item.href} className="group block">
                <Card className="h-full border-border py-0 transition hover:border-gold/35 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 px-4 py-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-deep text-on-brand">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold text-card-foreground">
                        {item.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-coral" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Corridors */}
        <div className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                Jump in
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ocean-deep sm:text-3xl">
                Where next?
              </h2>
            </div>
            <Link
              href="/explore"
              className="hidden text-sm font-semibold text-coral hover:text-ocean sm:inline"
            >
              All places →
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {corridors.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group relative flex min-h-[11rem] items-end overflow-hidden rounded-2xl"
              >
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/30 to-transparent" />
                <div className="relative z-[1] p-5">
                  <p className="font-display text-2xl font-semibold text-white">
                    {c.label}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{c.line}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
