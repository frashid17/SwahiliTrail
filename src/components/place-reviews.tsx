"use client";

import { Camera, Loader2, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  addPlaceReview,
  averageRating,
  fileToReviewImage,
  loadReviewsForPlace,
  type PlaceReview,
} from "@/lib/place-reviews";
import { cn } from "@/lib/utils";

export function PlaceReviews({
  placeType,
  placeId,
  placeName,
}: {
  placeType: "attraction" | "wildlife" | "explore";
  placeId: string;
  placeName: string;
}) {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setReviews(loadReviewsForPlace(placeType, placeId));
  }, [placeType, placeId]);

  async function onFile(file: File | null) {
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    try {
      setError(null);
      setImageDataUrl(await fileToReviewImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add photo");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !text.trim()) {
      setError("Add your name and a short review.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = addPlaceReview({
        placeType,
        placeId,
        author: author.trim().slice(0, 40),
        rating,
        text: text.trim().slice(0, 600),
        imageDataUrl: imageDataUrl ?? undefined,
      });
      setReviews(next);
      setText("");
      setImageDataUrl(null);
      setRating(5);
      setOk("Thanks - your review is live.");
    } finally {
      setBusy(false);
    }
  }

  const avg = averageRating(reviews);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
            Traveler reviews
          </p>
          <h2 className="mt-1 font-display text-3xl text-ocean-deep">
            What visitors say
          </h2>
        </div>
        {reviews.length > 0 ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-foam px-3 py-1.5 text-sm font-semibold text-ocean-deep">
            <Star className="h-4 w-4 fill-coral text-coral" />
            {avg} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <p className="text-sm text-muted">
          Rate {placeName} and share a tip for the next traveler.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-ocean-deep">Your name</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2"
              placeholder="e.g. Amina"
              maxLength={40}
            />
          </label>
          <div className="text-sm">
            <span className="font-medium text-ocean-deep">Rating</span>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-lg p-1 transition hover:scale-105"
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      n <= rating
                        ? "fill-coral text-coral"
                        : "text-muted/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="mt-3 block text-sm">
          <span className="font-medium text-ocean-deep">Your review</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={600}
            className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2"
            placeholder="Best time to go, what to expect, family tips…"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-foam px-4 py-2 text-sm font-semibold text-ocean-deep">
            <Camera className="h-4 w-4 text-aqua" />
            Add photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {imageDataUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Review preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post review
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        {ok ? <p className="mt-2 text-sm text-aqua">{ok}</p> : null}
      </form>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border bg-foam/40 px-5 py-8 text-center text-sm text-muted">
            No reviews yet - be the first to rate this place.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
            >
              <div className="grid sm:grid-cols-[1fr_auto]">
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ocean-deep">
                      {review.author}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-coral text-coral"
                        />
                      ))}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {review.text}
                  </p>
                </div>
                {review.imageDataUrl ? (
                  <div className="relative min-h-36 w-full sm:w-44">
                    <Image
                      src={review.imageDataUrl}
                      alt={`Photo from ${review.author}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="176px"
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
