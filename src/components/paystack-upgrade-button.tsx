"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { DynamicButton } from "@/components/motion/dynamic-button";
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
    <div className={cn("w-full", className)}>
      <DynamicButton
        type="button"
        onClick={() => void startCheckout()}
        disabled={loading}
        variant="coral"
        size="lg"
        width="full"
        stateKey={loading ? "loading" : "idle"}
        icon={
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          )
        }
      >
        {loading ? "Redirecting to Paystack…" : label}
      </DynamicButton>
      {error ? (
        <p className="mt-2 text-center text-xs text-coral">{error}</p>
      ) : null}
    </div>
  );
}
