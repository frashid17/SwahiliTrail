"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "swahili-trail-cookie-consent";

export function TrailCookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(timer);
  }, []);

  function dismiss(accepted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "rejected");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 transition-all duration-500 sm:px-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-5xl rounded-xl border border-border bg-background/95 px-5 py-5 shadow-[0_20px_50px_-24px_rgba(6,42,46,0.55)] backdrop-blur-md md:p-6",
          !visible && "pointer-events-none",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 shrink-0 items-center rounded-full bg-secondary px-3">
              <Cookie className="h-4 w-4 text-secondary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground md:text-base">
              We use cookies for sign-in, preferences, and improving Swahili
              Trail.{" "}
              <Link
                href="/cookies"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                Cookie Policy
              </Link>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full px-5 font-medium"
              onClick={() => dismiss(false)}
            >
              Reject
            </Button>
            <Button
              className="h-10 rounded-full px-5 font-medium"
              onClick={() => dismiss(true)}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
