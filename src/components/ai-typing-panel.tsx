"use client";

import { cn } from "@/lib/utils";

function DraftingLabel() {
  return (
    <span className="inline-flex items-center gap-2 text-muted" aria-label="Drafting">
      <span className="font-medium text-ocean-deep">Drafting</span>
      <span className="inline-flex items-end gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral" />
      </span>
    </span>
  );
}

/** Live draft while the model is still writing. */
export function AiTypingPanel({
  title,
  text,
  className,
}: {
  title?: string;
  text: string;
  className?: string;
}) {
  const hasText = Boolean(text.trim());

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </p>
      ) : null}
      <div
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-ocean-deep sm:text-base",
          title && "mt-2",
        )}
      >
        {hasText ? (
          <>
            {text}
            <span
              className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-coral align-middle"
              aria-hidden
            />
          </>
        ) : (
          <DraftingLabel />
        )}
      </div>
    </div>
  );
}
