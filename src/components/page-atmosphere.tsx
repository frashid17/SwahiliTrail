import { cn } from "@/lib/utils";

/** Shared Kenya-luxury page canvas - cool mist, gold horizon, film grain. */
export function PageAtmosphere({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "paper-grain coastal-grid relative min-h-[80vh] overflow-x-clip",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-24 h-48 w-48 rounded-full bg-gold/15 blur-3xl gold-orb"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-40 h-52 w-52 rounded-full bg-aqua/12 blur-3xl float-orb"
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

export function PageEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "mt-3 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-tight text-ocean-deep",
        className,
      )}
    >
      {children}
    </h1>
  );
}
