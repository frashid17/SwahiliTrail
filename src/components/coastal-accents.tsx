export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-8 w-full tide-line opacity-80 ${className}`}
    />
  );
}

export function CoastalOrbs({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <span className="float-orb absolute -left-10 top-8 h-36 w-36 rounded-full bg-aqua/15 blur-2xl" />
      <span className="float-orb-alt absolute -right-8 bottom-4 h-40 w-40 rounded-full bg-coral/15 blur-2xl" />
      <span className="float-orb absolute left-1/3 top-1/2 h-24 w-24 rounded-full bg-ocean/10 blur-xl [animation-delay:1.5s]" />
    </div>
  );
}

export function ShellMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`shell-dot inline-block h-2.5 w-2.5 rounded-full ${className}`}
    />
  );
}

/** Soft animated tide band — visible aqua waves */
export function TideBand({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative h-16 w-full overflow-hidden ${className}`}
    >
      <svg
        className="tide-drift-svg absolute inset-x-0 bottom-0 h-16 w-[200%]"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
      >
        <path
          d="M0 32c120-20 240-20 360 0s240 20 360 0 240-20 360 0 240 20 360 0v32H0V32z"
          fill="currentColor"
          className="text-aqua/55"
        />
      </svg>
      <svg
        className="tide-drift-svg absolute inset-x-0 bottom-0 h-12 w-[200%] text-aqua/30 [animation-direction:reverse] [animation-duration:22s]"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
      >
        <path
          d="M0 36c100-16 200-16 300 0s200 16 300 0 200-16 300 0 200 16 300 0v28H0V36z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
