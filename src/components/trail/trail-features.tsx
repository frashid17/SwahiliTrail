"use client";

import { Languages, Map, Route } from "lucide-react";
import Feature from "@/components/shadcn-space/radix/blocks/feature-02/feature";

const featureData = [
  {
    icon: Map,
    title: "Pick a stretch of Kenya",
    content:
      "City, safari, Rift, or coast - filter places and what’s on near you without a dashboard maze.",
  },
  {
    icon: Route,
    title: "Shape the days",
    content:
      "Build a multi-day plan with a rough KES budget and save it to My Trips when you’re signed in.",
  },
  {
    icon: Languages,
    title: "Ask like a local",
    content:
      "Guide answers roads, food, lodging, and phrases in six languages - from English to Kiswahili.",
  },
];

export function TrailFeatures() {
  return <Feature featureData={featureData} />;
}
