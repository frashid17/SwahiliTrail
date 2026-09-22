"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Plus,
  Trees,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { PlaceReviews } from "@/components/place-reviews";
import { getWildlifeSite } from "@/lib/data/wildlife";
import {
  addTripItem,
  loadTripCart,
  removeTripItem,
} from "@/lib/trip-cart";

export default function WildlifeDetailPage() {
  const params = useParams<{ id: string }>();
  const site = getWildlifeSite(params.id);
  const { userId, isLoaded } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId || !site) return;
    setSaved(
      loadTripCart(userId).some(
        (c) => c.type === "wildlife" && c.id === site.id,
      ),
    );
  }, [isLoaded, userId, site]);

  if (!site) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Wildlife site not found.</p>
        <Link href="/wildlife" className="mt-4 inline-block text-ocean">
          Back to wildlife
        </Link>
      </div>
    );
  }

  function toggle() {
    if (!userId) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/wildlife/${site!.id}`)}`;
      return;
    }
    if (saved) {
      removeTripItem(userId, site!.id, "wildlife");
      setSaved(false);
    } else {
      addTripItem(userId, {
        id: site!.id,
        type: "wildlife",
        name: site!.name,
        area: site!.region,
        estCostKes: site!.estEntryKes,
      });
      setSaved(true);
    }
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="relative h-[42vh] min-h-72 w-full overflow-hidden sm:h-[48vh]">
        <Image
          src={site.imageUrl}
          alt={site.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/45 to-brand-deep/25" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[90rem] px-4 pb-8 sm:px-6 lg:px-10">
          <Link
            href="/wildlife"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Wildlife
          </Link>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aqua">
            <Trees className="h-3.5 w-3.5" />
            {site.type} · {site.region}
          </p>
          <h1 className="mt-1 font-display text-4xl text-white sm:text-5xl">
            {site.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <FadeIn>
          <p className="text-lg text-muted leading-relaxed">{site.about}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {site.highlights.map((h) => (
              <span
                key={h}
                className="rounded-full bg-foam px-3 py-1.5 text-xs font-medium text-ocean-deep"
              >
                {h}
              </span>
            ))}
          </div>
          <ul className="mt-6 space-y-2">
            {site.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ocean-deep shadow-sm"
              >
                {tip}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">{site.bookingTip}</p>
          <div className="mt-10">
            <PlaceReviews
              placeType="wildlife"
              placeId={site.id}
              placeName={site.name}
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.08} className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm text-muted">
              ~KES {site.estEntryKes.toLocaleString()} entry · ~
              {site.durationHours}h ·{" "}
              {site.dayTripFromMombasa ? "Day-trip possible" : "Best overnight"}
            </p>
            <p className="mt-2 text-sm text-muted">{site.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggle}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  saved ? "bg-ocean text-white" : "bg-coral text-white"
                }`}
              >
                {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saved ? "Saved to trip" : "Add to trip"}
              </button>
              <a
                href={site.kwsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep"
              >
                KWS info
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
