"use client";

import dynamic from "next/dynamic";
import type { ExplorePlace } from "@/lib/data/explore-places";

const ExploreMap = dynamic(
  () =>
    import("@/components/explore/explore-map").then((m) => m.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(28rem,55dvh)] items-center justify-center rounded-2xl border border-border bg-surface text-sm text-muted sm:h-[32rem]">
        Loading map…
      </div>
    ),
  },
);

export function ExploreMapLazy({
  places,
  className,
}: {
  places: ExplorePlace[];
  className?: string;
}) {
  return <ExploreMap places={places} className={className} />;
}
