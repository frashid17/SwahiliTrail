export const ADMIN_SECTIONS = [
  "overview",
  "revenue",
  "subscribers",
  "ai",
  "pulse",
  "settings",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export const ADMIN_SECTION_META: Record<
  AdminSection,
  { label: string; title: string; description: string; href: string }
> = {
  overview: {
    label: "Overview",
    title: "Admin overview",
    description: "Live ops snapshot across Kenya travel",
    href: "/admin",
  },
  revenue: {
    label: "Revenue",
    title: "Revenue",
    description: "Reconcile Paystack charges and manage the ledger",
    href: "/admin/revenue",
  },
  subscribers: {
    label: "Subscribers",
    title: "Subscribers",
    description: "Grant, extend, or revoke Trail Plus",
    href: "/admin/subscribers",
  },
  ai: {
    label: "AI usage",
    title: "AI usage",
    description: "Monitor and reset traveler AI quotas",
    href: "/admin/ai",
  },
  pulse: {
    label: "Product pulse",
    title: "Product pulse",
    description: "Inspect and clear product analytics events",
    href: "/admin/pulse",
  },
  settings: {
    label: "Settings",
    title: "Admin settings",
    description: "Platform toggles and ops configuration",
    href: "/admin/settings",
  },
};

export function adminSectionHref(section: AdminSection) {
  return ADMIN_SECTION_META[section].href;
}

export function parseAdminSectionFromPath(pathname: string): AdminSection {
  const path = pathname.replace(/\/$/, "") || "/admin";
  if (path === "/admin") return "overview";
  if (path === "/admin/revenue") return "revenue";
  if (path === "/admin/subscribers") return "subscribers";
  if (path === "/admin/ai") return "ai";
  if (path === "/admin/pulse") return "pulse";
  if (path === "/admin/settings") return "settings";
  return "overview";
}
