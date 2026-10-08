import { Suspense } from "react";
import { AccountManager } from "@/components/auth/account-manager";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted">
          Loading your account…
        </div>
      }
    >
      <AccountManager />
    </Suspense>
  );
}
