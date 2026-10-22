"use client";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { useAdminNav } from "@/components/admin/admin-nav-context";

export function AdminConsole() {
  const { section } = useAdminNav();
  return <AdminDashboard section={section} />;
}
