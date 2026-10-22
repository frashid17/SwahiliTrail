"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AccountMenu({ className = "" }: { className?: string }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/me")
      .then(async (res) => {
        const json = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled) setIsAdmin(Boolean(json.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-9 animate-pulse rounded-full bg-foam",
          className,
        )}
        aria-hidden
      />
    );
  }

  const name =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Traveler";
  const email = user.primaryEmailAddress?.emailAddress;
  const imageUrl = user.imageUrl;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-[0.3rem] ring-1 ring-border transition hover:ring-ocean/40"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-ocean text-sm font-semibold text-on-brand">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[0.35rem] border border-border bg-surface shadow-[0_16px_40px_-20px_rgba(10,61,63,0.5)]"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-ocean-deep">
              {name}
            </p>
            {email ? (
              <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
            ) : null}
          </div>
          <div className="p-1.5">
            <MenuLink
              href="/account"
              icon={Settings}
              label="Account settings"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/account?tab=billing"
              icon={CreditCard}
              label="Plan & billing"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/trips"
              icon={Map}
              label="My Trips"
              onClick={() => setOpen(false)}
            />
            {isAdmin ? (
              <MenuLink
                href="/admin"
                icon={Shield}
                label="Admin console"
                onClick={() => setOpen(false)}
              />
            ) : null}
          </div>
          <div className="border-t border-border p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                // Hard fallback so sign-out still works if Clerk redirect stalls
                // under a heavy page (image/network saturation).
                void signOut({ redirectUrl: "/" }).finally(() => {
                  if (typeof window !== "undefined") {
                    window.location.assign("/");
                  }
                });
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-coral transition hover:bg-foam"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof Settings;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep transition hover:bg-foam"
    >
      <Icon className="h-4 w-4 text-aqua" />
      {label}
    </Link>
  );
}
