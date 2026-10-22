import {
  LegalH2,
  LegalP,
  LegalShell,
  LegalUl,
} from "@/components/legal/legal-shell";

export const metadata = {
  title: "Cookie Policy · Swahili Trail",
  description: "How Swahili Trail uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="21 October 2026">
      <LegalP>
        We use cookies and similar technologies to run Swahili Trail, keep you
        signed in, remember preferences, and understand how the product is used.
      </LegalP>

      <LegalH2>1. What are cookies?</LegalH2>
      <LegalP>
        Cookies are small text files stored on your device. We also use local
        storage and similar browser storage for trip carts and session state.
      </LegalP>

      <LegalH2>2. Types we use</LegalH2>
      <LegalUl
        items={[
          "Essential: authentication (Clerk), security, load balancing, and core navigation.",
          "Preferences: theme (light/dark), region filters, and UI state.",
          "Analytics (if enabled): aggregated traffic and feature usage to improve the product.",
          "Payments: Paystack may set cookies during checkout on their domain.",
        ]}
      />

      <LegalH2>3. Your choices</LegalH2>
      <LegalP>
        You can block or delete cookies in your browser settings. Blocking
        essential cookies may prevent sign-in or checkout from working. Where
        we use non-essential analytics cookies, we will seek consent when
        required.
      </LegalP>

      <LegalH2>4. More information</LegalH2>
      <LegalP>
        See our{" "}
        <a className="font-semibold text-ocean underline" href="/privacy">
          Privacy Policy
        </a>{" "}
        for how personal data is handled, or email{" "}
        <a className="font-semibold text-ocean underline" href="mailto:privacy@swahilitrail.com">
          privacy@swahilitrail.com
        </a>
        .
      </LegalP>
    </LegalShell>
  );
}
