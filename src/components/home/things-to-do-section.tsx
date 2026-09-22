"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  EXPLORE_FILTERS,
  placesForCategory,
  type ExploreCategory,
} from "@/lib/data/explore-places";
import { cn } from "@/lib/utils";

export function ThingsToDoSection() {
  const [category, setCategory] = useState<ExploreCategory>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => placesForCategory(category), [category]);

  function scrollBy(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(360, el.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  return (
    <section className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-ocean-deep sm:text-4xl md:text-5xl">
            Top things to do
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            Filter by vibe - nightlife shows real clubs, bars, and restaurants.
            Tap any place for booking tips, maps, and live web reviews.
          </p>
        </div>
        <Link
          href="/explore"
          className="hidden text-sm font-semibold text-ocean-deep transition hover:text-ocean md:inline-flex md:items-center md:gap-1"
        >
          View all places
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXPLORE_FILTERS.map((filter) => {
            const active = filter.id === category;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCategory(filter.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-deep text-white"
                    : "bg-surface text-muted hover:bg-sand hover:text-ocean-deep",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-8">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/explore/${item.id}`}
              className="group relative h-[22rem] w-[min(78vw,17.5rem)] shrink-0 snap-start overflow-hidden rounded-2xl sm:h-[26rem] sm:w-72"
            >
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 78vw, 288px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-aqua">
                  {item.area} · {item.vibe}
                </p>
                <p className="mt-1 font-display text-xl text-white sm:text-2xl">
                  {item.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-white/75">
                  {item.blurb}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between md:flex">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="pointer-events-auto -ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-ocean-deep shadow-md backdrop-blur transition hover:border-aqua/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="pointer-events-auto -mr-2 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/95 text-ocean-deep shadow-md backdrop-blur transition hover:border-aqua/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
