import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { ConditionalShell } from "@/components/conditional-shell";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swahili Trail · Kenya travel platform",
  description:
    "Plan trips across Kenya - Nairobi, safari circuits, the Rift Valley, and the Swahili coast. Match stays, ask a multilingual guide, follow events, and open visitor analytics.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} antialiased`}
    >
      <body className="min-h-dvh w-full bg-background font-sans text-foreground">
        <ThemeProvider>
          <ClerkProvider>
            {/* Required for Clerk Smart CAPTCHA on custom auth flows.
                pointer-events only when filled so an empty mount never blocks clicks. */}
            <div
              id="clerk-captcha"
              data-cl-theme="auto"
              data-cl-size="flexible"
              className="pointer-events-none fixed bottom-4 left-1/2 z-[100] w-[min(100%-2rem,22rem)] -translate-x-1/2 empty:hidden [&:not(:empty)]:pointer-events-auto"
            />
            <ConditionalShell>{children}</ConditionalShell>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
