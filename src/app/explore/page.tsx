"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import {
  EXPLORE_FILTERS,
  EXPLORE_PLACES,
  placesForCategory,
  type ExploreCategory,
} from "@/lib/data/explore-places";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [category, setCategory] = useState<ExploreCategory>("all");
  const { regionId, region } = useKenyaLocation();
  const items = useMemo(
    () => placesForCategory(category, regionId),
    [category, regionId],
  );

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
            Explore Kenya
          </p>
          <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
            Places worth your time
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Filter by region — Nanyuki, Nairobi, the coast, and more — then open
            a place for booking tips and reviews.
          </p>
        </FadeIn>

        <div className="mt-6">
          <KenyaLocationFilter />
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXPLORE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategory(filter.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                category === filter.id
                  ? "bg-brand-deep text-on-brand"
                  : "bg-surface text-muted hover:bg-sand",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">
          Showing {items.length} of {EXPLORE_PLACES.length} places
          {region ? ` in ${region.label}` : " across Kenya"}
        </p>

        {items.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-muted">
            No places in this region yet. Try All Kenya or another area.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((place, index) => (
              <StaggerItem key={place.id} index={index}>
                <Link
                  href={`/explore/${place.id}`}
                  className="group block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-aqua/35"
                >
                  <div className="relative h-48">
                    <Image
                      src={place.imageUrl}
                      alt={place.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/75 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-aqua">
                      {place.area} · {place.vibe}
                    </p>
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl text-ocean-deep">
                      {place.name}
                    </h2>
                    <p className="mt-2 text-sm text-muted">{place.blurb}</p>
                    <p className="mt-3 text-sm font-semibold text-aqua">
                      View details →
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
