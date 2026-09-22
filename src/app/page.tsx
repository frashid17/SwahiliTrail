"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BedDouble,
  Languages,
  MapPin,
  Sparkles,
  ArrowRight,
  Trees,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TideBand } from "@/components/coastal-accents";
import { CoastEventsSection } from "@/components/home/coast-events-section";
import { CoastNowBar } from "@/components/home/coast-now-bar";
import { ThingsToDoSection } from "@/components/home/things-to-do-section";

const features = [
  {
    href: "/planner",
    title: "AI Trip Planner",
    copy: "Multi-day coast itineraries with stay prefs, activities, and a damage cost estimate.",
    icon: Sparkles,
  },
  {
    href: "/hotels",
    title: "Stay & Eat",
    copy: "Match hotels and restaurants across Nyali, Old Town, Diani, and the waterfront.",
    icon: BedDouble,
  },
  {
    href: "/attractions",
    title: "Attractions",
    copy: "Browse what to do - Fort Jesus, beaches, culture - and save favorites to your trip.",
    icon: MapPin,
  },
  {
    href: "/wildlife",
    title: "Kenya Wildlife",
    copy: "Shimba Hills, Tsavo, marine parks, and other KWS experiences from Mombasa.",
    icon: Trees,
  },
  {
    href: "/guide",
    title: "Multilingual Guide",
    copy: "Ask anything about Fort Jesus, ferries, food, or Swahili phrases - in six languages.",
    icon: Languages,
  },
  {
    href: "/analytics",
    title: "Tourism Analytics",
    copy: "Live-feel dashboards for visitor trends, attractions, and sentiment themes.",
    icon: BarChart3,
  },
];

export default function HomePage() {
  return (
    <div className="coastal-grid">
      <section className="relative min-h-[min(92vh,920px)] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 14, ease: "easeOut" }}
        >
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80"
            alt="Sunlit tropical coastline and turquoise ocean"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_40%]"
          />
        </motion.div>

        {/* brand-deep stays dark in both themes — ocean-deep flips light in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/95 via-brand-deep/78 to-brand-deep/40 dark:from-brand-deep/97 dark:via-brand-deep/88 dark:to-brand-deep/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-transparent to-brand-deep/50 dark:from-brand-deep/95 dark:to-brand-deep/60" />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/45" />
        <div className="coastal-shimmer absolute inset-0 opacity-40 mix-blend-soft-light dark:opacity-25" />
        <div className="horizon-glow pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-aqua/25 to-transparent dark:from-aqua/15" />

        <div className="relative mx-auto flex min-h-[min(88vh,860px)] max-w-6xl flex-col justify-center px-4 pb-44 pt-28 sm:px-6 sm:pb-40 md:pt-24">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-5xl leading-[0.95] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Swahili Trail
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-4 max-w-2xl text-xl font-medium leading-snug text-white/95 drop-shadow-md sm:mt-5 sm:text-2xl md:text-3xl"
            >
              Redesign the coast with intelligent tourism.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              Plan itineraries, match hotels, chat with a multilingual guide,
              and read tourism analytics - built for AI & Digital Tourism Day at
              Swahilipot Hub.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-coral/30 transition hover:brightness-110"
              >
                Plan my trip
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trips"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                My trips
              </Link>
            </motion.div>

            {/* Soft pulse — presence without clutter */}
            <motion.div
              aria-hidden
              className="mt-10 h-px w-24 origin-left bg-gradient-to-r from-aqua to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
        </div>

        <TideBand className="absolute inset-x-0 top-[52%] z-[2] h-16 opacity-100 sm:top-[50%] md:top-[48%]" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="absolute inset-x-0 bottom-5 z-[3] px-4 sm:bottom-8 sm:px-6 md:bottom-10 md:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <CoastNowBar />
          </div>
        </motion.div>
      </section>

      <ThingsToDoSection />

      <CoastEventsSection />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aqua">
            Ways AI reshapes the visit
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl text-ocean-deep sm:text-4xl">
            One coastal companion for travelers and destination teams.
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <Link href={feature.href} className="group block">
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ocean text-white transition group-hover:scale-105 group-hover:bg-brand-deep">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-ocean-deep transition group-hover:text-ocean">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-muted leading-relaxed">
                      {feature.copy}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-aqua">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border/60 bg-brand-deep">
        <div className="coastal-shimmer pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center md:py-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl text-on-brand sm:text-4xl">
              Built for Mombasa&apos;s digital tourism agenda.
            </h2>
            <p className="mt-4 max-w-xl text-on-brand/75 leading-relaxed">
              A student prototype for the County Government of Mombasa and the
              Mombasa Tourism Council - showing how AI can unlock better
              journeys, smarter stays, and clearer insight for stakeholders.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3 text-sm text-on-brand/80"
          >
            <p>
              Theme: Digital Agenda and Artificial Intelligence to Redesign
              Tourism
            </p>
            <p>Event: AI and Digital Tourism Day · 23 September 2026</p>
            <p>Venue: Swahilipot Hub Foundation, Mombasa</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
