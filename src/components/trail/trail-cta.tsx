"use client";

import { Show } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function TrailCta() {
  const ref = useRef(null);
  const bottomAnimation = {
    initial: { y: "5%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 1, delay: 0.2 },
  };

  return (
    <section>
      <div className="py-8 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-16">
          <div
            ref={ref}
            className="relative flex min-h-96 items-center justify-center overflow-hidden rounded-3xl border border-border px-6 before:absolute before:-z-10 before:top-24 before:h-4/5 before:w-full before:rounded-full before:bg-linear-to-r before:from-foam before:from-15% before:via-surface before:via-55% before:to-sand before:to-90% before:blur-3xl dark:before:from-aqua/10 dark:before:via-background dark:before:to-gold/10"
          >
            <motion.div
              {...bottomAnimation}
              className="mx-auto flex flex-col items-center gap-6"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className="font-display text-3xl font-medium md:text-5xl">
                  Your Kenya trail is waiting.
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Save trips, ask the guide, and follow what’s on - from Nairobi
                  to the Swahili coast.
                </p>
              </div>
              <Show
                when="signed-in"
                fallback={
                  <Button
                    asChild
                    className="group relative h-12 w-fit overflow-hidden rounded-full p-1 pe-14 ps-6 text-sm font-medium transition-all duration-500 hover:bg-primary/90 hover:pe-6 hover:ps-14"
                  >
                    <Link href="/sign-up">
                      <span className="relative z-10">Create free account</span>
                      <div className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                        <ArrowUpRight size={16} />
                      </div>
                    </Link>
                  </Button>
                }
              >
                <Button
                  asChild
                  className="group relative h-12 w-fit overflow-hidden rounded-full p-1 pe-14 ps-6 text-sm font-medium transition-all duration-500 hover:bg-primary/90 hover:pe-6 hover:ps-14"
                >
                  <Link href="/planner">
                    <span className="relative z-10">Plan a trip</span>
                    <div className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </div>
                  </Link>
                </Button>
              </Show>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
