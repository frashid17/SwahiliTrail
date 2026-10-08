"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ALL_KENYA_ID,
  LOCATION_STORAGE_KEY,
  getKenyaRegion,
  type KenyaRegion,
} from "@/lib/kenya-regions";

export type KenyaLocationSelection = {
  regionId: string;
  region: KenyaRegion | null;
  setRegionId: (id: string) => void;
};

export function useKenyaLocation(): KenyaLocationSelection {
  const [regionId, setRegionIdState] = useState<string>(ALL_KENYA_ID);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved && (saved === ALL_KENYA_ID || getKenyaRegion(saved))) {
        setRegionIdState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setRegionId = useCallback((id: string) => {
    const next =
      id === ALL_KENYA_ID || getKenyaRegion(id) ? id : ALL_KENYA_ID;
    setRegionIdState(next);
    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, next);
      window.dispatchEvent(
        new CustomEvent("swahili-trail-region", { detail: next }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onExternal(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") setRegionIdState(detail);
    }
    window.addEventListener("swahili-trail-region", onExternal);
    return () => window.removeEventListener("swahili-trail-region", onExternal);
  }, []);

  return {
    regionId,
    region: getKenyaRegion(regionId),
    setRegionId,
  };
}
