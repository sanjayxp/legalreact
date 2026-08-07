import {
  Car, Receipt, Home as HomeIcon, KeyRound, HeartCrack, Baby, Briefcase,
  ShoppingBag, Gavel, Building2, ScrollText, FileWarning, ShieldAlert,
  Percent, Lightbulb, Plane, MessageCircleQuestion,
} from 'lucide-react';

// What someone actually needs done, in their words — not the legal discipline
// it belongs to. A person who has just been fined knows they have a challan;
// they do not know whether that is civil or criminal. Each type still maps to
// a practice area so matching and advocate profiles keep working unchanged.
//
// Fields are declared here rather than built in an admin screen on purpose:
// a static list stays readable and is quick to change, and a form builder is
// far more machinery than a couple of dozen types justify.

export const MATTER_TYPES = [
  {
    slug: 'traffic-challan',
    label: 'Traffic challan',
    blurb: 'Contest a fine or get advice on an e-challan',
    icon: Car,
    tint: 'gold',
    area: 'Criminal',
    fields: [
      { name: 'vehicle_no', label: 'Vehicle number', placeholder: 'e.g. MH12AB1234' },
      { name: 'challan_no', label: 'Challan number', placeholder: 'If you have it', optional: true },
      { name: 'offence', label: 'What was the challan for?', placeholder: 'e.g. no helmet, signal jump, overspeeding' },
      {
        name: 'intent',
        label: 'What would you like to do?',
        type: 'select',
        options: ['Not sure — please advise', 'Contest the challan', 'Understand what it will cost'],
      },
    ],
  },
  {
    slug: 'cheque-bounce',
    label: 'Cheque bounce',
    blurb: 'A cheque was dishonoured, either way round',
    icon: Receipt,
    tint: 'coral',
    area: 'Civil',
    fields: [
      { name: 'side', label: 'Which side are you on?', type: 'select', options: ['The cheque was given to me', 'I issued the cheque'] },
      { name: 'amount', label: 'Cheque amount (₹)', type: 'number' },
      { name: 'bounce_date', label: 'When was it returned?', type: 'date', optional: true },
      { name: 'notice_sent', label: 'Has a legal notice been sent?', type: 'select', options: ['Not yet', 'Yes, notice sent', 'Not sure'] },
    ],
  },
  {
    slug: 'property-papers',
    label: 'Property papers',
    blurb: 'Sale deed, registration, title check',
    icon: HomeIcon,
    tint: 'brand',
    area: 'Property & Real Estate',
    fields: [
      { name: 'transaction', label: 'What are you doing?', type: 'select', options: ['Buying', 'Selling', 'Gifting or inheriting', 'Checking the title', 'Something else'] },
      { name: 'property_type', label: 'Type of property', type: 'select', options: ['Flat or apartment', 'Independent house', 'Plot of land', 'Commercial', 'Agricultural'] },
      { name: 'stage', label: 'Where are you up to?', placeholder: 'e.g. agreement signed, registration pending', optional: true },
    ],
  },
  {
    slug: 'rent-tenancy',
    label: 'Rent & tenancy',
    blurb: 'Agreements, deposits, eviction',
    icon: KeyRound,
    tint: 'emerald',
    area: 'Property & Real Estate',
    fields: [
      { name: 'role', label: 'Are you the landlord or the tenant?', type: 'select', options: ['Tenant', 'Landlord'] },
      { name: 'issue', label: 'What do you need?', type: 'select', options: ['Draft or review an agreement', 'Deposit not returned', 'Eviction', 'Rent increase dispute', 'Something else'] },
      { name: 'monthly_rent', label: 'Monthly rent (₹)', type: 'number', optional: true },
    ],
  },
  {
    slug: 'divorce-separation',
    label: 'Divorce & separation',
    blurb: 'Mutual consent or contested',
    icon: HeartCrack,
    tint: 'violet',
    area: 'Family',
    fields: [
      { name: 'route', label: 'How are you proceeding?', type: 'select', options: ['Not sure yet', 'Mutual consent', 'Contested'] },
      { name: 'married_since', label: 'Year of marriage', type: 'number', placeholder: 'e.g. 2016', optional: true },
      { name: 'children', label: 'Are children involved?', type: 'select', options: ['No', 'Yes'] },
      { name: 'living_apart', label: 'How long have you lived separately?', placeholder: 'e.g. 14 months', optional: true },
    ],
  },
  {
    slug: 'maintenance-custody',
    label: 'Maintenance & custody',
    blurb: 'Support payments and child custody',
    icon: Baby,
    tint: 'violet',
    area: 'Family',
    fields: [
      { name: 'seeking', label: 'What are you seeking?', type: 'select', options: ['Maintenance', 'Child custody', 'Both', 'Changing an existing order'] },
      { name: 'existing_order', label: 'Is there already a court order?', type: 'select', options: ['No', 'Yes'] },
      { name: 'children_ages', label: 'Ages of the children', placeholder: 'e.g. 6 and 11', optional: true },
    ],
  },
  {
    slug: 'employment-dues',
    label: 'Salary & job issues',
    blurb: 'Unpaid dues, termination, harassment',
    icon: Briefcase,
    tint: 'brand',
    area: 'Labour & Employment',
    fields: [
      { name: 'issue', label: 'What has happened?', type: 'select', options: ['Salary or dues not paid', 'Terminated unfairly', 'Forced to resign', 'Harassment at work', 'Something else'] },
      { name: 'employer', label: 'Employer name', optional: true },
      { name: 'amount_owed', label: 'Amount outstanding (₹)', type: 'number', optional: true },
      { name: 'last_working_day', label: 'Last working day', type: 'date', optional: true },
    ],
  },
  {
    slug: 'consumer-complaint',
    label: 'Consumer complaint',
    blurb: 'Faulty goods, bad service, refunds',
    icon: ShoppingBag,
    tint: 'gold',
    area: 'Consumer',
    fields: [
      { name: 'against', label: 'Who is the complaint against?', placeholder: 'Seller, brand or service provider' },
      { name: 'amount', label: 'Amount involved (₹)', type: 'number', optional: true },
      { name: 'purchased_on', label: 'Date of purchase or service', type: 'date', optional: true },
      { name: 'issue', label: 'What went wrong?', type: 'textarea' },
    ],
  },
  {
    slug: 'fir-bail-criminal',
    label: 'FIR, bail & criminal',
    blurb: 'Police complaint, arrest, bail',
    icon: Gavel,
    tint: 'coral',
    area: 'Criminal',
    urgent: true,
    fields: [
      { name: 'stage', label: 'Where does it stand?', type: 'select', options: ['Considering filing a complaint', 'FIR has been registered', 'Someone has been arrested', 'Court proceedings started'] },
      { name: 'police_station', label: 'Police station', optional: true },
      { name: 'sections', label: 'Sections mentioned, if you know them', placeholder: 'e.g. BNS 318', optional: true },
      { name: 'custody', label: 'Is anyone currently in custody?', type: 'select', options: ['No', 'Yes'] },
    ],
  },
  {
    slug: 'legal-notice',
    label: 'Legal notice',
    blurb: 'Send one, or reply to one you received',
    icon: FileWarning,
    tint: 'gold',
    area: 'Civil',
    fields: [
      { name: 'direction', label: 'Which is it?', type: 'select', options: ['I received a notice', 'I want to send a notice'] },
      { name: 'deadline', label: 'Deadline to reply, if stated', type: 'date', optional: true },
      { name: 'subject', label: 'What is it about?', type: 'textarea' },
    ],
  },
  {
    slug: 'will-succession',
    label: 'Will & inheritance',
    blurb: 'Drafting a will, succession disputes',
    icon: ScrollText,
    tint: 'emerald',
    area: 'Civil',
    fields: [
      { name: 'need', label: 'What do you need?', type: 'select', options: ['Draft a will', 'Succession or legal heir certificate', 'Dispute over inheritance', 'Probate'] },
      { name: 'will_exists', label: 'Is there an existing will?', type: 'select', options: ['No', 'Yes', 'Not sure'] },
      { name: 'assets', label: 'What does the estate involve?', placeholder: 'e.g. a flat and bank accounts', optional: true },
    ],
  },
  {
    slug: 'cyber-fraud',
    label: 'Cyber fraud & harassment',
    blurb: 'Online scams, blackmail, defamation',
    icon: ShieldAlert,
    tint: 'coral',
    area: 'Cyber Law',
    urgent: true,
    fields: [
      { name: 'incident', label: 'What happened?', type: 'select', options: ['Money lost to a scam', 'Account or identity misused', 'Blackmail or harassment', 'Defamatory content posted', 'Something else'] },
      { name: 'amount_lost', label: 'Amount lost (₹)', type: 'number', optional: true },
      { name: 'reported', label: 'Reported on cybercrime.gov.in or to police?', type: 'select', options: ['Not yet', 'Yes'] },
      { name: 'when', label: 'When did it happen?', type: 'date', optional: true },
    ],
  },
  {
    slug: 'company-setup',
    label: 'Company & startup',
    blurb: 'Incorporation, agreements, compliance',
    icon: Building2,
    tint: 'brand',
    area: 'Corporate',
    fields: [
      { name: 'need', label: 'What do you need?', type: 'select', options: ['Incorporate a company or LLP', 'Founder or shareholder agreement', 'Contracts and vendor agreements', 'ROC compliance', 'Something else'] },
      { name: 'entity', label: 'Entity type, if decided', type: 'select', options: ['Not decided', 'Private limited', 'LLP', 'One person company', 'Partnership'], optional: true },
    ],
  },
  {
    slug: 'tax-notice',
    label: 'Tax notice',
    blurb: 'Income tax or GST demands and scrutiny',
    icon: Percent,
    tint: 'gold',
    area: 'Tax',
    fields: [
      { name: 'kind', label: 'Which tax?', type: 'select', options: ['Income tax', 'GST', 'Not sure'] },
      { name: 'year', label: 'Assessment year or period', placeholder: 'e.g. AY 2024-25', optional: true },
      { name: 'amount', label: 'Amount demanded (₹)', type: 'number', optional: true },
      { name: 'deadline', label: 'Date to respond by', type: 'date', optional: true },
    ],
  },
  {
    slug: 'trademark-copyright',
    label: 'Trademark & copyright',
    blurb: 'Protect a brand or tackle copying',
    icon: Lightbulb,
    tint: 'violet',
    area: 'IP',
    fields: [
      { name: 'need', label: 'What do you need?', type: 'select', options: ['Register a trademark', 'Register a copyright', 'Someone is copying my work', 'I received an infringement notice'] },
      { name: 'what', label: 'What is being protected?', placeholder: 'e.g. a brand name, a logo, written work', optional: true },
    ],
  },
  {
    slug: 'visa-immigration',
    label: 'Visa & immigration',
    blurb: 'Visas, OCI, citizenship and passports',
    icon: Plane,
    tint: 'emerald',
    area: 'Immigration',
    fields: [
      { name: 'need', label: 'What do you need help with?', type: 'select', options: ['Visa application or refusal', 'OCI card', 'Citizenship', 'Passport issue', 'Something else'] },
      { name: 'country', label: 'Which country?', optional: true },
    ],
  },
  {
    slug: 'other',
    label: 'Something else',
    blurb: "Tell us in your own words",
    icon: MessageCircleQuestion,
    tint: 'slate',
    area: '',
    fields: [],
  },
];

export function findMatterType(slug) {
  return MATTER_TYPES.find((t) => t.slug === slug) || null;
}

// Turns the per-type answers into the one line an advocate reads on the board,
// so the summary stays useful even where nothing renders the structured detail.
export function summariseMatter(type, details, freeText) {
  if (!type) return freeText || '';
  const parts = (type.fields || [])
    .map((f) => {
      const v = details?.[f.name];
      if (v === undefined || v === null || String(v).trim() === '') return null;
      return `${f.label}: ${String(v).trim()}`;
    })
    .filter(Boolean);
  if (freeText?.trim()) parts.push(freeText.trim());
  return [type.label, parts.join(' · ')].filter(Boolean).join(' — ');
}
