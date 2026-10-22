import {
  LegalH2,
  LegalP,
  LegalShell,
  LegalUl,
} from "@/components/legal/legal-shell";

export const metadata = {
  title: "Terms of Service · Swahili Trail",
  description: "Terms governing use of Swahili Trail.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="21 October 2026">
      <LegalP>
        By creating an account or using Swahili Trail, you agree to these
        Terms. If you do not agree, do not use the service.
      </LegalP>

      <LegalH2>1. The service</LegalH2>
      <LegalP>
        Swahili Trail provides travel planning tools for Kenya, including
        itineraries, place discovery, events, lodging suggestions, analytics
        views, and AI-assisted guidance. Information is for planning only - it
        is not a booking agency, insurer, or licensed tour operator unless we
        expressly say so.
      </LegalP>

      <LegalH2>2. Accounts</LegalH2>
      <LegalUl
        items={[
          "You must provide accurate registration information and keep credentials secure.",
          "You are responsible for activity under your account.",
          "We may suspend accounts that violate these Terms or our Acceptable Use Policy.",
        ]}
      />

      <LegalH2>3. Plans and payments</LegalH2>
      <LegalP>
        Free use includes limited AI fair-use. Trail Plus is a paid period
        access product billed via Paystack (card or M-Pesa where available).
        Prices are shown at checkout. Unless required by law, fees for an
        active access period are non-refundable once delivery of digital access
        begins. Paying again extends your period as described on Pricing.
      </LegalP>

      <LegalH2>4. AI and content accuracy</LegalH2>
      <LegalP>
        AI outputs can be incomplete or wrong. Always verify roads, visas,
        park fees, safety, and bookings with official sources. You remain
        responsible for travel decisions.
      </LegalP>

      <LegalH2>5. Your content</LegalH2>
      <LegalP>
        You keep ownership of trip notes and prompts you submit. You grant us a
        license to host and process them to operate and improve the service.
        Do not upload unlawful or infringing content.
      </LegalP>

      <LegalH2>6. Intellectual property</LegalH2>
      <LegalP>
        The Swahili Trail name, brand marks, UI, and software are protected.
        You may not copy, scrape at scale, or reverse engineer the service
        except as allowed by law.
      </LegalP>

      <LegalH2>7. Disclaimers</LegalH2>
      <LegalP>
        The service is provided “as is” to the fullest extent permitted by
        applicable Kenyan law. We do not warrant uninterrupted availability or
        that third-party listings (events, venues, rates) are complete.
      </LegalP>

      <LegalH2>8. Liability</LegalH2>
      <LegalP>
        To the maximum extent permitted by law, we are not liable for indirect
        or consequential losses (missed flights, park closures, third-party
        cancellations). Our aggregate liability for paid features is limited to
        fees you paid us in the three months before the claim.
      </LegalP>

      <LegalH2>9. Governing law</LegalH2>
      <LegalP>
        These Terms are governed by the laws of Kenya. Courts in Nairobi have
        exclusive jurisdiction, without prejudice to mandatory consumer
        protections that may apply.
      </LegalP>

      <LegalH2>10. Contact</LegalH2>
      <LegalP>
        Questions:{" "}
        <a className="font-semibold text-ocean underline" href="mailto:legal@swahilitrail.com">
          legal@swahilitrail.com
        </a>
        .
      </LegalP>
    </LegalShell>
  );
}
