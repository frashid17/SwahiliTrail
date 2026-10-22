"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  AdminNavProvider,
  useAdminNav,
} from "@/components/admin/admin-nav-context";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ADMIN_SECTION_META,
  type AdminSection,
} from "@/lib/admin/sections";
import { cn } from "@/lib/utils";

const NAV: {
  id: AdminSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "overview",
    label: ADMIN_SECTION_META.overview.label,
    href: ADMIN_SECTION_META.overview.href,
    icon: LayoutDashboard,
  },
  {
    id: "revenue",
    label: ADMIN_SECTION_META.revenue.label,
    href: ADMIN_SECTION_META.revenue.href,
    icon: CreditCard,
  },
  {
    id: "subscribers",
    label: ADMIN_SECTION_META.subscribers.label,
    href: ADMIN_SECTION_META.subscribers.href,
    icon: Users,
  },
  {
    id: "ai",
    label: ADMIN_SECTION_META.ai.label,
    href: ADMIN_SECTION_META.ai.href,
    icon: Sparkles,
  },
  {
    id: "pulse",
    label: ADMIN_SECTION_META.pulse.label,
    href: ADMIN_SECTION_META.pulse.href,
    icon: Activity,
  },
  {
    id: "settings",
    label: ADMIN_SECTION_META.settings.label,
    href: ADMIN_SECTION_META.settings.href,
    icon: Settings,
  },
];

function AdminShellInner({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const { section, goTo } = useAdminNav();
  const meta = ADMIN_SECTION_META[section];
  const [open, setOpen] = useState(false);

  function NavItems({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === section;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                goTo(item.id);
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                active ? "text-on-brand" : "text-ocean-deep hover:bg-foam",
              )}
            >
              {active ? (
                <span className="absolute inset-0 -z-10 rounded-xl bg-ocean shadow-[0_10px_30px_-16px_var(--ocean)]" />
              ) : null}
              <Icon
                className={cn("h-4 w-4", active ? "text-gold" : "text-aqua")}
              />
              {item.label}
            </button>
          );
        })}
      </>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--aqua)_26%,transparent)] blur-3xl animate-[float-soft_12s_ease-in-out_infinite]" />
        <div className="absolute right-0 top-16 h-96 w-96 rounded-full bg-[color-mix(in_oklab,var(--gold)_22%,transparent)] blur-3xl animate-[float-soft-alt_14s_ease-in-out_infinite]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] blur-3xl animate-[horizon-pulse_10s_ease-in-out_infinite]" />
        <div className="paper-grain absolute inset-0 opacity-35" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/70 bg-surface/75 px-3 py-5 backdrop-blur-xl md:flex">
          <Link href="/" className="mb-8 px-2">
            <BrandLogo variant="full" />
          </Link>
          <p className="mb-3 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Ops console
          </p>
          <nav className="flex flex-1 flex-col gap-1">
            <NavItems />
          </nav>
          <div className="mt-auto space-y-3 border-t border-border/60 px-2 pt-4">
            <p className="truncate text-xs text-muted">{email}</p>
            <Link
              href="/"
              className="text-xs font-medium text-aqua transition hover:text-ocean"
            >
              ← Back to Trail
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface md:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open admin menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  Swahili Trail · Ops
                </p>
                <h1 className="font-display text-lg font-semibold text-ocean-deep sm:text-xl">
                  {meta.title}
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-brand-deep/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-surface p-4 shadow-2xl md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <BrandLogo variant="full" />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                <NavItems onNavigate={() => setOpen(false)} />
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  return (
    <AdminNavProvider>
      <AdminShellInner email={email}>{children}</AdminShellInner>
    </AdminNavProvider>
  );
}
