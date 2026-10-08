"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiQuotaProvider } from "@/components/ai-quota-banner";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-brand-deep text-on-brand">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10">
        <div>
          <BrandLogo onDark />
          <p className="mt-3 max-w-md text-sm text-on-brand/75">
            Kenya travel platform — plan trips, match stays, ask a guide, and
            follow what&apos;s on from Nairobi to the coast.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-on-brand/80">
          <Link href="/explore" className="hover:text-white">
            Discover
          </Link>
          <Link href="/planner" className="hover:text-white">
            Plan
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/events" className="hover:text-white">
            Events
          </Link>
          <Link href="/guide" className="hover:text-white">
            Guide
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-on-brand/55 sm:px-6">
        Swahili Trail · Travel Kenya
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isImmersive =
    pathname.startsWith("/guide") ||
    pathname.startsWith("/hotels") ||
    pathname.startsWith("/planner");

  return (
    <AiQuotaProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main
          className={
            isImmersive
              ? // Mobile: page scrolls. Desktop: panels own their scroll.
                "flex-1 overflow-y-auto lg:min-h-0 lg:overflow-hidden"
              : "flex-1"
          }
        >
          {children}
        </main>
        {isImmersive ? null : <SiteFooter />}
      </div>
    </AiQuotaProvider>
  );
}
