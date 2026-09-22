import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="coastal-grid flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-2xl text-ocean-deep">Swahili Trail</p>
        <p className="mt-2 text-sm text-muted">Finishing sign-in…</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}
