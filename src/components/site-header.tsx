"use client";

import { Show } from "@clerk/nextjs";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiQuotaNavChip } from "@/components/ai-quota-banner";
import { AccountMenu } from "@/components/auth/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

const discoverLinks: NavLink[] = [
  { href: "/explore", label: "Explore" },
  { href: "/attractions", label: "Attractions" },
  { href: "/events", label: "Events" },
  { href: "/wildlife", label: "Wildlife" },
  { href: "/analytics", label: "Analytics" },
];

const planLinks: NavLink[] = [
  { href: "/planner", label: "Trip Planner" },
  { href: "/hotels", label: "Stay & Eat" },
  { href: "/guide", label: "Guide" },
  { href: "/trips", label: "My Trips" },
];

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupActive(pathname: string, links: NavLink[]) {
  return links.some((l) => linkActive(pathname, l.href));
}

function NavDropdown({
  label,
  links,
  pathname,
  signedInOnly,
}: {
  label: string;
  links: NavLink[];
  pathname: string;
  signedInOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = groupActive(pathname, links);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition",
          active || open
            ? "bg-brand-deep text-on-brand"
            : "text-muted hover:bg-foam hover:text-ocean-deep",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[11rem] rounded-md border border-border bg-surface p-1.5 shadow-sm"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm font-medium transition",
                linkActive(pathname, link.href)
                  ? "bg-foam text-ocean-deep"
                  : "text-ocean-deep hover:bg-foam",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (signedInOnly) {
    return <Show when="signed-in">{menu}</Show>;
  }
  return menu;
}

function MobileGroup({
  title,
  links,
  pathname,
  onNavigate,
  signedInOnly,
}: {
  title: string;
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
  signedInOnly?: boolean;
}) {
  const body = (
    <div className="space-y-1">
      <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={cn(
            "block rounded-md px-3 py-2.5 text-sm font-medium",
            linkActive(pathname, link.href)
              ? "bg-brand-deep text-on-brand"
              : "text-ocean-deep hover:bg-foam",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
  if (signedInOnly) {
    return <Show when="signed-in">{body}</Show>;
  }
  return body;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          <NavDropdown
            label="Discover"
            links={discoverLinks}
            pathname={pathname}
          />
          <NavDropdown
            label="Plan"
            links={planLinks}
            pathname={pathname}
            signedInOnly
          />
          <Link
            href="/pricing"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              linkActive(pathname, "/pricing")
                ? "bg-brand-deep text-on-brand"
                : "text-muted hover:bg-foam hover:text-ocean-deep",
            )}
          >
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Show when="signed-in">
            <AiQuotaNavChip />
          </Show>
          <ThemeToggle />
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-md px-3.5 py-2 text-sm font-medium text-ocean-deep hover:bg-foam"
            >
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-solid !py-2 !px-4">
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-md px-3.5 py-2 text-sm font-medium text-ocean-deep hover:bg-foam"
            >
              Dashboard
            </Link>
            <AccountMenu />
          </Show>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Show when="signed-in">
            <AiQuotaNavChip className="min-w-[6.5rem]" />
            <AccountMenu />
          </Show>
          <ThemeToggle />
          <button
            type="button"
            className="rounded-md p-2 text-ocean-deep"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/70 bg-background px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            <MobileGroup
              title="Discover"
              links={discoverLinks}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
            <MobileGroup
              title="Plan"
              links={planLinks}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              signedInOnly
            />
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium",
                linkActive(pathname, "/pricing")
                  ? "bg-brand-deep text-on-brand"
                  : "text-ocean-deep hover:bg-foam",
              )}
            >
              Pricing
            </Link>
            <div className="mt-1 flex flex-col gap-2">
              <Show when="signed-out">
                <div className="flex gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="btn-outline flex-1 !py-2 text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="btn-solid flex-1 !py-2 text-center"
                  >
                    Get started
                  </Link>
                </div>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ocean-deep hover:bg-foam"
                >
                  Manage account
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn-solid w-full !py-2 text-center"
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
