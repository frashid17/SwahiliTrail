"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, ExternalLink, Plus, Trees } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoastalOrbs } from "@/components/coastal-accents";
import { FadeIn, StaggerItem } from "@/components/fade-in";
import { WILDLIFE_SITES } from "@/lib/data/wildlife";
import {
  addTripItem,
  loadTripCart,
  removeTripItem,
  type TripCartItem,
} from "@/lib/trip-cart";

export default function WildlifePage() {
  const { userId, isLoaded } = useAuth();
  const [cart, setCart] = useState<TripCartItem[]>([]);

  useEffect(() => {
    if (isLoaded && userId) setCart(loadTripCart(userId));
  }, [isLoaded, userId]);

  function isSaved(id: string) {
    return cart.some((c) => c.type === "wildlife" && c.id === id);
  }

  function toggle(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent("/wildlife")}`;
      return;
    }
    const site = WILDLIFE_SITES.find((w) => w.id === id);
    if (!site) return;
    if (isSaved(id)) {
      setCart(removeTripItem(userId, id, "wildlife"));
    } else {
      setCart(
        addTripItem(userId, {
          id: site.id,
          type: "wildlife",
          name: site.name,
          area: site.region,
          estCostKes: site.estEntryKes,
        }),
      );
    }
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
              <Trees className="h-4 w-4" />
              Kenya Wildlife Service
            </p>
            <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
              Parks, reserves & marine life
            </h1>
            <p className="mt-3 text-muted">
              Open a site for details and traveler reviews, or save it to your
              trip list for the AI Planner.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/trips"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-ocean-deep"
            >
              My Trips
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
            >
              Build safari + coast trip
            </Link>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {WILDLIFE_SITES.map((site, index) => {
            const saved = isSaved(site.id);
            return (
              <StaggerItem key={site.id} index={index}>
                <Link
                  href={`/wildlife/${site.id}`}
                  className="relative block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition hover:border-aqua/35"
                >
                  <CoastalOrbs className="opacity-30" />
                  <div className="grid sm:grid-cols-[14rem_1fr]">
                    <div className="relative min-h-44 sm:min-h-full">
                      <Image
                        src={site.imageUrl}
                        alt={site.name}
                        fill
                        className="object-cover"
                        sizes="224px"
                      />
                    </div>
                    <div className="relative p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                        {site.type} · {site.region}
                      </p>
                      <h2 className="mt-1 font-display text-2xl text-ocean-deep">
                        {site.name}
                      </h2>
                      <p className="mt-2 text-sm text-muted">{site.blurb}</p>
                      <p className="mt-3 text-xs text-muted">
                        ~KES {site.estEntryKes.toLocaleString()} entry · ~
                        {site.durationHours}h
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep">
                          View details
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggle(e, site.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                            saved
                              ? "bg-ocean text-white"
                              : "border border-border text-ocean-deep"
                          }`}
                        >
                          {saved ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          {saved ? "Saved" : "Add to trip"}
                        </button>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(site.kwsUrl, "_blank");
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ocean-deep"
                        >
                          KWS
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </div>
      </div>
    </div>
  );
}
