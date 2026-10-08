"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CoastEventsSection } from "@/components/home/coast-events-section";
import { CoastNowBar } from "@/components/home/coast-now-bar";
import { ThingsToDoSection } from "@/components/home/things-to-do-section";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { DESTINATION } from "@/lib/destination";

const features = [
  {
    href: "/planner",
    n: "01",
    title: "Trip Planner",
    copy: "Multi-day routes for Nairobi, safari circuits, the Rift, or the coast — with a rough KES budget.",
  },
  {
    href: "/hotels",
    n: "02",
    title: "Stay & Eat",
    copy: "Lodging and meals filtered by budget and vibe across Kenya’s main travel regions.",
  },
  {
    href: "/attractions",
    n: "03",
    title: "Attractions",
    copy: "Culture, coast, and city stops. Save what you want into a trip list.",
  },
  {
    href: "/wildlife",
    n: "04",
    title: "Wildlife & nature",
    copy: "Parks and nature days from the Mara to Tsavo and the coast.",
  },
  {
    href: "/guide",
    n: "05",
    title: "Multilingual Guide",
    copy: "Ask about roads, food, lodging, or phrases. Replies in six languages.",
  },
  {
    href: "/analytics",
    n: "06",
    title: "Destination Analytics",
    copy: "Visitor trends for planners, hosts, and county teams.",
  },
];

export default function HomePage() {
  return (
    <div className="paper-grain coastal-grid">
      <section className="relative min-h-[min(88vh,860px)] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
        >
          <Image
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2400&q=80"
            alt="Elephants crossing the savannah at golden hour"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_40%]"
          />
        </motion.div>

        {/* Legibility only — keep the photo readable, not a dark SaaS veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/15" />

        <div className="relative mx-auto flex min-h-[min(88vh,860px)] max-w-[90rem] flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-10">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.92] tracking-tight text-white"
            >
              Swahili Trail
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-4 max-w-lg text-lg font-medium leading-snug text-white/95 sm:text-xl"
            >
              {DESTINATION.tagline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14 }}
              className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base"
            >
              {DESTINATION.supportingLine}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link href="/planner" className="btn-solid">
                Plan a trip
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/explore" className="btn-ghost">
                Explore places
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-surface">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Conditions
            </p>
            <p className="mt-1 text-sm text-ocean-deep">
              Weather for where you&apos;re headed — pick a region or use your
              location.
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3">
            <KenyaLocationFilter
              variant="select"
              label="Show for"
              className="[&_select]:rounded-md"
            />
            <CoastNowBar variant="light" className="sm:max-w-none" />
          </div>
        </div>
      </section>

      <ThingsToDoSection />

      <CoastEventsSection />

      <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="max-w-xl"
        >
          <h2 className="font-display text-3xl tracking-tight text-ocean-deep sm:text-4xl">
            Tools for the road
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            Six ways to plan and get around Kenya — no dashboard clutter.
          </p>
        </motion.div>

        <div className="mt-12 divide-y divide-border/80 border-y border-border/80">
          {features.map((feature, index) => (
            <motion.div
              key={feature.href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <Link
                href={feature.href}
                className="group grid gap-3 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-8"
              >
                <span className="font-display text-sm text-muted tabular-nums">
                  {feature.n}
                </span>
                <div>
                  <h3 className="font-display text-xl text-ocean-deep transition group-hover:text-ocean sm:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                    {feature.copy}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-coral opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=2000&q=80"
            alt="Dhow on the Kenyan coast at dusk"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-brand-deep/75" />
        </div>
        <div className="relative mx-auto grid max-w-[90rem] gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-end md:py-20 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="font-display text-3xl tracking-tight text-on-brand sm:text-4xl">
              For travelers — and the places that host them.
            </h2>
            <p className="mt-4 max-w-lg text-on-brand/80 leading-relaxed">
              Plan city, safari, Rift, and coast trips. Hosts and county teams
              get a clearer view of what people ask for and where they go.
            </p>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="space-y-2.5 text-sm text-on-brand/85"
          >
            <li className="border-l-2 border-coral pl-3">
              Itineraries with budgets in KES
            </li>
            <li className="border-l-2 border-coral/70 pl-3">
              Hotels, meals, and wildlife days
            </li>
            <li className="border-l-2 border-coral/50 pl-3">
              A local guide in six languages
            </li>
            <li className="border-l-2 border-white/25 pl-3 text-on-brand/65">
              Save trips and pick up anywhere
            </li>
          </motion.ul>
        </div>
      </section>
    </div>
  );
}
