import { POLICY_LAST_UPDATED } from '../../lib/orgDetails';
import LegalPageLayout, { LegalSection } from '../../components/marketing/LegalPageLayout';

export default function Disclaimer() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Disclaimer"
      updated={POLICY_LAST_UPDATED}
    >
      <LegalSection title="No advertisement or solicitation">
        <p>
          The Bar Council of India does not permit advocates to advertise or solicit work. By accessing this website, you acknowledge that you are seeking information about advocates on the platform on your own initiative, and that there has been no advertisement, personal communication, solicitation, invitation, or inducement of any kind from LegalConnects or any advocate listed on it to solicit work through this website.
        </p>
      </LegalSection>

      <LegalSection title="Not legal advice">
        <p>
          Nothing on this website — including advocate profiles, Legal Q&A content, or general information pages — constitutes legal advice. No attorney-client relationship is formed by browsing this website, viewing an advocate's profile, or posting a question. An attorney-client relationship is formed only when an advocate expressly agrees to take on a matter.
        </p>
      </LegalSection>

      <LegalSection title="Verification, not endorsement">
        <p>
          We check advocate profiles against Bar Council enrolment records as a baseline verification step. This does not constitute an endorsement, recommendation, or guarantee of any advocate's competence, conduct, or the outcome of any matter. Clients should exercise their own judgement when selecting and engaging an advocate.
        </p>
      </LegalSection>

      <LegalSection title="Third-party case data">
        <p>
          Case status information shown via "Track Your Case" is sourced from the public eCourts data network and may be incomplete, delayed, or inaccurate. It should not be relied upon as the sole or authoritative source — please confirm directly with the relevant court or your advocate.
        </p>
      </LegalSection>

      <LegalSection title="Limitation">
        <p>LegalConnects is a technology platform, not a law firm, and does not practise law. See our <a href="/terms" className="font-semibold text-brand-600 hover:underline">Terms of Service</a> for the full limitation of liability.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
