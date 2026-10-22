import {
  LegalH2,
  LegalP,
  LegalShell,
  LegalUl,
} from "@/components/legal/legal-shell";

export const metadata = {
  title: "Privacy Policy · Swahili Trail",
  description: "How Swahili Trail collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="21 October 2026">
      <LegalP>
        Swahili Trail (“we”, “us”) helps you plan travel across Kenya. This
        policy explains what personal data we process when you use
        swahilitrail.com and related apps or APIs.
      </LegalP>

      <LegalH2>1. Who we are</LegalH2>
      <LegalP>
        Swahili Trail is operated for travelers and destination partners in
        Kenya. For privacy questions, contact{" "}
        <a className="font-semibold text-ocean underline" href="mailto:privacy@swahilitrail.com">
          privacy@swahilitrail.com
        </a>
        .
      </LegalP>

      <LegalH2>2. Data we collect</LegalH2>
      <LegalUl
        items={[
          "Account details: name, email, and authentication data via Clerk.",
          "Trip and planner inputs you save (destinations, dates, party size, preferences).",
          "Guide chat content you send to our AI features.",
          "Billing and payment metadata via Paystack (we do not store full card or M-Pesa PINs).",
          "Usage and device data: pages viewed, approximate location if you allow it, IP, browser type.",
          "Cookies and similar technologies as described in our Cookie Policy.",
        ]}
      />

      <LegalH2>3. How we use data</LegalH2>
      <LegalUl
        items={[
          "Provide trip planning, stay matching, events, and the multilingual guide.",
          "Process Trail Plus payments and prevent fraud or abuse.",
          "Improve product quality, safety, and fair-use limits on AI features.",
          "Send transactional messages (receipts, security alerts). Marketing only with consent where required.",
          "Comply with Kenyan law and respond to lawful requests.",
        ]}
      />

      <LegalH2>4. AI features</LegalH2>
      <LegalP>
        Guide, Planner, and Stay &amp; Eat may send prompts to AI providers to
        generate answers. Do not submit sensitive personal data (passports,
        national IDs, health records, or payment secrets) into AI chats. We
        apply rate limits and may log prompts to enforce abuse policies.
      </LegalP>

      <LegalH2>5. Sharing</LegalH2>
      <LegalP>
        We share data with processors who help us run the service: Clerk
        (auth), Paystack (payments), hosting/analytics providers, and AI
        infrastructure vendors under contract. We do not sell your personal
        data.
      </LegalP>

      <LegalH2>6. Retention</LegalH2>
      <LegalP>
        We keep account and trip data while your account is active and for a
        reasonable period afterward for backups, disputes, and legal duties.
        You may request deletion of your account data subject to lawful
        retention needs.
      </LegalP>

      <LegalH2>7. Your choices</LegalH2>
      <LegalUl
        items={[
          "Access or update profile details in Account settings.",
          "Request export or deletion by emailing privacy@swahilitrail.com.",
          "Withdraw location permission in your browser or device settings.",
          "Manage cookies as described in the Cookie Policy.",
        ]}
      />

      <LegalH2>8. Security</LegalH2>
      <LegalP>
        We use industry-standard safeguards (encryption in transit, access
        controls). No online service is perfectly secure; report concerns to
        privacy@swahilitrail.com.
      </LegalP>

      <LegalH2>9. Children</LegalH2>
      <LegalP>
        Swahili Trail is not directed at children under 16. If you believe a
        child provided data, contact us and we will take appropriate steps.
      </LegalP>

      <LegalH2>10. Changes</LegalH2>
      <LegalP>
        We may update this policy. Material changes will be reflected by the
        “Last updated” date and, where appropriate, an in-product notice.
      </LegalP>
    </LegalShell>
  );
}
