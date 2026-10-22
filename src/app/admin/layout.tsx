import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin/admin-console";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/access";

export const metadata = {
  title: "Admin · Swahili Trail",
  description:
    "Operations console for Swahili Trail billing, AI usage, and product pulse.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.status === 401) {
      redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`);
    }
    redirect("/");
  }

  return (
    <AdminShell email={gate.email}>
      <AdminConsole />
      {/* Route segments exist for URLs / metadata; UI is driven by pathname. */}
      <div className="hidden" aria-hidden>
        {children}
      </div>
    </AdminShell>
  );
}
