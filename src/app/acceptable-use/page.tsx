import {
  LegalH2,
  LegalP,
  LegalShell,
  LegalUl,
} from "@/components/legal/legal-shell";

export const metadata = {
  title: "Acceptable Use Policy · Swahili Trail",
  description: "Rules for using Swahili Trail responsibly.",
};

export default function AcceptableUsePage() {
  return (
    <LegalShell title="Acceptable Use Policy" updated="21 October 2026">
      <LegalP>
        This policy sits alongside our Terms of Service. Violations may lead to
        rate limits, suspension, or termination.
      </LegalP>

      <LegalH2>You may</LegalH2>
      <LegalUl
        items={[
          "Plan personal or professional Kenya trips within fair-use limits.",
          "Use the guide for legitimate travel questions.",
          "Share feedback to help us improve destination information.",
        ]}
      />

      <LegalH2>You may not</LegalH2>
      <LegalUl
        items={[
          "Abuse AI features (spam, scraping outputs at scale, automated bots beyond published APIs).",
          "Attempt to bypass payment, quotas, or security controls.",
          "Upload malware, phishing content, or illegal material.",
          "Harass others or generate hateful, violent, or exploitative content.",
          "Misrepresent Swahili Trail as an official government booking channel.",
          "Resell access or raw model outputs as a competing product without permission.",
        ]}
      />

      <LegalH2>Reporting</LegalH2>
      <LegalP>
        Report abuse to{" "}
        <a className="font-semibold text-ocean underline" href="mailto:trust@swahilitrail.com">
          trust@swahilitrail.com
        </a>
        .
      </LegalP>
    </LegalShell>
  );
}
