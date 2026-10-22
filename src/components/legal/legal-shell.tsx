import Link from "next/link";
import { PageAtmosphere } from "@/components/page-atmosphere";

const LEGAL_NAV = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
] as const;

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <PageAtmosphere>
      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[14rem_minmax(0,48rem)] lg:gap-12 lg:px-10 lg:py-16">
        <aside className="mb-10 lg:mb-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            Legal
          </p>
          <nav className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-2 text-sm font-semibold text-ocean-deep transition hover:bg-foam hover:text-ocean"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ocean-deep sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
          <div className="prose-legal mt-10 space-y-6 text-[15px] leading-relaxed text-ocean-deep/90">
            {children}
          </div>
        </article>
      </div>
    </PageAtmosphere>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold text-ocean-deep">
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}

export function LegalUl({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
