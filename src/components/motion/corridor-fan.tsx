"use client";

/**
 * Corridor fan — inspired by dqnamo Playing Cards hand.
 * Hover to thumb through Kenya corridors; click to open Explore.
 * https://www.dqnamo.com/experiments/playing-cards
 */

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type CorridorCard = {
  href: string;
  label: string;
  line: string;
  image: string;
};

const FAN_OFFSETS = [
  { x: -72, rotate: -14, z: 1 },
  { x: -24, rotate: -5, z: 2 },
  { x: 24, rotate: 5, z: 3 },
  { x: 72, rotate: 14, z: 4 },
];

export function CorridorFan({
  cards,
  className,
}: {
  cards: CorridorCard[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const [played, setPlayed] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[320px] w-full max-w-3xl items-end justify-center sm:h-[380px]",
        className,
      )}
      onMouseLeave={() => {
        if (played === null) setActive(null);
      }}
    >
      {cards.slice(0, 4).map((card, index) => {
        const base = FAN_OFFSETS[index] ?? FAN_OFFSETS[0]!;
        const isActive = active === index;
        const isPlayed = played === index;
        const lift = isPlayed ? -110 : isActive ? -36 : 0;
        const spread = active === null ? 1 : isActive ? 1.15 : 0.92;

        return (
          <motion.div
            key={card.label}
            className="absolute bottom-6 origin-bottom"
            style={{ zIndex: isActive || isPlayed ? 20 : base.z }}
            initial={false}
            animate={
              reduce
                ? { x: base.x, rotate: 0, y: 0 }
                : {
                    x: base.x * spread,
                    rotate: isPlayed ? 0 : base.rotate * (isActive ? 0.35 : 1),
                    y: lift,
                    scale: isActive || isPlayed ? 1.04 : 1,
                  }
            }
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <Link
              href={card.href}
              className="group block w-[150px] overflow-hidden rounded-2xl border border-white/25 bg-brand-deep shadow-[0_18px_40px_-18px_rgba(0,0,0,0.65)] outline-none ring-gold focus-visible:ring-2 sm:w-[180px]"
              onClick={() => setPlayed(index)}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={card.image}
                  alt={card.label}
                  fill
                  unoptimized
                  sizes="180px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="font-display text-lg font-semibold text-white sm:text-xl">
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/70 sm:text-xs">
                    {card.line}
                  </p>
                </div>
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/35 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
