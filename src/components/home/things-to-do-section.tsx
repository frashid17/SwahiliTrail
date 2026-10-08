"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import {
  EXPLORE_FILTERS,
  placesForCategory,
  type ExploreCategory,
} from "@/lib/data/explore-places";
import { cn } from "@/lib/utils";

export function ThingsToDoSection() {
  const [category, setCategory] = useState<ExploreCategory>("all");
  const { regionId, region } = useKenyaLocation();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () => placesForCategory(category, regionId),
    [category, regionId],
  );

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
          <h2 className="font-display text-3xl tracking-tight text-ocean-deep sm:text-4xl">
            Places to start
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            Pick a region, then open a place for maps, booking tips, and
            reviews.
            {region ? ` Showing ${region.label}.` : ""}
          </p>
        </div>
        <Link
          href="/explore"
          className="hidden text-sm font-semibold text-coral transition hover:text-ocean md:inline-flex md:items-center md:gap-1"
        >
          View all places
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mt-6">
        <KenyaLocationFilter />
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXPLORE_FILTERS.map((filter) => {
          const active = filter.id === category;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategory(filter.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "border-coral text-ocean-deep"
                  : "border-transparent text-muted hover:text-ocean-deep",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="relative mt-8">
        {items.length === 0 ? (
          <p className="border border-border bg-surface px-5 py-8 text-center text-sm text-muted">
            No places in this region for that filter. Try All Kenya.
          </p>
        ) : (
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/explore/${item.id}`}
                className="group w-[min(78vw,17.5rem)] shrink-0 snap-start sm:w-72"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-md">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 78vw, 288px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    {item.area}
                  </p>
                  <p className="mt-1 font-display text-xl text-ocean-deep group-hover:text-ocean">
                    {item.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {item.blurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 hidden items-center gap-2 md:flex">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-ocean-deep transition hover:border-ocean/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-ocean-deep transition hover:border-ocean/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
