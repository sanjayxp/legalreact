// The business facts the legal pages have to state, in one place.
//
// These were bracketed placeholders scattered across Terms, Privacy, Refunds
// and Contact — including the Grievance Officer, which the DPDP Act requires
// a data fiduciary to publish. Anything still null renders as a visible
// "to be confirmed" marker rather than quietly reading as settled fact.
//
// Fill these in and every page updates together.

// Shown as "Last updated" on every legal page. Bump when the wording changes.
export const POLICY_LAST_UPDATED = '8 August 2026';

export const ORG = {
  // Registered entity and address, as they appear on incorporation documents.
  legalName: null,
  registeredAddress: null,

  // Where the public can reach you.
  supportEmail: null,
  supportPhone: null,
  supportHours: null,

  // Data protection. Required to be named and reachable under the DPDP Act.
  privacyEmail: null,
  grievanceOfficerName: null,
  grievanceOfficerEmail: null,
  grievanceResponseDays: 30,

  // Courts of which city have exclusive jurisdiction under the Terms.
  jurisdictionCity: null,

  // How long personal data is kept after an account closes.
  dataRetention: null,

  // Cancellation and refund windows.
  cancellationNoticeHours: null,
  refundProcessingDays: null,
  advocateDeclineRefundDays: null,
};

// True once nothing is left unfilled — lets a page warn while it is incomplete.
export const ORG_IS_COMPLETE = Object.values(ORG).every(
  (v) => v !== null && v !== undefined && String(v).trim() !== '',
);

// Reads a field for display. Missing values are marked rather than rendered as
// an empty string, so an incomplete policy is obvious instead of looking whole.
export function orgField(key) {
  const v = ORG[key];
  return v === null || v === undefined || String(v).trim() === '' ? null : String(v);
}
