"use client";

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { DynamicButton } from "@/components/motion/dynamic-button";
import { downloadTripPdf } from "@/lib/plan-pdf";
import {
  buildTripShareText,
  sharePageUrl,
  type ShareableTripPayload,
  whatsAppShareUrl,
} from "@/lib/trip-share";
import { cn } from "@/lib/utils";

type ShareMode = "idle" | "preparing" | "whatsapp" | "pdf" | "copied" | "ready";

export function TripSharePanel({
  payload,
  className,
  compact,
}: {
  payload: ShareableTripPayload;
  className?: string;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<ShareMode>("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function ensureShareLink() {
    if (shareUrl) return shareUrl;
    setMode("preparing");
    setError(null);
    const res = await fetch("/api/trips/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as {
      token?: string;
      error?: string;
    };
    if (!res.ok || !json.token) {
      throw new Error(json.error || "Could not create share link");
    }
    const url = sharePageUrl(json.token);
    setShareUrl(url);
    setMode("ready");
    return url;
  }

  async function onPrimaryShare() {
    setOpen(true);
    try {
      await ensureShareLink();
    } catch (err) {
      setMode("idle");
      setError(err instanceof Error ? err.message : "Share failed");
    }
  }

  async function shareWhatsApp() {
    try {
      const url = await ensureShareLink();
      setMode("whatsapp");
      const text = buildTripShareText(payload, url);
      window.open(whatsAppShareUrl(text), "_blank", "noopener,noreferrer");
      window.setTimeout(() => setMode("ready"), 1200);
    } catch (err) {
      setMode("idle");
      setError(err instanceof Error ? err.message : "WhatsApp share failed");
    }
  }

  async function sharePdf() {
    try {
      setMode("pdf");
      const url = await ensureShareLink();
      const slug = payload.plan.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40);
      downloadTripPdf(
        payload.plan,
        {
          startDate: payload.startDate,
          partySize: payload.partySize,
          transportLabel: payload.transportMode,
        },
        `${slug || "swahili-trail-trip"}.pdf`,
      );
      // Keep share URL in PDF flow story - user can still copy/WhatsApp
      void url;
      window.setTimeout(() => setMode("ready"), 900);
    } catch (err) {
      setMode("idle");
      setError(err instanceof Error ? err.message : "PDF failed");
    }
  }

  async function copyLink() {
    try {
      const url = await ensureShareLink();
      await navigator.clipboard.writeText(url);
      setMode("copied");
      window.setTimeout(() => setMode("ready"), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Copy failed");
      setMode("ready");
    }
  }

  const label =
    mode === "preparing"
      ? "Creating link…"
      : mode === "whatsapp"
        ? "Opening WhatsApp…"
        : mode === "pdf"
          ? "Preparing PDF…"
          : mode === "copied"
            ? "Link copied"
            : mode === "ready"
              ? "Share trip"
              : "Share trip";

  const icon =
    mode === "preparing" || mode === "pdf" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : mode === "whatsapp" ? (
      <MessageCircle className="h-4 w-4" />
    ) : mode === "copied" ? (
      <Check className="h-4 w-4" />
    ) : (
      <Share2 className="h-4 w-4" />
    );

  return (
    <div className={cn("relative", className)}>
      <DynamicButton
        variant="coral"
        size={compact ? "md" : "lg"}
        stateKey={mode}
        icon={icon}
        onClick={() => void onPrimaryShare()}
        disabled={mode === "preparing"}
      >
        {label}
      </DynamicButton>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_40px_-24px_rgba(6,42,46,0.55)]">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ocean-deep">
              Share & monetize
            </p>
            <p className="mt-0.5 text-xs text-muted">
              WhatsApp + PDF + public link with booking CTAs and operator leads
            </p>
          </div>
          <div className="flex flex-col p-1.5">
            <ShareAction
              icon={MessageCircle}
              label="Share on WhatsApp"
              hint="Friends open the trip link"
              onClick={() => void shareWhatsApp()}
            />
            <ShareAction
              icon={Download}
              label="Download PDF"
              hint="Branded itinerary file"
              onClick={() => void sharePdf()}
            />
            <ShareAction
              icon={Copy}
              label="Copy share link"
              hint="Landing page with book + quote"
              onClick={() => void copyLink()}
            />
            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep transition hover:bg-foam"
              >
                <ExternalLink className="h-4 w-4 text-aqua" />
                Open share page
              </a>
            ) : null}
          </div>
          <button
            type="button"
            className="w-full border-t border-border px-4 py-2 text-xs text-muted hover:bg-foam"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
    </div>
  );
}

function ShareAction({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Share2;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-foam"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
      <span>
        <span className="block text-sm font-medium text-ocean-deep">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );
}
