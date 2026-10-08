"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaystackUpgradeButton({
  className,
  label = "Upgrade to Trail Plus",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
      });
      const data = (await res.json()) as {
        authorizationUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        className={cn(
          "btn-solid w-full disabled:opacity-60",
          className,
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Redirecting…" : label}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-coral">{error}</p>
      ) : null}
    </div>
  );
}
