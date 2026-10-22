"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  adminSectionHref,
  parseAdminSectionFromPath,
  type AdminSection,
} from "@/lib/admin/sections";

type AdminNavContextValue = {
  section: AdminSection;
  goTo: (section: AdminSection) => void;
};

const AdminNavContext = createContext<AdminNavContextValue | null>(null);

/**
 * Pathname can briefly report `/admin` during App Router transitions, which
 * made the UI flash Overview. Keep an optimistic section from the click until
 * the real path catches up.
 */
export function AdminNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<AdminSection | null>(null);
  const [, startTransition] = useTransition();

  const pathSection = useMemo(() => {
    if (!pathname?.startsWith("/admin")) return null;
    return parseAdminSectionFromPath(pathname);
  }, [pathname]);

  const section: AdminSection = optimistic ?? pathSection ?? "overview";

  useEffect(() => {
    if (optimistic != null && pathSection === optimistic) {
      setOptimistic(null);
    }
  }, [optimistic, pathSection]);

  const goTo = useCallback(
    (next: AdminSection) => {
      setOptimistic(next);
      startTransition(() => {
        router.push(adminSectionHref(next), { scroll: false });
      });
    },
    [router],
  );

  const value = useMemo(() => ({ section, goTo }), [section, goTo]);

  return (
    <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>
  );
}

export function useAdminNav() {
  const ctx = useContext(AdminNavContext);
  if (!ctx) {
    throw new Error("useAdminNav must be used within AdminNavProvider");
  }
  return ctx;
}
