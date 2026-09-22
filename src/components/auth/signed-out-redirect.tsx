"use client";

import { RedirectToSignIn, Show } from "@clerk/nextjs";

/** Client-side signed-out UX for protected Client Component routes. */
export function SignedOutRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}
