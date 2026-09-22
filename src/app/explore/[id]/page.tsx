"use client";

import {
  ArrowLeft,
  Clock,
  ExternalLink,
  MapPin,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FadeIn } from "@/components/fade-in";
import { LivePlaceReviews } from "@/components/live-place-reviews";
import { PlaceReviews } from "@/components/place-reviews";
import { getExplorePlace } from "@/lib/data/explore-places";

export default function ExplorePlacePage() {
  const params = useParams<{ id: string }>();
  const place = getExplorePlace(params.id);

  if (!place) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Place not found.</p>
        <Link href="/explore" className="mt-4 inline-block text-ocean">
          Back to explore
        </Link>
      </div>
    );
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="relative h-[42vh] min-h-72 w-full overflow-hidden sm:h-[48vh]">
        <Image
          src={place.imageUrl}
          alt={place.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All places
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-aqua">
            {place.area} · {place.vibe}
          </p>
          <h1 className="mt-1 font-display text-3xl text-white sm:text-5xl">
            {place.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        <FadeIn className="space-y-4">
          <p className="text-lg text-muted">{place.blurb}</p>
          <p className="leading-relaxed text-ocean-deep">{place.about}</p>
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foam px-3 py-1 text-xs font-medium text-ocean-deep"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
            <p className="inline-flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-aqua" />
              {place.hoursHint}
            </p>
            <p className="inline-flex items-start gap-2">
              <Wallet className="mt-0.5 h-4 w-4 text-aqua" />
              {place.priceHint}
            </p>
            <p className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-aqua" />
              <a
                href={place.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ocean"
              >
                Open in Maps <ExternalLink className="inline h-3 w-3" />
              </a>
            </p>
          </div>
        </FadeIn>

        <FadeIn className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-aqua">
            Visiting & booking
          </p>
          <p className="mt-2 text-ocean-deep leading-relaxed">
            {place.bookingHint}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {place.websiteUrl ? (
              <a
                href={place.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white"
              >
                Official site <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <a
              href={place.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep"
            >
              Directions
            </a>
          </div>
        </FadeIn>

        <LivePlaceReviews
          placeId={place.id}
          tripadvisorUrl={place.tripadvisorUrl}
          mapsUrl={place.mapsUrl}
        />

        <PlaceReviews
          placeType="explore"
          placeId={place.id}
          placeName={place.name}
        />
      </div>
    </div>
  );
}
