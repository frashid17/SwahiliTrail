"use client";

import { ExternalLink, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlaceLivePayload } from "@/lib/place-live";

export function LivePlaceReviews({
  placeId,
  tripadvisorUrl,
  mapsUrl,
}: {
  placeId: string;
  tripadvisorUrl: string;
  mapsUrl: string;
}) {
  const [data, setData] = useState<PlaceLivePayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/places/${placeId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("fail");
        const json = (await res.json()) as PlaceLivePayload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
            Reviews from the web
          </p>
          <h2 className="mt-1 font-display text-3xl text-ocean-deep">
            Google & traveler sites
          </h2>
        </div>
        {data?.rating != null ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-foam px-3 py-1.5 text-sm font-semibold text-ocean-deep">
            <Star className="h-4 w-4 fill-coral text-coral" />
            {data.rating.toFixed(1)}
            {data.userRatingCount
              ? ` · ${data.userRatingCount.toLocaleString()} Google ratings`
              : null}
          </p>
        ) : null}
      </div>

      {data?.displayName && data.source === "google-places" ? (
        <p className="text-sm font-medium text-ocean-deep">
          Matched on Google: {data.displayName}
        </p>
      ) : null}
      <p className="text-sm text-muted">
        {error
          ? "Could not load live reviews right now."
          : (data?.note ?? "Loading Google Places reviews…")}
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={data?.googleMapsUri ?? mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ocean-deep"
        >
          Google Maps reviews
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href={tripadvisorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ocean-deep"
        >
          TripAdvisor
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {data?.websiteUri ? (
          <a
            href={data.websiteUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ocean-deep"
          >
            Official site
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {data?.source === "google-places" && data.reviews.length > 0 ? (
        <ul className="space-y-3">
          {data.reviews.map((review, i) => (
            <li
              key={`${review.author}-${i}`}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ocean-deep">{review.author}</p>
                <span className="inline-flex items-center gap-1 text-sm text-coral">
                  <Star className="h-3.5 w-3.5 fill-coral" />
                  {review.rating}
                </span>
                {review.relativeTime ? (
                  <span className="text-xs text-muted">{review.relativeTime}</span>
                ) : null}
              </div>
              {review.text ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {review.text}
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-muted/70">Via Google</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
