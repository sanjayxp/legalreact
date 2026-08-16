// The business facts the legal pages have to state, in one place.
//
// These were bracketed placeholders scattered across Terms, Privacy, Refunds
// and Contact — including the Grievance Officer, which the DPDP Act requires
// a data fiduciary to publish. Anything still null renders as a visible
// "to be confirmed" marker rather than quietly reading as settled fact.
//
// Fill these in and every page updates together.

// Shown as "Last updated" on every legal page. Bump when the wording changes.
export const POLICY_LAST_UPDATED = '16 August 2026';

export const ORG = {
  // Registered entity and address, as they appear on incorporation documents.
  // Not yet incorporated — kept as a placeholder deliberately rather than
  // guessed, since a wrong legal name here is a real liability issue.
  legalName: null,
  registeredAddress: 'Gurgaon, Haryana, India',

  // Where the public can reach you.
  supportEmail: 'support@legalconnects.in',
  supportPhone: null,
  supportHours: null,

  // Data protection. Required to be named and reachable under the DPDP Act.
  privacyEmail: 'support@legalconnects.in',
  // Name intentionally left as a placeholder until a specific person is
  // formally designated — the DPDP Act requires this to be a real named
  // individual, not a generic team inbox. The contact email is real.
  grievanceOfficerName: null,
  grievanceOfficerEmail: 'support@legalconnects.in',
  grievanceResponseDays: '30 days',

  // Courts of which city have exclusive jurisdiction under the Terms.
  jurisdictionCity: 'Gurgaon, Haryana',

  // How long personal data is kept after an account closes.
  dataRetention: '7 years',

  // Public profiles. Only the ones filled in are shown — a social icon that
  // leads nowhere is worse than no icon.
  linkedinUrl: null,
  instagramUrl: null,

  // Cancellation and refund windows.
  cancellationNoticeHours: '4 hours',
  refundProcessingDays: '5–7 business days',
  advocateDeclineRefundDays: '3 business days',
};

// True once the fields the legal pages depend on are filled. Social profiles
// are optional and deliberately excluded — the site is complete without them.
const OPTIONAL_KEYS = ['linkedinUrl', 'instagramUrl'];
export const ORG_IS_COMPLETE = Object.entries(ORG)
  .filter(([k]) => !OPTIONAL_KEYS.includes(k))
  .every(([, v]) => v !== null && v !== undefined && String(v).trim() !== '');

// Reads a field for display. Missing values are marked rather than rendered as
// an empty string, so an incomplete policy is obvious instead of looking whole.
export function orgField(key) {
  const v = ORG[key];
  return v === null || v === undefined || String(v).trim() === '' ? null : String(v);
}
