import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";

function isBareRoute(pathname: string) {
  return (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/sso-callback") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/s/")
  );
}

/**
 * Server Component: decides AppShell vs bare layout from the request path.
 * Client usePathname() is empty/unreliable during SSR and caused hydration
 * mismatches on /s/[token] (AppShell header on server, bare loader on client).
 */
export async function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (isBareRoute(pathname)) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
