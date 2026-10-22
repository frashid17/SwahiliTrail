import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Auth checks live on each page/layout/API route (resource-based).
// Keep clerkMiddleware for session handling - do not use createRouteMatcher.
// Also forward the request pathname so Server Components can choose shells
// without relying on client-only usePathname during SSR.
export default clerkMiddleware((_auth, req) => {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
