"use client";

import { useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { ExplorePlace } from "@/lib/data/explore-places";
import { coordsForPlace } from "@/lib/data/place-coords";
import {
  isPlaceSaved,
  toggleSavedPlace,
} from "@/lib/saved-places";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<span style="display:flex;height:28px;width:28px;align-items:center;justify-content:center;border-radius:9999px;background:#062a2e;color:#5ed4de;border:2px solid #c4a35a;box-shadow:0 8px 20px -8px rgba(6,42,46,.55)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -24],
});

function FitBounds({
  points,
}: {
  points: { lat: number; lon: number }[];
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 11);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lon] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.18));
  }, [map, points]);
  return null;
}

export function ExploreMap({
  places,
  className,
}: {
  places: ExplorePlace[];
  className?: string;
}) {
  const { userId } = useAuth();
  const [savedTick, setSavedTick] = useState(0);
  const pins = useMemo(
    () =>
      places.map((place) => ({
        place,
        ...coordsForPlace(place),
      })),
    [places],
  );

  useEffect(() => {
    function refresh() {
      setSavedTick((t) => t + 1);
    }
    window.addEventListener("swahili-trail-saved-places", refresh);
    return () =>
      window.removeEventListener("swahili-trail-saved-places", refresh);
  }, []);

  if (pins.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-sm text-muted",
          className,
        )}
      >
        No places to map in this filter.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-[min(28rem,55dvh)] overflow-hidden rounded-2xl border border-border shadow-[0_20px_50px_-28px_rgba(6,42,46,0.45)] ring-1 ring-gold/10 sm:h-[32rem]",
        className,
      )}
    >
      <MapContainer
        center={[pins[0].lat, pins[0].lon]}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={pins} />
        {pins.map(({ place, lat, lon }) => {
          const saved = isPlaceSaved(userId, place.id);
          void savedTick;
          return (
            <Marker
              key={place.id}
              position={[lat, lon]}
              icon={pinIcon}
            >
              <Popup className="trail-map-popup">
                <div className="min-w-[12rem] space-y-2 p-0.5">
                  <p className="font-semibold text-sm leading-snug text-[#0c3d42]">
                    {place.name}
                  </p>
                  <p className="text-xs text-[#5a7072]">
                    {place.area} · {place.vibe}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant={saved ? "secondary" : "default"}
                      className="h-8 gap-1 rounded-full px-3 text-xs"
                      onClick={() => {
                        toggleSavedPlace(userId, {
                          id: place.id,
                          name: place.name,
                          area: place.area,
                          imageUrl: place.imageUrl,
                          mapsUrl: place.mapsUrl,
                          lat,
                          lon,
                        });
                        setSavedTick((t) => t + 1);
                      }}
                    >
                      {saved ? (
                        <BookmarkCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {saved ? "Saved" : "Save for trip"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 rounded-full px-3 text-xs"
                      asChild
                    >
                      <Link href={`/explore/${place.id}`}>
                        <MapPin className="h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 rounded-full px-2 text-xs"
                      asChild
                    >
                      <a
                        href={place.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
