import { auth, currentUser } from "@clerk/nextjs/server";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = getAdminEmails();
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}

export type AdminGate =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403; reason: string };

/**
 * Gate admin APIs / pages. Configure comma-separated ADMIN_EMAILS.
 * When unset, nobody is admin (fail closed).
 */
export async function requireAdmin(): Promise<AdminGate> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { ok: false, status: 401, reason: "Sign in required" };
  }

  const allow = getAdminEmails();
  if (allow.length === 0) {
    return {
      ok: false,
      status: 403,
      reason: "Admin access is not configured (ADMIN_EMAILS)",
    };
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  if (!isAdminEmail(email)) {
    return { ok: false, status: 403, reason: "Admin access denied" };
  }

  return { ok: true, userId, email: email! };
}
