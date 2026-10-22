import { cn } from "@/lib/utils";

/**
 * Custom Swahili Trail AI mark - a trail path + compass pin.
 * Not Lucide Sparkles (the generic AI cliché).
 */
export function TrailAiMark({
  className,
  title = "Trail AI",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      {/* Path / trail */}
      <path
        d="M4.5 18.5c2.2-1.2 3.6-3.4 4.4-5.6.9-2.4 2.1-4.6 4.6-5.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M7 19c2.8-2.1 4.2-4.8 5.2-7.4.8-2.1 1.9-3.9 4.3-4.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Compass diamond */}
      <path
        d="M16.2 4.2 18 7.8l3.6 1.8-3.6 1.8L16.2 15 14.4 11.4 10.8 9.6l3.6-1.8L16.2 4.2Z"
        fill="currentColor"
      />
      <circle cx="16.2" cy="9.6" r="1.15" fill="var(--background)" />
    </svg>
  );
}
