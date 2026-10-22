"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-deep">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute left-full top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute left-full top-0 h-[12rem] w-[12rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-deep" />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl gold-orb"
        />
        <div
          aria-hidden
          className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-aqua/15 blur-3xl float-orb"
        />
      </div>

      <div className="relative z-[2] mx-auto w-full max-w-lg px-4 py-10 sm:px-0 md:py-20">
        <div className="mb-6 flex items-center justify-between px-1">
          <Link href="/">
            <BrandLogo onDark />
          </Link>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="relative gap-6 border-border/40 bg-card px-6 py-8 shadow-[0_28px_60px_-28px_rgba(0,0,0,0.55)] sm:p-12">
            <CardHeader className="gap-2 p-0 text-center">
              <CardTitle className="font-display text-2xl font-semibold tracking-tight text-card-foreground sm:text-3xl">
                {title}
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                {subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">{children}</CardContent>
          </Card>
        </motion.div>

        <p className="mt-6 text-center text-xs text-on-brand/50">
          Karibu Kenya - plan safaris, coast weekends, and city days on Swahili
          Trail.
        </p>
      </div>
    </section>
  );
}

export function AuthField({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-normal text-muted-foreground"
        >
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}

export const authInputClass = cn(
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition",
  "placeholder:text-muted-foreground/70 focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/25",
);

export const authPrimaryBtnClass = cn(
  "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition",
  "hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
);

export const authSecondaryBtnClass = cn(
  "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-card-foreground shadow-xs transition",
  "hover:border-gold/40 hover:bg-foam disabled:cursor-not-allowed disabled:opacity-60",
);
