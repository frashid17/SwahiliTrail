import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ConditionalShell } from "@/components/conditional-shell";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swahili Trail - AI Coastal Tourism Companion",
  description:
    "AI itineraries, hotel matching, multilingual guides, and tourism analytics for Mombasa - built for AI and Digital Tourism Day 2026.",
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
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <ClerkProvider>
            <ConditionalShell>{children}</ConditionalShell>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
