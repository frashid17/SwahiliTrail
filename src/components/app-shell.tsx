"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiQuotaProvider } from "@/components/ai-quota-banner";
import { BrandLogo } from "@/components/brand-logo";
import { LiveNowFloat } from "@/components/live-now-float";
import { SiteHeader } from "@/components/site-header";
import { TrailCookieConsent } from "@/components/trail/trail-cookie-consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/attractions", label: "Attractions" },
  { href: "/wildlife", label: "Wildlife" },
];

const planLinks = [
  { href: "/planner", label: "Trip Planner" },
  { href: "/hotels", label: "Stay & Eat" },
  { href: "/guide", label: "Guide" },
  { href: "/pricing", label: "Pricing" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="dark relative mt-auto overflow-x-clip bg-brand-deep text-on-brand">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-24 lg:px-8">
        <div className="flex flex-col gap-12 md:gap-16">
          <div className="flex flex-col gap-10 md:gap-12">
            <div className="grid animate-in fade-in slide-in-from-bottom-10 grid-cols-12 gap-6 fill-mode-both duration-1000 ease-in-out">
              <div className="col-span-12 md:col-span-3">
                <BrandLogo onDark />
                <p className="mt-4 w-full text-sm leading-relaxed text-on-brand/70">
                  Plan Kenya trips, match stays, ask a guide, and follow
                  what&apos;s on - from Nairobi to the Swahili coast.
                </p>
              </div>
              <div className="hidden md:col-span-1 md:block" />
              <div className="col-span-12 md:col-span-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:gap-10">
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <Input
                      required
                      type="email"
                      name="email"
                      placeholder="Enter your email for trail updates"
                      className="h-11 rounded-full border-on-brand/20 bg-on-brand/5 text-on-brand placeholder:text-on-brand/40"
                    />
                    <Button
                      type="submit"
                      className="h-11 shrink-0 rounded-full px-5 font-medium"
                    >
                      Subscribe
                    </Button>
                  </form>
                  <p className="flex-1 text-sm text-on-brand/55">
                    Occasional planning tips and product news. Unsubscribe
                    anytime. See our{" "}
                    <Link href="/privacy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
            <Separator className="bg-on-brand/15" />
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 animate-in fade-in slide-in-from-bottom-10 fill-mode-both duration-1000 md:col-span-7">
              <h2 className="mb-6 font-display text-3xl font-medium text-on-brand sm:text-5xl">
                Ready for your next Kenya stretch?
              </h2>
              <Button asChild className="h-auto rounded-full px-6 py-3.5">
                <Link href="/planner">Start planning</Link>
              </Button>
            </div>
            <div className="hidden md:col-span-1 md:block" />
            <div className="col-span-6 animate-in fade-in slide-in-from-bottom-10 fill-mode-both duration-1000 delay-100 md:col-span-2">
              <div className="flex flex-col gap-4">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-base text-on-brand/65 transition hover:text-gold"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="col-span-6 animate-in fade-in slide-in-from-bottom-10 fill-mode-both duration-1000 delay-200 md:col-span-2">
              <div className="flex flex-col gap-4">
                {[...planLinks, ...legalLinks.slice(0, 2)].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-base text-on-brand/65 transition hover:text-gold"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <Separator className="bg-on-brand/15" />
            <div className="flex flex-col gap-3 text-sm text-on-brand/45 sm:flex-row sm:items-center sm:justify-between">
              <p>© {year} Swahili Trail. All rights reserved.</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {legalLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="transition hover:text-gold"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <p className="max-w-2xl text-xs text-on-brand/35">
              Travel information is for planning only. Verify fees, visas, and
              safety with official sources before you go.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGuide = pathname.startsWith("/guide");
  const isSplitTools =
    pathname.startsWith("/hotels") || pathname.startsWith("/planner");
  /** Desktop split-pane lock only - mobile uses normal page scroll for tools */
  const lockDesktop = isGuide || isSplitTools;

  return (
    <AiQuotaProvider>
      <div
        className={cn(
          "flex w-full flex-col",
          /* Mobile: natural document height + page scroll */
          "max-lg:min-h-0",
          /* Desktop immersive tools: fill viewport */
          lockDesktop ? "lg:h-dvh lg:min-h-0 lg:overflow-hidden" : "min-h-dvh",
        )}
      >
        <SiteHeader />
        <main
          className={cn(
            "min-w-0 w-full",
            isGuide
              ? "flex min-h-0 flex-1 flex-col overflow-hidden max-lg:h-[calc(100dvh-4.75rem)]"
              : isSplitTools
                ? "max-lg:overflow-visible lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden"
                : "flex-1",
          )}
        >
          {children}
        </main>
        {lockDesktop ? null : <SiteFooter />}
        <LiveNowFloat />
        <TrailCookieConsent />
      </div>
    </AiQuotaProvider>
  );
}
