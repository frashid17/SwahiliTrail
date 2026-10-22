"use client";

import { Show } from "@clerk/nextjs";
import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiQuotaNavChip } from "@/components/ai-quota-banner";
import { AccountMenu } from "@/components/auth/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
          "inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium tracking-tight transition",
          active || open
            ? "bg-background text-foreground shadow-xs outline outline-border"
            : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-[100] mt-2 min-w-[12rem] rounded-xl border border-border/80 bg-card p-1.5 shadow-[0_16px_40px_-18px_rgba(10,61,63,0.55)]"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                linkActive(pathname, link.href)
                  ? "bg-secondary text-foreground"
                  : "text-foreground/90 hover:bg-secondary/70",
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

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 40);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
        <div className="mx-auto w-full max-w-[90rem]">
          <nav
            className={cn(
              "relative z-50 flex h-[3.85rem] items-center justify-between gap-3 px-3 transition-all duration-500 sm:px-4 lg:px-5",
              sticky || open
                ? "rounded-full border border-border/40 bg-background/60 p-2.5 shadow-2xl shadow-primary/5 backdrop-blur-lg"
                : "rounded-2xl border border-transparent bg-transparent",
            )}
          >
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              <BrandLogo />
            </Link>

            <div className="hidden items-center lg:flex">
              <div className="flex items-center gap-0.5 rounded-full bg-secondary/80 p-0.5">
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
                    "rounded-full px-3 py-2 text-[13px] font-medium tracking-tight transition",
                    linkActive(pathname, "/pricing")
                      ? "bg-background text-foreground shadow-xs outline outline-border"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                  )}
                >
                  Pricing
                </Link>
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Show when="signed-in">
                <AiQuotaNavChip />
              </Show>
              <ThemeToggle />
              <Show when="signed-out">
                <ButtonLink href="/sign-in" variant="quiet" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/sign-up" variant="solid" size="sm">
                  Get started
                </ButtonLink>
              </Show>
              <Show when="signed-in">
                <ButtonLink href="/dashboard" variant="quiet" size="sm">
                  Dashboard
                </ButtonLink>
                <AccountMenu />
              </Show>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Show when="signed-in">
                <AiQuotaNavChip className="max-w-[5.5rem] truncate" />
              </Show>
              <ThemeToggle />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-brand-deep/70 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "8%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "6%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-x-0 bottom-0 top-[4.75rem] flex flex-col overflow-hidden rounded-t-3xl border border-border/50 bg-card shadow-[0_-20px_60px_-24px_rgba(0,0,0,0.45)]"
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Discover
                </p>
                <div className="mt-2 space-y-1">
                  {discoverLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-3 text-base font-semibold transition",
                        linkActive(pathname, link.href)
                          ? "bg-secondary text-foreground"
                          : "text-foreground hover:bg-secondary/70",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <Show when="signed-in">
                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Plan
                  </p>
                  <div className="mt-2 space-y-1">
                    {planLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-xl px-3 py-3 text-base font-semibold transition",
                          linkActive(pathname, link.href)
                            ? "bg-secondary text-foreground"
                            : "text-foreground hover:bg-secondary/70",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </Show>

                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "mt-4 block rounded-xl px-3 py-3 text-base font-semibold transition",
                    linkActive(pathname, "/pricing")
                      ? "bg-secondary text-foreground"
                      : "text-foreground hover:bg-secondary/70",
                  )}
                >
                  Pricing
                </Link>

                <Separator className="my-5" />

                <div className="flex flex-col gap-2.5">
                  <Show when="signed-out">
                    <ButtonLink
                      href="/sign-in"
                      onClick={() => setOpen(false)}
                      variant="outline"
                      className="h-11 w-full justify-center rounded-full"
                    >
                      Sign in
                    </ButtonLink>
                    <ButtonLink
                      href="/sign-up"
                      onClick={() => setOpen(false)}
                      variant="solid"
                      className="h-11 w-full justify-center rounded-full"
                    >
                      Get started
                    </ButtonLink>
                  </Show>
                  <Show when="signed-in">
                    <div className="mb-1 flex items-center justify-between px-1">
                      <AccountMenu />
                      <span className="text-sm text-muted-foreground">
                        Account menu
                      </span>
                    </div>
                    <ButtonLink
                      href="/account"
                      onClick={() => setOpen(false)}
                      variant="outline"
                      className="h-11 w-full justify-center rounded-full"
                    >
                      Manage account
                    </ButtonLink>
                    <ButtonLink
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      variant="solid"
                      className="h-11 w-full justify-center rounded-full"
                    >
                      Dashboard
                    </ButtonLink>
                  </Show>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
