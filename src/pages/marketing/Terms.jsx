import { POLICY_LAST_UPDATED } from '../../lib/orgDetails';
import LegalPageLayout, { LegalSection, LegalList, Placeholder, OrgField } from '../../components/marketing/LegalPageLayout';

export default function Terms() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      updated={POLICY_LAST_UPDATED}
      intro="These Terms govern your use of LegalConnects. By creating an account or using the Service, you agree to them."
    >
      <LegalSection title="1. What LegalConnects is">
        <p>
          LegalConnects is a technology platform that helps clients find Bar Council-verified advocates and helps advocates manage bookings, cases, and clients. LegalConnects is <strong>not a law firm</strong>, does not provide legal advice, and is not a party to any engagement between a client and an advocate.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts">
        <LegalList
          items={[
            'You must provide accurate information when creating an account and keep it up to date.',
            'You are responsible for activity under your account and for keeping your password confidential.',
            'Advocate accounts are subject to Bar Council enrolment verification before a public profile is shown.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Advocate listings and verification">
        <p>
          We verify the Bar Council enrolment details advocates submit in good faith, but we do not guarantee the accuracy of any advocate's self-reported experience, fees, or availability, and we do not vouch for the outcome of any matter. Engaging an advocate found through the Service creates a direct relationship between you and that advocate — not with LegalConnects.
        </p>
      </LegalSection>

      <LegalSection title="4. Bookings, fees, and payments">
        <p>
          Consultation fees are set by individual advocates and are payable as agreed between the client and advocate. <Placeholder>Describe how payments are processed on the platform, if applicable — e.g. via a payment gateway, or offline between client and advocate.</Placeholder> See our <a href="/refund-policy" className="font-semibold text-brand-600 hover:underline">Refund & Cancellation Policy</a> for cancellation terms.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            'Impersonate any person or misrepresent your affiliation, including false claims of Bar Council enrolment.',
            'Use the Service to send unsolicited or unlawful communications.',
            'Attempt to access accounts, data, or systems you are not authorized to access.',
            'Post defamatory, obscene, or unlawful content in Legal Q&A or elsewhere on the platform.',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Third-party data">
        <p>
          Case status shown via "Track Your Case" is retrieved from the public eCourts data network. We do not control or guarantee the accuracy, completeness, or timeliness of this third-party data.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>The LegalConnects name, logo, and platform design are our property. Content you submit (profiles, questions, documents) remains yours; you grant us a licence to host and display it as needed to operate the Service.</p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, LegalConnects is not liable for any indirect, incidental, or consequential damages arising from use of the Service, including outcomes of legal matters, advice given by advocates, or third-party data accuracy.
        </p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>We may suspend or terminate accounts that violate these Terms or applicable law. You may close your account at any time by contacting support.</p>
      </LegalSection>

      <LegalSection title="10. Governing law">
        <p>These Terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of the courts of <OrgField name="jurisdictionCity" hint="city, e.g. New Delhi" />.</p>
      </LegalSection>

      <LegalSection title="11. Changes to these Terms">
        <p>We may update these Terms from time to time; continued use of the Service after changes constitutes acceptance.</p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Questions about these Terms can be directed via the <a href="/contact" className="font-semibold text-brand-600 hover:underline">Contact page</a>.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
