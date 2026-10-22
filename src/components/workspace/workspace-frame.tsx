import { cn } from "@/lib/utils";

/** Full-height chrome for Planner / Stay & Eat / Guide */
export function WorkspaceFrame({
  children,
  className,
  /** Guide-style: fill viewport and scroll inside panes (even on mobile). */
  fillMobile = false,
}: {
  children: React.ReactNode;
  className?: string;
  fillMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-background",
        fillMobile
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : [
              /* Mobile: normal document flow so the page scrolls */
              "max-lg:block max-lg:h-auto max-lg:overflow-visible",
              /* Desktop: locked split panes */
              "lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden",
            ],
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[90rem]",
          fillMobile
            ? "flex h-full min-h-0 flex-col gap-0 px-0 py-0 sm:gap-3 sm:px-4 sm:py-4 lg:grid lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-5 lg:px-8 lg:py-4 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]"
            : [
                "flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4",
                "lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:gap-5 lg:overflow-hidden lg:px-8 lg:py-4 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]",
              ],
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function WorkspacePanel({
  children,
  className,
  scroll = true,
}: {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <aside
      className={cn(
        "relative flex flex-col rounded-2xl border border-border/80 bg-surface shadow-[0_12px_40px_-28px_rgba(6,42,46,0.45)]",
        "max-lg:shrink-0 max-lg:overflow-visible",
        "lg:min-h-0 lg:overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "relative z-[1] flex flex-1 flex-col p-4 sm:p-5",
          scroll && "lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain",
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export function WorkspaceStage({
  children,
  className,
  /** Guide chat: fill height and clip on mobile too */
  fillMobile = false,
}: {
  children: React.ReactNode;
  className?: string;
  fillMobile?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col bg-surface",
        fillMobile
          ? "min-h-0 flex-1 overflow-hidden max-lg:rounded-none max-lg:border-0 max-lg:shadow-none sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-[0_12px_40px_-28px_rgba(6,42,46,0.35)]"
          : [
              "rounded-2xl border border-border/80 shadow-[0_12px_40px_-28px_rgba(6,42,46,0.35)]",
              "max-lg:h-auto max-lg:min-h-0 max-lg:overflow-visible",
              "lg:min-h-0 lg:flex-1 lg:overflow-hidden",
            ],
        className,
      )}
    >
      {children}
    </section>
  );
}

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        {eyebrow}
      </p>
      <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ocean-deep sm:text-[1.75rem]">
        {title}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function WorkspaceEmpty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="font-display text-xl font-semibold text-ocean-deep">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export function WorkspaceSectionLabel({
  children,
  step,
}: {
  children: React.ReactNode;
  step?: string;
}) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {step ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-[10px] text-gold">
          {step}
        </span>
      ) : null}
      {children}
    </p>
  );
}
