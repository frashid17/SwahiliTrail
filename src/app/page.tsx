"use client";

import { Show } from "@clerk/nextjs";
import { motion, useInView } from "motion/react";
import { ArrowDown, ArrowRight, Bath, BedDouble, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CorridorFan } from "@/components/motion/corridor-fan";
import { ScrambleText } from "@/components/motion/scramble-text";
import { TrailCta } from "@/components/trail/trail-cta";
import { TrailFaq } from "@/components/trail/trail-faq";
import { TrailFeatures } from "@/components/trail/trail-features";
import { TrailGallery } from "@/components/trail/trail-gallery";
import { Button } from "@/components/ui/button";
import { COAST_IMAGES } from "@/lib/data/coast-images";
import { DESTINATION } from "@/lib/destination";

const corridors = [
  {
    href: "/explore?region=nairobi",
    label: "Nairobi",
    line: "City base · parks · nights out",
    image:
      "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1600&q=75",
  },
  {
    href: "/explore?region=mara",
    label: "Safari country",
    line: "Mara · Tsavo · Amboseli",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=75",
  },
  {
    href: "/explore?region=nakuru",
    label: "Rift Valley",
    line: "Lakes · Hell’s Gate · highlands",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=75",
  },
  {
    href: "/explore?region=mombasa",
    label: "Swahili coast",
    line: "Diani · Old Town · dhow sunsets",
    image: COAST_IMAGES.nyaliBeach,
  },
];

const highlights = [
  { icon: BedDouble, label: "Stays matched" },
  { icon: Car, label: "Roads & transfers" },
  { icon: Bath, label: "Coast & safari" },
];

export default function HomePage() {
  const stripRef = useRef<HTMLDivElement>(null);
  const stripInView = useInView(stripRef, { once: true, amount: 0.35 });

  return (
    <div className="w-full overflow-x-clip bg-background">
      {/* Luxury full-bleed hero (hero-02 pattern, Trail content, no nested nav) */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=2200&q=80"
            alt="Dhow on the Kenyan coast at dusk"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="ken-burns object-cover object-[50%_45%]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-deep/92 via-brand-deep/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/85 via-transparent to-brand-deep/35" />
        <div className="pointer-events-none absolute inset-0 coastal-shimmer opacity-30 mix-blend-soft-light" />

        <div className="relative z-[2] mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-28 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="max-w-2xl text-white"
          >
            <p className="text-xs font-medium tracking-wide text-white/70">
              Kenya · coast to highlands
            </p>
            <p className="mt-3 font-display text-[clamp(3.5rem,12vw,7.5rem)] font-semibold leading-[0.88] tracking-tight">
              Swahili
              <span className="mt-1 block text-gold">
                <ScrambleText>Trail</ScrambleText>
              </span>
            </p>
            <h1 className="mt-6 max-w-md text-lg font-medium text-white/95 sm:text-xl">
              {DESTINATION.tagline}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70 sm:text-base">
              Plan safaris, city days, and coast weekends - with a map, a guide
              in six languages, and stays that fit your budget.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-auto rounded-full bg-white px-6 py-3.5 font-medium text-brand-deep hover:bg-white/90"
              >
                <Link href="/explore?region=mombasa">
                  Explore on the map
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto rounded-full border-white/40 bg-transparent px-6 py-3.5 text-white hover:bg-white/10"
              >
                <Link href="/planner">Start planning</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#corridors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="relative z-[2] mb-4 flex flex-col items-center gap-2 self-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55 transition hover:text-gold"
        >
          Enter Kenya
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </motion.a>

        <div
          ref={stripRef}
          className="relative z-[2] mt-auto w-full border-t border-white/10 bg-background"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-7 lg:px-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={stripInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.06 * index, duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  <item.icon
                    className="h-4 w-4 shrink-0 text-coral sm:h-5 sm:w-5"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={stripInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0"
            >
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                <ScrambleText>Free to start</ScrambleText>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trail Plus when you need more AI
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="corridors" className="bg-brand-deep">
        <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Four corridors
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight text-on-brand sm:text-4xl">
            Choose where the trail begins.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-on-brand/65">
            Thumb through the hand, then play a corridor into Explore - map
            filtered and ready.
          </p>
          <div className="mt-10 hidden sm:block">
            <CorridorFan cards={corridors} />
          </div>
        </div>
        <div className="flex flex-col sm:hidden">
          {corridors.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link
                href={c.href}
                className="group relative flex min-h-[42vw] items-end overflow-hidden"
              >
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/85 via-brand-deep/40 to-transparent" />
                <div className="relative z-[1] flex w-full items-end justify-between gap-4 px-4 py-8">
                  <div>
                    <p className="font-display text-3xl font-semibold text-white">
                      {c.label}
                    </p>
                    <p className="mt-2 text-sm text-white/70">{c.line}</p>
                  </div>
                  <span className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="hidden pb-10 sm:block" />
      </section>

      <TrailFeatures />
      <TrailGallery />

      <section className="relative min-h-[70vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=2000&q=75"
          alt="Kenya market street"
          fill
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-brand-deep/70" />
        <div className="relative z-[1] mx-auto flex min-h-[70vh] max-w-[90rem] flex-col justify-end px-4 py-16 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="max-w-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              Multilingual guide
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-5xl">
              Ask anything. Get Kenya answers.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
              Roads, matatus, meals, Swahili phrases - replies in English,
              Kiswahili, and more.
            </p>
            <Link href="/guide" className="btn-solid mt-8">
              Open the guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <TrailFaq />
      <TrailCta />

      <section className="border-t border-border bg-surface-soft/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted-foreground lg:px-8">
          <Show
            when="signed-in"
            fallback={
              <p>
                New here?{" "}
                <Link href="/sign-up" className="font-semibold text-foreground">
                  Create a free account
                </Link>{" "}
                to save trips and map pins.
              </p>
            }
          >
            <p>
              Welcome back -{" "}
              <Link href="/dashboard" className="font-semibold text-foreground">
                open your dashboard
              </Link>
              .
            </p>
          </Show>
          <Link href="/pricing" className="font-semibold text-coral">
            See Trail Plus →
          </Link>
        </div>
      </section>
    </div>
  );
}
