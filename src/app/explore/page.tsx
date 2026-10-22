"use client";

import { LayoutGrid, Map as MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ExploreMapLazy } from "@/components/explore/explore-map-lazy";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import { KenyaLocationFilter } from "@/components/kenya-location-filter";
import {
  PageAtmosphere,
  PageEyebrow,
  PageTitle,
} from "@/components/page-atmosphere";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useKenyaLocation } from "@/hooks/use-kenya-location";
import {
  EXPLORE_FILTERS,
  EXPLORE_PLACES,
  placesForCategory,
  type ExploreCategory,
} from "@/lib/data/explore-places";
import { getKenyaRegion, ALL_KENYA_ID } from "@/lib/kenya-regions";
import { cn } from "@/lib/utils";

function ExploreContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<ExploreCategory>("all");
  const [view, setView] = useState<"map" | "grid">("grid");
  const { regionId, region, setRegionId } = useKenyaLocation();

  useEffect(() => {
    const fromUrl = searchParams.get("region");
    if (!fromUrl) return;
    if (fromUrl === ALL_KENYA_ID || getKenyaRegion(fromUrl)) {
      setRegionId(fromUrl);
    }
  }, [searchParams, setRegionId]);

  const items = useMemo(
    () => placesForCategory(category, regionId),
    [category, regionId],
  );

  return (
    <PageAtmosphere>
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <PageEyebrow>Explore Kenya</PageEyebrow>
          <PageTitle>Places on the map</PageTitle>
          <p className="mt-3 max-w-2xl text-muted">
            Filter by region, pan the map, open a pin, and save spots for your
            trip.
          </p>
        </FadeIn>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <KenyaLocationFilter />
          <div className="inline-flex rounded-full border border-border bg-surface p-1">
            <Button
              type="button"
              size="sm"
              variant={view === "map" ? "default" : "ghost"}
              className="h-9 rounded-full gap-1.5 px-4"
              onClick={() => setView("map")}
            >
              <MapIcon className="h-4 w-4" />
              Map
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "grid" ? "default" : "ghost"}
              className="h-9 rounded-full gap-1.5 px-4"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              List
            </Button>
          </div>
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-auto px-3 py-1 font-normal">
            {items.length} places
            {region ? ` · ${region.label}` : " · All Kenya"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            Tap a pin to save it for your trip
          </p>
        </div>

        {view === "map" ? (
          <div className="mt-6">
            <ExploreMapLazy places={items} />
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-muted">
            No places in this region yet. Try All Kenya or another area.
          </p>
        ) : view === "grid" ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((place, index) => (
              <StaggerItem key={place.id} index={index}>
                <Link href={`/explore/${place.id}`} prefetch={false}>
                  <Card className="group overflow-hidden border-border p-0 transition hover:border-aqua/35 hover:shadow-md">
                    <div className="relative h-48">
                      <Image
                        src={place.imageUrl}
                        alt={place.name}
                        fill
                        quality={65}
                        loading={index < 6 ? "eager" : "lazy"}
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 1280px) 50vw, 33vw"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/75 to-transparent" />
                      <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-aqua">
                        {place.area} · {place.vibe}
                      </p>
                    </div>
                    <CardContent className="p-5">
                      <h2 className="font-display text-2xl text-ocean-deep">
                        {place.name}
                      </h2>
                      <p className="mt-2 text-sm text-muted">{place.blurb}</p>
                      <p className="mt-3 text-sm font-semibold text-aqua">
                        View details →
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 9).map((place) => (
              <Link
                key={place.id}
                href={`/explore/${place.id}`}
                className="rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm transition hover:border-gold/35 hover:bg-foam"
              >
                <span className="font-semibold text-foreground">{place.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {place.area}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageAtmosphere>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[90rem] px-4 py-16 text-muted lg:px-10">
          Loading explore…
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
