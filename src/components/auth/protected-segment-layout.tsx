import { auth } from "@clerk/nextjs/server";
import { SignedOutRedirect } from "@/components/auth/signed-out-redirect";

/**
 * Shared layout guard for protected app routes.
 * Server: auth.protect() — Client: RedirectToSignIn when signed out mid-session.
 */
export default async function ProtectedSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  return <SignedOutRedirect>{children}</SignedOutRedirect>;
}
