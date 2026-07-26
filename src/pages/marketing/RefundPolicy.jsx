import LegalPageLayout, { LegalSection, LegalList, Placeholder } from '../../components/marketing/LegalPageLayout';

export default function RefundPolicy() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      updated="[date]"
      intro="This policy covers cancelling or rescheduling a booked consultation, and how refunds — where applicable — are handled."
    >
      <LegalSection title="1. Cancelling a booking">
        <p>
          Clients can cancel or reschedule a requested or confirmed consultation from their dashboard up to <Placeholder>e.g. 4 hours</Placeholder> before the scheduled time at no charge. Cancellations after that window, or missed appointments, may not be eligible for a refund.
        </p>
      </LegalSection>

      <LegalSection title="2. Advocate-side cancellations">
        <p>
          If an advocate cancels a confirmed booking, the client will be offered a reschedule or a full refund of any fee already paid, at the client's choice.
        </p>
      </LegalSection>

      <LegalSection title="3. Refund method and timeline">
        <p>
          Eligible refunds are issued to the original payment method within <Placeholder>e.g. 5–7 business days</Placeholder>. <Placeholder>Update this section once a payment gateway is integrated — include any processing fees that are non-refundable.</Placeholder>
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
        <p>Contact us via the <a href="/contact" className="font-semibold text-brand-600 hover:underline">Contact page</a> with your booking details, and we will respond within <Placeholder>e.g. 3 business days</Placeholder>.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
