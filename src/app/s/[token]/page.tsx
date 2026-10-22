"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DynamicButton } from "@/components/motion/dynamic-button";
import type { ShareCreateBody } from "@/lib/trip-share";
import {
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
} from "@/lib/maps-link";
import { asPlainText } from "@/lib/plan-normalize";
import { formatStopsSummary } from "@/lib/trip-stops";
import { cn } from "@/lib/utils";

type ShareResponse = {
  token: string;
  title: string;
  trip: ShareCreateBody;
  error?: string;
};

export default function SharedTripPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<ShareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trips/share/${params.token}`)
      .then(async (res) => {
        const json = (await res.json()) as ShareResponse;
        if (!res.ok) throw new Error(json.error || "Share not found");
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Share not found");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <BrandLogo />
        <p className="mt-6 text-coral">{error}</p>
        <Link href="/planner" className="mt-4 text-sm font-semibold text-ocean">
          Plan your own Kenya trip →
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-aqua" />
      </div>
    );
  }

  const trip = data.trip;
  const plan = trip.plan;
  const budget = plan.budgetBreakdown?.totalKes;

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch("/api/leads/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          partySize: trip.partySize,
          startDate: trip.startDate,
          notes,
          tripTitle: plan.title,
          shareToken: params.token,
          source: "share_page",
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(json.error || "Could not send request");
      setSubmitted(json.message || "Request sent");
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-brand-deep text-on-brand">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogo onDark />
          <Link
            href="/planner"
            className="text-xs font-semibold uppercase tracking-wider text-gold"
          >
            Plan yours
          </Link>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Shared itinerary
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {plan.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-on-brand/75 sm:text-base">
            {plan.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Chip>
              {trip.startDate} · {plan.days.length} days
            </Chip>
            <Chip>{trip.partySize} travelers</Chip>
            {budget ? <Chip>~KES {budget.toLocaleString()}</Chip> : null}
            {trip.transportMode ? <Chip>{trip.transportMode}</Chip> : null}
          </div>
          {plan.stops && plan.stops.length > 0 ? (
            <p className="mt-4 text-sm text-on-brand/70">
              Route: {formatStopsSummary(plan.stops)}
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
            Recommended stay
          </p>
          <p className="mt-1 font-display text-xl text-ocean-deep">
            {asPlainText(plan.recommendedStay)}
          </p>
          <Link
            href="/hotels"
            className="mt-3 inline-block text-sm font-semibold text-ocean"
          >
            Browse stays on Swahili Trail →
          </Link>
        </section>

        {/* Day list */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ocean-deep">Day by day</h2>
          {plan.days.map((day) => (
            <article
              key={day.day}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-aqua">
                  Day {day.day}
                </p>
                {day.location ? (
                  <span className="rounded-full border border-border bg-foam px-2 py-0.5 text-[11px] font-medium text-ocean-deep">
                    {day.location}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1 font-display text-lg text-ocean-deep">
                {day.theme}
              </h3>
              {day.timingNote ? (
                <p className="mt-1 text-xs font-medium text-ocean">
                  Timing: {day.timingNote}
                </p>
              ) : null}
              <ul className="mt-2 space-y-2 text-sm text-muted">
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
                <ul className="mt-3 space-y-2">
                  {day.places.map((place) => (
                    <li
                      key={`${place.name}-${place.mapsQuery}`}
                      className="rounded-xl border border-border bg-foam/50 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-ocean-deep">
                        {place.name}
                      </p>
                      {place.why ? (
                        <p className="text-xs text-muted">{place.why}</p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-semibold">
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
              {day.insiderTip ? (
                <p className="mt-3 text-xs text-ocean-deep">
                  <strong>Insider:</strong> {day.insiderTip}
                </p>
              ) : null}
            </article>
          ))}
        </section>

        {/* Operator lead capture */}
        <section
          id="operator"
          className="overflow-hidden rounded-2xl border border-border bg-[color-mix(in_oklab,var(--ocean)_6%,var(--surface))]"
        >
          <div className="border-b border-border bg-brand-deep px-5 py-4 text-on-brand">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
              <MessageCircle className="h-3.5 w-3.5" />
              Operator desk
            </p>
            <h2 className="mt-1 font-display text-2xl">
              Request a local quote
            </h2>
            <p className="mt-1 text-sm text-on-brand/70">
              Transfers, guiding, and lodge holds - a partner follows up on
              WhatsApp or email.
            </p>
          </div>

          <div className="p-5">
            {submitted ? (
              <div className="flex items-start gap-3 rounded-xl border border-aqua/30 bg-aqua/10 px-4 py-3 text-sm text-ocean-deep">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-aqua" />
                {submitted}
              </div>
            ) : (
              <form onSubmit={(e) => void submitLead(e)} className="space-y-3">
                <Field
                  label="Name"
                  value={name}
                  onChange={setName}
                  required
                  placeholder="Your name"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    placeholder="you@email.com"
                  />
                  <Field
                    label="WhatsApp"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+254…"
                  />
                </div>
                <Field
                  label="Notes for the operator"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Airport pickup, safari vehicle, dietary needs…"
                  multiline
                />
                {leadError ? (
                  <p className="text-sm text-coral">{leadError}</p>
                ) : null}
                <DynamicButton
                  type="submit"
                  variant="coral"
                  size="lg"
                  width="full"
                  stateKey={submitting ? "busy" : "idle"}
                  disabled={submitting}
                  icon={
                    submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )
                  }
                >
                  {submitting ? "Sending…" : "Request operator quote"}
                </DynamicButton>
              </form>
            )}
          </div>
        </section>

        <p className="pb-10 text-center text-sm text-muted">
          Want your own plan?{" "}
          <Link href="/planner" className="font-semibold text-ocean">
            Open the Trip Planner
            <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium text-on-brand/90">
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  const cls = cn(
    "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ocean-deep outline-none focus:border-aqua/50",
  );
  return (
    <label className="block text-sm">
      <span className="font-medium text-ocean-deep">{label}</span>
      {multiline ? (
        <textarea
          className={cn(cls, "min-h-[88px] resize-y")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          className={cls}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}
