"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Circle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import {
  downloadIcs,
  googleCalendarUrl,
  planToIcs,
} from "@/lib/plan-export";
import { downloadTripPdf } from "@/lib/plan-pdf";
import {
  getSavedTrip,
  markTripComplete,
  markTripUpcoming,
  removeSavedTrip,
  tripEndDate,
  type SavedTrip,
} from "@/lib/saved-trips";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    setTrip(getSavedTrip(userId, params.id));
  }, [isLoaded, userId, params.id]);

  if (isLoaded && userId && !trip) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Trip not found.</p>
        <Link href="/trips" className="mt-4 inline-block font-semibold text-ocean">
          Back to My Trips
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="coastal-grid min-h-[40vh] flex items-center justify-center text-muted">
        Loading trip…
      </div>
    );
  }

  const end = tripEndDate(trip);
  const completed = trip.status === "completed";

  function toggleComplete() {
    if (!userId || !trip) return;
    const next = completed
      ? markTripUpcoming(userId, trip.id)
      : markTripComplete(userId, trip.id);
    setTrip(next.find((t) => t.id === trip.id) ?? null);
  }

  function downloadPdf() {
    if (!trip) return;
    const slug = trip.plan.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    downloadTripPdf(
      trip.plan,
      {
        startDate: trip.startDate,
        partySize: trip.partySize,
        transportLabel: trip.transportMode,
        status: trip.status,
      },
      `${slug || "mombasa-trip"}.pdf`,
    );
  }

  function remove() {
    if (!userId || !trip) return;
    removeSavedTrip(userId, trip.id);
    router.push("/trips");
  }

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ocean"
          >
            <ArrowLeft className="h-4 w-4" />
            My Trips
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                {trip.startDate} → {end.toISOString().slice(0, 10)} ·{" "}
                {trip.days} days
              </p>
              <h1 className="mt-1 font-display text-4xl text-ocean-deep">
                {trip.plan.title}
              </h1>
              <p
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  completed
                    ? "bg-ocean/20 text-ocean"
                    : "bg-coral/15 text-coral"
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                {completed ? "Completed" : "Upcoming"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleComplete}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ocean-deep"
              >
                {completed ? "Mark upcoming" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadIcs(
                    "swahili-trail-trip.ics",
                    planToIcs(trip.plan, new Date(trip.startDate)),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ocean-deep"
              >
                <Calendar className="h-3.5 w-3.5" />
                .ics
              </button>
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-coral"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>

          <p className="mt-4 text-muted leading-relaxed">{trip.plan.summary}</p>
          <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ocean-deep">
            <span className="font-semibold">Recommended stay:</span>{" "}
            {trip.plan.recommendedStay}
          </p>
        </FadeIn>

        {trip.plan.budgetBreakdown ? (
          <FadeIn delay={0.05} className="mt-6 rounded-3xl bg-brand-deep p-6 text-on-brand">
            <p className="text-sm text-aqua">Damage cost estimate</p>
            <p className="mt-1 text-3xl font-semibold text-aqua">
              ~KES {trip.plan.budgetBreakdown.totalKes.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-on-brand/75">
              {trip.plan.budgetBreakdown.notes}
            </p>
          </FadeIn>
        ) : null}

        <div className="mt-6 space-y-4">
          {trip.plan.days.map((day, i) => (
            <FadeIn key={day.day} delay={0.04 * i}>
              <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                    Day {day.day}
                  </p>
                  {day.estimatedDayCostKes != null ? (
                    <p className="text-xs text-muted">
                      ~KES {day.estimatedDayCostKes.toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <h2 className="mt-1 font-display text-xl text-ocean-deep">
                  {day.theme}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>
                    <strong className="text-ocean-deep">Morning:</strong>{" "}
                    {day.morning}
                  </li>
                  <li>
                    <strong className="text-ocean-deep">Afternoon:</strong>{" "}
                    {day.afternoon}
                  </li>
                  <li>
                    <strong className="text-ocean-deep">Evening:</strong>{" "}
                    {day.evening}
                  </li>
                  <li>
                    <strong className="text-ocean-deep">Food:</strong>{" "}
                    {day.foodTip}
                  </li>
                  <li>
                    <strong className="text-ocean-deep">Transport:</strong>{" "}
                    {day.transportTip}
                  </li>
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-5">
            <h3 className="font-display text-xl text-ocean-deep">Packing</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
              {trip.plan.packingTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5">
            <h3 className="font-display text-xl text-ocean-deep">
              Local etiquette
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
              {trip.plan.localEtiquette.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href={googleCalendarUrl(trip.plan, new Date(trip.startDate))}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex text-sm font-semibold text-ocean"
        >
          Add whole trip to Google Calendar →
        </a>
      </div>
    </div>
  );
}
