"use client";

import { useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  Circle,
  Download,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { downloadTripPdf } from "@/lib/plan-pdf";
import {
  markTripComplete,
  markTripUpcoming,
  removeSavedTrip,
  syncSavedTripsFromCloud,
  tripEndDate,
  type SavedTrip,
} from "@/lib/saved-trips";

export default function MyTripsPage() {
  const { userId, isLoaded } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void syncSavedTripsFromCloud(userId).then((trips) => {
      if (!cancelled) setTrips(trips);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  function remove(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    setTrips(removeSavedTrip(userId, id));
  }

  function toggleComplete(e: React.MouseEvent, trip: SavedTrip) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    setTrips(
      trip.status === "completed"
        ? markTripUpcoming(userId, trip.id)
        : markTripComplete(userId, trip.id),
    );
  }

  function download(e: React.MouseEvent, trip: SavedTrip) {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="coastal-grid min-h-[80vh]">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-aqua">
            My Trips
          </p>
          <h1 className="mt-2 font-display text-4xl text-ocean-deep sm:text-5xl">
            Your scheduled coast plans
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Open a trip to view the full itinerary. Mark complete anytime -
            trips auto-complete after the last day passes.
          </p>
          <Link
            href="/planner"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" />
            Build a new trip
          </Link>
        </FadeIn>

        {trips.length === 0 ? (
          <FadeIn delay={0.1} className="mt-12">
            <div className="rounded-3xl border border-dashed border-ocean/30 bg-surface/60 px-6 py-16 text-center text-muted">
              No saved trips yet. Generate a plan in the{" "}
              <Link href="/planner" className="font-semibold text-ocean">
                AI Planner
              </Link>{" "}
              and tap Add to My Trips.
            </div>
          </FadeIn>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {trips.map((trip, index) => {
              const completed = trip.status === "completed";
              const end = tripEndDate(trip);
              return (
                <FadeIn key={trip.id} delay={index * 0.05}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block rounded-3xl border border-border bg-surface p-6 shadow-sm transition hover:border-aqua/40 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                        {trip.startDate} → {end.toISOString().slice(0, 10)} ·{" "}
                        {trip.days} days
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          completed
                            ? "bg-ocean/15 text-ocean"
                            : "bg-coral/15 text-coral"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        {completed ? "Completed" : "Upcoming"}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl text-ocean-deep">
                      {trip.plan.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {trip.plan.summary}
                    </p>
                    {trip.plan.budgetBreakdown ? (
                      <p className="mt-3 text-sm font-semibold text-ocean">
                        ~KES{" "}
                        {trip.plan.budgetBreakdown.totalKes.toLocaleString()}{" "}
                        estimate
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-white">
                        View trip
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleComplete(e, trip)}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ocean-deep"
                      >
                        {completed ? "Mark upcoming" : "Mark complete"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => download(e, trip)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ocean-deep"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={(e) => remove(e, trip.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-coral"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
