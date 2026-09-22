"use client";

import { Show } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "@/components/auth/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  /** When set, only show for signed-in users */
  signedInOnly?: boolean;
};

/** Traveler journey first, stakeholder analytics last */
const navLinks: NavLink[] = [
  { href: "/explore", label: "Explore" },
  { href: "/attractions", label: "Attractions" },
  { href: "/events", label: "Events" },
  { href: "/wildlife", label: "Wildlife" },
  { href: "/planner", label: "AI Planner", signedInOnly: true },
  { href: "/hotels", label: "Stay & Eat", signedInOnly: true },
  { href: "/guide", label: "Guide", signedInOnly: true },
  { href: "/trips", label: "My Trips", signedInOnly: true },
  { href: "/analytics", label: "Analytics" },
];

function NavItems({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className: string;
}) {
  return (
    <>
      {navLinks.map((link) => {
        const item = (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              className,
              pathname.startsWith(link.href)
                ? "bg-ocean text-white"
                : "text-muted hover:bg-surface/80 hover:text-ocean-deep",
            )}
          >
            {link.label}
          </Link>
        );
        if (link.signedInOnly) {
          return (
            <Show key={link.href} when="signed-in">
              {item}
            </Show>
          );
        }
        return item;
      })}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-foam/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          <NavItems
            pathname={pathname}
            className="rounded-full px-2.5 py-2 text-sm font-medium transition xl:px-3.5"
          />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ocean-deep hover:bg-surface/80"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ocean-deep hover:bg-surface/80"
            >
              Dashboard
            </Link>
            <AccountMenu />
          </Show>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Show when="signed-in">
            <AccountMenu />
          </Show>
          <ThemeToggle />
          <button
            type="button"
            className="rounded-full p-2 text-ocean-deep"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/70 bg-foam px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <NavItems
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface"
            />
            <div className="mt-3 flex flex-col gap-2">
              <Show when="signed-out">
                <div className="flex gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-border bg-surface px-3 py-2 text-center text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full bg-coral px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </div>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep hover:bg-surface"
                >
                  Manage account
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-ocean px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
              </Show>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
