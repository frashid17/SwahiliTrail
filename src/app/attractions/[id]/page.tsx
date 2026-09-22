"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  Plus,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { PlaceReviews } from "@/components/place-reviews";
import { getAttraction } from "@/lib/data/attractions";
import {
  addTripItem,
  loadTripCart,
  removeTripItem,
} from "@/lib/trip-cart";

export default function AttractionDetailPage() {
  const params = useParams<{ id: string }>();
  const attraction = getAttraction(params.id);
  const { userId, isLoaded } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || !attraction) return;
    setSaved(
      loadTripCart(userId).some(
        (c) => c.type === "attraction" && c.id === attraction.id,
      ),
    );
  }, [isLoaded, userId, attraction]);

  if (!attraction) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Attraction not found.</p>
        <Link href="/attractions" className="mt-4 inline-block text-ocean">
          Back to attractions
        </Link>
      </div>
    );
  }

  function toggle() {
    if (!userId) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/attractions/${attraction!.id}`)}`;
      return;
    }
    if (saved) {
      removeTripItem(userId, attraction!.id, "attraction");
      setSaved(false);
    } else {
      addTripItem(userId, {
        id: attraction!.id,
        type: "attraction",
        name: attraction!.name,
        area: attraction!.area,
        estCostKes: attraction!.estCostKes,
      });
      setSaved(true);
    }
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="relative h-[42vh] min-h-72 w-full overflow-hidden sm:h-[48vh]">
        <Image
          src={attraction.imageUrl}
          alt={attraction.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/40 to-brand-deep/30" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[90rem] px-4 pb-8 sm:px-6 lg:px-10">
          <Link
            href="/attractions"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Attractions
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
            {attraction.category} · {attraction.area}
          </p>
          <h1 className="mt-1 font-display text-4xl text-white sm:text-5xl">
            {attraction.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <FadeIn>
          <p className="text-lg text-muted leading-relaxed">{attraction.about}</p>
          <ul className="mt-6 space-y-2">
            {attraction.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ocean-deep shadow-sm"
              >
                {tip}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <PlaceReviews
              placeType="attraction"
              placeId={attraction.id}
              placeName={attraction.name}
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.08} className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-aqua" />~
                {attraction.durationHours}h
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-aqua" />
                {attraction.estCostKes === 0
                  ? "Free / tip-based"
                  : `~KES ${attraction.estCostKes.toLocaleString()}`}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">{attraction.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggle}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  saved
                    ? "bg-ocean text-white"
                    : "bg-coral text-white"
                }`}
              >
                {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saved ? "Saved to trip" : "Add to trip"}
              </button>
              {attraction.websiteUrl ? (
                <a
                  href={attraction.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                >
                  Official info
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
