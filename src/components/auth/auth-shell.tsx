import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80"
          alt="Coastal shoreline at golden hour"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/70 to-brand-deep/35 dark:from-brand-deep/95 dark:via-brand-deep/80 dark:to-brand-deep/45" />
        <div className="absolute inset-0 bg-black/15 dark:bg-black/35" />
        <div className="coastal-shimmer absolute inset-0 opacity-30 mix-blend-soft-light" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-4xl leading-tight drop-shadow-md xl:text-5xl">
            Follow the coast.
            <br />
            Plan with Swahili Trail.
          </p>
          <p className="mt-4 max-w-md text-sm text-white/80">
            AI itineraries, hotel matching, multilingual guidance, and tourism
            analytics for Mombasa.
          </p>
        </div>
      </div>

      <div className="coastal-grid flex flex-col px-4 py-8 sm:px-8">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/">
            <BrandLogo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl text-ocean-deep sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ocean-deep">
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error ? <p className="mt-1.5 text-sm text-coral">{error}</p> : null}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ocean-deep outline-none transition placeholder:text-muted/70 focus:border-aqua focus:ring-2 focus:ring-aqua/20";

export const authPrimaryBtnClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60";

export const authSecondaryBtnClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-ocean-deep transition hover:border-aqua/40 hover:bg-foam disabled:cursor-not-allowed disabled:opacity-60";
