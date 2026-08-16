import { POLICY_LAST_UPDATED } from '../../lib/orgDetails';
import LegalPageLayout, { LegalSection, LegalList, OrgField } from '../../components/marketing/LegalPageLayout';

export default function RefundPolicy() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      updated={POLICY_LAST_UPDATED}
      intro="This policy covers cancelling or rescheduling a booked consultation, and how refunds — where applicable — are handled."
    >
      <LegalSection title="1. Cancelling a booking">
        <p>
          Clients can cancel or reschedule a requested or confirmed consultation from their dashboard up to <OrgField name="cancellationNoticeHours" hint="e.g. 4 hours" /> before the scheduled time at no charge. Cancellations after that window, or missed appointments, may not be eligible for a refund.
        </p>
      </LegalSection>

      <LegalSection title="2. Advocate-side cancellations">
        <p>
          If an advocate cancels a confirmed booking, the client will be offered a reschedule or a full refund of any fee already paid, at the client's choice.
        </p>
      </LegalSection>

      <LegalSection title="3. Refund method and timeline">
        <p>
          LegalConnects does not process consultation payments — fees are paid directly to the advocate, by whatever method they agree with the client. Where a fee has been paid and a refund becomes due under this policy (Section 2), it is the advocate's responsibility to issue it, by the same method the payment was made, within <OrgField name="refundProcessingDays" hint="e.g. 5–7 business days" />. Contact us if an advocate does not honour a refund you are entitled to under this policy.
        </p>
      </LegalSection>

      <LegalSection title="4. Fees outside our control">
        <p>Consultation fees are set independently by each advocate. LegalConnects does not set, mark up, or guarantee any advocate's fee, and disputes over fees for services already rendered should be raised directly with the advocate in the first instance.</p>
      </LegalSection>

      <LegalSection title="5. Non-refundable items">
        <LegalList
          items={[
            'Consultations already completed.',
            'No-shows without prior cancellation, subject to the window in Section 1.',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. How to request a refund">
        <p>Contact us via the <a href="/contact" className="font-semibold text-brand-600 hover:underline">Contact page</a> with your booking details, and we will respond within <OrgField name="advocateDeclineRefundDays" hint="e.g. 3 business days" />.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
