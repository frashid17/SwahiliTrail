import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** icon | full wordmark row */
  variant?: "icon" | "full";
  /** Prefer dark-surface wordmark colors */
  onDark?: boolean;
};

type MarkTone = "light" | "app" | "onDark";

const PALETTES: Record<
  MarkTone,
  { tile: string; foam: string; mid: string; crest: string }
> = {
  app: {
    tile: "#043844",
    foam: "#E8F7F6",
    mid: "#1AA6B5",
    crest: "#5ED4DE",
  },
  onDark: {
    tile: "#0B6E7A",
    foam: "#FFFFFF",
    mid: "#5ED4DE",
    crest: "#E8F7F6",
  },
  light: {
    tile: "#D6F0EF",
    foam: "#FFFFFF",
    mid: "#0B6E7A",
    crest: "#1AA6B5",
  },
};

export function BrandMark({
  className = "",
  title = "Swahili Trail",
  tone = "light",
}: {
  className?: string;
  title?: string;
  /** light = primary lockup tile; app = favicon tile; onDark = footer/dark surfaces */
  tone?: MarkTone;
}) {
  const palette = PALETTES[tone];

  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <rect width="128" height="128" rx="28" fill={palette.tile} />
      <path
        d="M18 104C36 96 48 78 56 58c8-20 18-36 40-42 6-1.5 14-1 22 1-10 14-16 30-20 48-5 22-14 40-36 52-12 7-28 8-44-13z"
        fill={palette.foam}
      />
      <path
        d="M24 86c16-22 30-26 48-20 14 5 24 2 36-10 1 16-4 32-16 44-14 14-34 18-52 10-12-5-18-14-16-24z"
        fill={palette.mid}
      />
      <path
        d="M42 54c12-10 26-12 40-4 8 4 16 2 24-4-6 14-16 24-30 28-12 4-24-2-34-20z"
        fill={palette.crest}
      />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  variant = "full",
  onDark = false,
}: BrandLogoProps) {
  if (variant === "icon") {
    return <BrandMark tone="app" className={cn("h-9 w-9", className)} />;
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark tone={onDark ? "onDark" : "light"} className="h-9 w-9" />
      <span className="font-display text-xl tracking-tight">
        <span className={onDark ? "text-on-brand" : "text-ocean-deep"}>
          Swahili
        </span>{" "}
        <span className="text-aqua">Trail</span>
      </span>
    </span>
  );
}
