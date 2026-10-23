"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { TripRefinePanel } from "@/components/trip/trip-refine-panel";
import { TripSharePanel } from "@/components/trip/trip-share-panel";
import {
  downloadIcs,
  googleCalendarUrl,
  planToIcs,
} from "@/lib/plan-export";
import {
  getSavedTrip,
  markTripComplete,
  markTripUpcoming,
  removeSavedTrip,
  syncSavedTripsFromCloud,
  tripEndDate,
  type SavedTrip,
} from "@/lib/saved-trips";
import {
  googleMapsDirectionsUrl,
  googleMapsMultiStopUrl,
  googleMapsSearchUrl,
} from "@/lib/maps-link";
import { asPlainText } from "@/lib/plan-normalize";
import { formatStopsSummary } from "@/lib/trip-stops";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setTrip(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    // Show local trip immediately so we never flash "not found" while cloud syncs.
    const local = getSavedTrip(userId, params.id);
    if (local) setTrip(local);

    void syncSavedTripsFromCloud(userId)
      .then((trips) => {
        if (cancelled) return;
        setTrip(trips.find((t) => t.id === params.id) ?? null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, params.id]);

  if (!isLoaded || !ready) {
    return (
      <div className="coastal-grid flex min-h-[40vh] items-center justify-center text-muted">
        Loading trip…
      </div>
    );
  }

  if (!userId || !trip) {
    return (
      <div className="coastal-grid mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Trip not found.</p>
        <Link href="/trips" className="mt-4 inline-block font-semibold text-ocean">
          Back to My Trips
        </Link>
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

  function remove() {
    if (!userId || !trip) return;
    removeSavedTrip(userId, trip.id);
    router.push("/trips");
  }

  return (
    <div className="paper-grain coastal-grid min-h-[80vh]">
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
            <div className="flex flex-wrap items-center gap-2">
              <TripSharePanel
                compact
                payload={{
                  plan: trip.plan,
                  startDate: trip.startDate,
                  partySize: trip.partySize,
                  transportMode: trip.transportMode,
                  companions: trip.companions,
                  budget: trip.budget,
                  tripId: trip.id,
                }}
              />
              <button
                type="button"
                onClick={toggleComplete}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ocean-deep"
              >
                {completed ? "Mark upcoming" : "Mark complete"}
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
          {trip.plan.stops && trip.plan.stops.length > 0 ? (
            <p className="mt-3 text-sm text-muted">
              Route: {formatStopsSummary(trip.plan.stops)}{" "}
              <a
                href={googleMapsMultiStopUrl(
                  trip.plan.stops.map((s) => `${s.location} Kenya`),
                )}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-ocean underline-offset-2 hover:underline"
              >
                Open route in Maps
              </a>
            </p>
          ) : null}
          <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ocean-deep">
            <span className="font-semibold">Recommended stay:</span>{" "}
            {asPlainText(trip.plan.recommendedStay)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/guide?tripId=${encodeURIComponent(trip.id)}`}
              className="font-semibold text-ocean underline-offset-2 hover:underline"
            >
              Ask the guide about this trip →
            </Link>
          </div>
        </FadeIn>

        {userId ? (
          <FadeIn delay={0.04} className="mt-6">
            <TripRefinePanel
              userId={userId}
              trip={trip}
              onUpdated={setTrip}
            />
          </FadeIn>
        ) : null}

        {trip.plan.warnings && trip.plan.warnings.length > 0 ? (
          <FadeIn delay={0.05} className="mt-6 rounded-3xl border border-coral/30 bg-coral/5 p-5">
            <h2 className="font-display text-lg text-ocean-deep">
              Timing & logistics
            </h2>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              {trip.plan.warnings.map((w, i) => (
                <li key={`${w.code}-${i}`}>{w.message}</li>
              ))}
            </ul>
          </FadeIn>
        ) : null}

        {trip.plan.routeLegs && trip.plan.routeLegs.length > 0 ? (
          <FadeIn delay={0.05} className="mt-4 rounded-3xl border border-border bg-surface p-5">
            <h2 className="font-display text-lg text-ocean-deep">
              Drive between stops
            </h2>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              {trip.plan.routeLegs.map((leg) => (
                <li key={`${leg.from}-${leg.to}`}>
                  <span className="font-medium text-ocean-deep">
                    {leg.from} → {leg.to}
                  </span>
                  {leg.estHours != null ? ` · ~${leg.estHours}h` : ""}
                  {leg.warning ? ` · ${leg.warning}` : ""}{" "}
                  <a
                    href={googleMapsDirectionsUrl(leg.mapsQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-ocean underline-offset-2 hover:underline"
                  >
                    Directions
                  </a>
                </li>
              ))}
            </ul>
          </FadeIn>
        ) : null}

        {trip.plan.budgetBreakdown ? (
          <FadeIn delay={0.05} className="mt-6 rounded-3xl bg-brand-deep p-6 text-on-brand">
            <p className="text-sm text-aqua">
              {trip.plan.budgetBreakdown.catalogueBacked
                ? "Catalogue-backed estimate"
                : "Trip cost estimate"}
            </p>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                      Day {day.day}
                    </p>
                    {day.location ? (
                      <span className="rounded-full border border-border bg-foam px-2.5 py-0.5 text-[11px] font-medium text-ocean-deep">
                        {day.location}
                      </span>
                    ) : null}
                  </div>
                  {day.estimatedDayCostKes != null ? (
                    <p className="text-xs text-muted">
                      ~KES {day.estimatedDayCostKes.toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <h2 className="mt-1 font-display text-xl text-ocean-deep">
                  {day.theme}
                </h2>
                {day.timingNote ? (
                  <p className="mt-1 text-xs font-medium text-ocean">
                    Timing: {day.timingNote}
                  </p>
                ) : null}
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
                {day.places && day.places.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {day.places.map((place) => (
                      <li
                        key={`${place.name}-${place.mapsQuery}`}
                        className="rounded-xl border border-border bg-foam/50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-ocean-deep">
                          {place.name}
                          {place.catalogueLocked ? (
                            <span className="ml-2 rounded-full bg-ocean/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ocean">
                              Catalogue
                            </span>
                          ) : null}
                          {place.estCostKes != null ? (
                            <span className="ml-2 text-xs font-medium text-muted">
                              ~KES {place.estCostKes.toLocaleString("en-KE")}
                            </span>
                          ) : null}
                        </p>
                        {place.why ? (
                          <p className="text-xs text-muted">{place.why}</p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-semibold">
                          <a
                            href={googleMapsSearchUrl(place.mapsQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ocean underline-offset-2 hover:underline"
                          >
                            Open in Maps
                          </a>
                          <a
                            href={googleMapsDirectionsUrl(place.mapsQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-coral underline-offset-2 hover:underline"
                          >
                            Directions
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {day.localIntel ? (
                  <p className="mt-3 text-sm text-ocean-deep">
                    <strong>Local intel:</strong> {day.localIntel}
                  </p>
                ) : null}
                {day.insiderTip ? (
                  <p className="mt-2 text-sm text-muted">
                    <strong className="text-ocean-deep">Insider:</strong>{" "}
                    {day.insiderTip}
                  </p>
                ) : null}
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
