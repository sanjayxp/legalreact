import LegalPageLayout, { LegalSection, LegalList, Placeholder } from '../../components/marketing/LegalPageLayout';

export default function Privacy() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      updated="[date]"
      intro="This Privacy Policy explains what personal data LegalConnects collects, why, and how it is used, shared, and protected, in line with the Digital Personal Data Protection Act, 2023 (DPDP Act)."
    >
      <LegalSection title="1. Who this applies to">
        <p>
          This policy applies to clients, advocates, and visitors using the LegalConnects website and platform (the "Service"), operated by <Placeholder>registered entity name</Placeholder>, <Placeholder>registered address</Placeholder> ("we", "us").
        </p>
      </LegalSection>

      <LegalSection title="2. Data we collect">
        <LegalList
          items={[
            'Account data: name, email, phone number, password (stored hashed), and role (client, advocate, or admin).',
            'Advocate verification data: Bar Council enrolment number, state bar council, enrolment year, bar certificate upload, and related identity documents.',
            'Case & booking data: consultation requests, booking times, case details you or your advocate enter, uploaded documents, invoices.',
            'Communications: questions and answers posted on Legal Q&A, messages to advocates, support enquiries.',
            'Usage data: pages visited, device and browser type, IP address, and cookies (see Section 7).',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Why we process your data">
        <LegalList
          items={[
            'To create and manage your account and verify advocate credentials.',
            'To match clients with advocates by practice area, city, and availability.',
            'To operate bookings, case tracking, invoicing, and related platform features.',
            'To send transactional communications — account confirmation, welcome messages, booking and case updates.',
            'To maintain platform safety, prevent fraud, and comply with legal obligations.',
            'To improve the Service based on aggregated, non-identifying usage patterns.',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Legal basis and consent">
        <p>
          We process personal data on the basis of your consent at sign-up, and where necessary to perform our obligations to you (providing the booking, case-tracking, and matching features you sign up for). You may withdraw consent at any time by contacting us, though this may limit your ability to use parts of the Service.
        </p>
      </LegalSection>

      <LegalSection title="5. Who we share data with">
        <LegalList
          items={[
            'The advocate or client involved in a specific booking or case, to the extent needed to provide the service.',
            'Service providers who process data on our behalf: our database and hosting provider (Supabase), transactional email provider, and — where used — the eCourts public data network for case status lookups.',
            'Regulators or authorities, where required by law.',
          ]}
        />
        <p>We do not sell personal data.</p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We retain account and case data for as long as your account is active, and for <Placeholder>retention period, e.g. 7 years</Placeholder> afterward where needed for legal, tax, or dispute-resolution purposes. You can request earlier deletion under Section 8.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <p>
          We use essential cookies to keep you signed in and remember basic preferences. We do not currently use third-party advertising or tracking cookies. <Placeholder>Update this section if analytics or marketing cookies are added later.</Placeholder>
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>Under the DPDP Act, 2023, you have the right to:</p>
        <LegalList
          items={[
            'Access the personal data we hold about you.',
            'Correct or update inaccurate or incomplete data.',
            'Withdraw consent and request erasure of your data, subject to legal retention requirements.',
            'Nominate another individual to exercise your rights in the event of death or incapacity.',
            'Lodge a grievance with our Grievance Officer, and escalate to the Data Protection Board of India if unresolved.',
          ]}
        />
        <p>To exercise any of these rights, contact our Grievance Officer — see the <a href="/contact" className="font-semibold text-brand-600 hover:underline">Contact page</a>.</p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We use industry-standard safeguards — encrypted connections, access-controlled databases, and row-level security on sensitive tables — to protect your data. No system is completely secure, and we encourage you to use a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="10. Children's data">
        <p>The Service is not directed at individuals under 18. We do not knowingly collect data from minors without verifiable parental consent.</p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>We may update this policy from time to time. Material changes will be notified via the platform or by email.</p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Questions about this policy or your data can be directed to <Placeholder>privacy email address</Placeholder>, or via the <a href="/contact" className="font-semibold text-brand-600 hover:underline">Contact page</a>.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
