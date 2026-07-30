// ============================================================
// LegalConnects — Document generator templates
// Pure client-side, no DB dependency. Each template defines the
// fields to collect and a render() function that returns the
// filled document BODY as HTML. renderDocument() wraps that body
// with a shared letterhead, formal title block, print-ready
// typography, and a closing disclaimer — every template gets the
// same professional shell rather than reinventing it.
//
// These are starting-point drafts only — every generated document
// carries a footer note reminding the advocate to review and adapt
// it before use. Not a substitute for the advocate's own judgment.
// ============================================================

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function nl(s) {
  return esc(s).replace(/\n/g, '<br>');
}
function today() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function lines(s) {
  return String(s || '').split('\n').map(l => l.trim()).filter(Boolean);
}
// A numbered clause with a bold heading — the basic unit almost every
// template is built from, so headings/spacing/pagination stay consistent.
function clause(number, heading, bodyHtml) {
  return `<div class="clause"><p><b>${number}. ${esc(heading)}</b></p>${bodyHtml}</div>`;
}
function clauseList(items) {
  return `<ol class="clause-list">${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
}
function signatureRow(leftLabel, leftName, rightLabel, rightName) {
  return `
    <table class="sig-table"><tr>
      <td><div class="sig-line"></div><b>${esc(leftLabel)}</b>${leftName ? `<br>${esc(leftName)}` : ''}</td>
      <td><div class="sig-line"></div><b>${esc(rightLabel)}</b>${rightName ? `<br>${esc(rightName)}` : ''}</td>
    </tr></table>`;
}
function witnessBlock(w1, w2) {
  return `
    <div class="clause">
      <p><b>Witnesses:</b></p>
      <table class="sig-table"><tr>
        <td><div class="sig-line"></div>1. ${esc(w1 || '')}</td>
        <td><div class="sig-line"></div>2. ${esc(w2 || '')}</td>
      </tr></table>
    </div>`;
}

// Shared closing boilerplate most contracts need — parameterized so it
// reads naturally regardless of which template calls it.
function boilerplateClauses(startNum, f, opts = {}) {
  const state = f.governing_state || 'India';
  const disputeMode = opts.disputeMode || 'arbitration under the Arbitration and Conciliation Act, 1996';
  let n = startNum;
  const out = [];
  out.push(clause(n++, 'Entire Agreement', `<p>This document constitutes the entire understanding between the parties on the subject matter herein and supersedes all prior discussions, negotiations, and agreements, whether oral or written.</p>`));
  out.push(clause(n++, 'Amendment', `<p>No amendment or modification to this document shall be valid unless made in writing and signed by all parties.</p>`));
  out.push(clause(n++, 'Severability', `<p>If any provision of this document is held invalid or unenforceable by a competent authority, the remaining provisions shall continue in full force and effect.</p>`));
  out.push(clause(n++, 'Notices', `<p>All notices required under this document shall be in writing and shall be deemed duly given when delivered by hand, registered post, or email to the addresses of the parties set out above.</p>`));
  out.push(clause(n++, 'Dispute Resolution', `<p>The parties shall first attempt to resolve any dispute arising out of or in connection with this document amicably through mutual discussion. Failing amicable resolution within 30 days, the dispute shall be referred to ${disputeMode}, and the seat of such proceedings shall be at the place stated above.</p>`));
  out.push(clause(n++, 'Governing Law & Jurisdiction', `<p>This document shall be governed by and construed in accordance with the laws of ${esc(state)}, and the courts at the place stated above shall have exclusive jurisdiction, subject to the dispute resolution clause.</p>`));
  out.push(clause(n++, 'Counterparts', `<p>This document may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.</p>`));
  return { html: out.join(''), next: n };
}

// ---------- Shared letterhead fields (optional, apply to every template) ----------
const LETTERHEAD_FIELDS = [
  { key: 'firm_name', label: 'Law firm / chamber name', type: 'text', placeholder: 'e.g. Rawat & Associates', group: 'letterhead' },
  { key: 'firm_address', label: 'Firm address', type: 'textarea', group: 'letterhead' },
  { key: 'firm_contact', label: 'Firm phone / email', type: 'text', group: 'letterhead' },
];

// ---------- Shared print/document styling, injected once per render ----------
const DOC_STYLE = `
<style>
  @page { size: A4; margin: 22mm 20mm; }
  .doc-shell { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.65; font-size: 13.5px; }
  .doc-shell p { margin: 0 0 10px; }
  .doc-letterhead { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 22px; }
  .doc-firm { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
  .doc-advocate { font-size: 12.5px; margin-top: 2px; }
  .doc-contact { font-size: 11px; color: #444; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 22px; text-decoration: underline; text-underline-offset: 4px; }
  .doc-body .clause { margin-bottom: 14px; page-break-inside: avoid; }
  .doc-body .clause-list { padding-left: 20px; margin: 6px 0 10px; }
  .doc-body .clause-list li { margin-bottom: 7px; page-break-inside: avoid; }
  .doc-body .recitals p { margin-bottom: 8px; }
  .sig-table { width: 100%; margin-top: 28px; page-break-inside: avoid; }
  .sig-table td { width: 50%; vertical-align: top; padding-right: 24px; font-size: 13px; }
  .sig-line { border-bottom: 1px solid #1a1a1a; height: 34px; margin-bottom: 4px; }
  .doc-footer-note { margin-top: 32px; padding-top: 10px; border-top: 1px solid #ccc; font-family: var(--font-body, sans-serif); font-size: 10.5px; color: #777; line-height: 1.5; }
  .doc-annexure-title { page-break-before: always; text-align: center; font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0 0 16px; }
</style>`;

export function renderDocument(template, fields) {
  const body = template.render(fields);
  const firmName = fields.firm_name || '';
  const contact = [fields.firm_contact].filter(Boolean).join(' · ');
  const hasLetterhead = firmName || fields.firm_address || fields.firm_contact;
  return `
    ${DOC_STYLE}
    <div class="doc-shell">
      ${hasLetterhead ? `
      <div class="doc-letterhead">
        ${firmName ? `<div class="doc-firm">${esc(firmName)}</div>` : ''}
        ${fields.firm_address ? `<div class="doc-contact">${nl(fields.firm_address)}</div>` : ''}
        ${contact ? `<div class="doc-contact">${esc(contact)}</div>` : ''}
      </div>` : ''}
      <div class="doc-title">${esc(template.title)}</div>
      <div class="doc-body">${body}</div>
      <div class="doc-footer-note">This document was generated as a drafting aid via LegalConnects. It is a starting-point draft only — review, adapt, and have it executed under the supervision of a licensed advocate before relying on it. It does not constitute legal advice.</div>
    </div>
  `;
}

function withLetterhead(fields) {
  return [...LETTERHEAD_FIELDS, ...fields];
}

export const DOC_TEMPLATES = [
  {
    key: 'legal_notice',
    title: 'Legal Notice / Demand Letter',
    blurb: 'A formal notice demanding action (payment, refund, compliance) before litigation.',
    fields: withLetterhead([
      { key: 'recipient_name', label: "Recipient's name", type: 'text', required: true },
      { key: 'recipient_address', label: "Recipient's address", type: 'textarea', required: true },
      { key: 'client_name', label: 'Your client\'s name (the sender)', type: 'text', required: true },
      { key: 'client_address', label: "Client's address", type: 'textarea', required: true },
      { key: 'subject', label: 'Subject line', type: 'text', placeholder: 'e.g. Legal Notice for Recovery of Security Deposit', required: true },
      { key: 'facts', label: 'Facts of the matter (one point per line)', type: 'textarea', required: true, placeholder: 'That my client engaged you for...\nThat despite repeated requests...' },
      { key: 'demand', label: 'What you are demanding (one point per line)', type: 'textarea', required: true },
      { key: 'legal_basis', label: 'Legal basis / provisions relied upon', type: 'textarea', placeholder: 'e.g. Section 138 of the Negotiable Instruments Act, 1881; breach of contract under the Indian Contract Act, 1872' },
      { key: 'notice_days', label: 'Days given to comply', type: 'number', placeholder: '15' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text', placeholder: 'e.g. Maharashtra' },
      { key: 'advocate_name', label: 'Advocate name', type: 'text', required: true },
      { key: 'enrollment_no', label: 'Bar Council enrolment number', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
    ]),
    render(f) {
      const facts = lines(f.facts);
      const demands = lines(f.demand);
      return `
        <p style="text-align:right">Ref: LN/${new Date().getFullYear()}/${esc(f.client_name || '').slice(0,3).toUpperCase()}</p>
        <p style="text-align:right">${today()}</p>
        <p><b>By Registered Post A.D. / Speed Post / Email</b></p>
        <p><b>To,</b><br>${nl(f.recipient_name)}<br>${nl(f.recipient_address)}</p>
        <p><b>Subject: ${esc(f.subject)}</b></p>
        <p>Sir/Madam,</p>
        <p>Under instructions from and on behalf of my client, <b>${esc(f.client_name)}</b>, residing/registered at ${esc(f.client_address)} (hereinafter "my Client"), I hereby serve upon you the following legal notice:</p>
        ${clause(1, 'Facts of the Matter', clauseList(facts.length ? facts.map(esc) : [esc(f.facts)]))}
        ${clause(2, 'Cause of Action', `<p>The above facts disclose a clear cause of action against you, and but for your acts and omissions as set out above, my Client would not have been compelled to issue this notice.</p>`)}
        ${f.legal_basis ? clause(3, 'Legal Basis', `<p>The above claim is made without prejudice to any other rights and remedies available to my Client, and is founded, inter alia, on ${nl(f.legal_basis)}.</p>`) : ''}
        ${clause(f.legal_basis ? 4 : 3, 'Demand', clauseList(demands.length ? demands.map(esc) : [esc(f.demand)]))}
        <p>You are hereby called upon to comply with the above demand(s) within <b>${esc(f.notice_days || '15')} days</b> of receipt of this notice, failing which my Client shall be constrained to initiate appropriate civil and/or criminal proceedings against you before a court of competent jurisdiction${f.governing_state ? ' in ' + esc(f.governing_state) : ''}, entirely at your risk as to costs and consequences, without any further reference to you.</p>
        <p>Please note that this notice is issued without prejudice to any other rights and remedies available to my Client under law, all of which are expressly reserved.</p>
        <p>A copy of this notice, together with the instructions received, has been retained in my office for record and further necessary action.</p>
        <p style="margin-top:32px">Yours faithfully,</p>
        <p style="margin-top:48px"><b>${esc(f.advocate_name)}</b><br>${f.enrollment_no ? 'Enrolment No: ' + esc(f.enrollment_no) + '<br>' : ''}Advocate for ${esc(f.client_name)}${f.place ? ', ' + esc(f.place) : ''}</p>
      `;
    },
  },
  {
    key: 'vakalatnama',
    title: 'Vakalatnama',
    blurb: 'Authorizes an advocate to appear and act on behalf of a client in a specific case.',
    fields: withLetterhead([
      { key: 'court_name', label: 'Court name', type: 'text', required: true },
      { key: 'case_title', label: 'Case title (Petitioner vs Respondent)', type: 'text', required: true },
      { key: 'case_number', label: 'Case / CNR number (if allotted)', type: 'text' },
      { key: 'client_name', label: 'Client name', type: 'text', required: true },
      { key: 'client_address', label: 'Client address', type: 'textarea', required: true },
      { key: 'client_role', label: "Client's role in the case", type: 'text', placeholder: 'e.g. Plaintiff / Defendant / Petitioner' },
      { key: 'advocate_name', label: 'Advocate name', type: 'text', required: true },
      { key: 'enrollment_no', label: 'Bar Council enrolment number', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
    ]),
    render(f) {
      return `
        <p style="text-align:center"><b>IN THE ${esc((f.court_name || '').toUpperCase())}</b></p>
        <p style="text-align:center">${f.case_number ? 'Case/CNR No. ' + esc(f.case_number) + '<br>' : ''}${esc(f.case_title)}</p>
        <p style="text-align:center"><b>VAKALATNAMA</b></p>
        <p>I, <b>${esc(f.client_name)}</b>, ${esc(f.client_role || 'party')} in the above matter, residing at ${esc(f.client_address)}, do hereby appoint and retain <b>${esc(f.advocate_name)}</b>${f.enrollment_no ? ' (Enrolment No. ' + esc(f.enrollment_no) + ')' : ''}, Advocate, to appear, act, and plead on my behalf in the above-noted case, and in all proceedings, applications, appeals, revisions, and execution proceedings arising therefrom, before this Hon'ble Court and any other court, tribunal, or authority of competent jurisdiction.</p>
        ${clause(1, 'Scope of Authority', clauseList([
          'To sign, verify, present, and withdraw pleadings, applications, petitions, and other documents on my behalf.',
          'To receive notices, summons, and processes on my behalf.',
          'To admit or deny documents, and to make statements and admissions as may be necessary for the conduct of the case.',
          'To compromise, withdraw, or refer the matter to arbitration or mediation, with my prior instructions.',
          'To deposit, draw, and receive money, cheques, and documents on my behalf in connection with this case.',
          'To engage or associate other counsel at my cost, if considered necessary.',
          'To do all other acts, deeds, and things as may be necessary for the effective and diligent conduct of the case.',
        ].map((s) => `<p>${s}</p>`)))}
        ${clause(2, 'Fees', `<p>The fees payable to the said Advocate shall be as separately agreed between the parties, and shall not be dependent on the result of the case unless otherwise stated in writing.</p>`)}
        ${clause(3, 'Revocation', `<p>This Vakalatnama shall remain in force until revoked in writing by me, with due notice to the Advocate and to this Hon'ble Court.</p>`)}
        <p style="margin-top:24px">${esc(f.place || '')}<br>${today()}</p>
        ${signatureRow('Signature of Client', f.client_name, 'Accepted', `${f.advocate_name}, Advocate`)}
      `;
    },
  },
  {
    key: 'memorandum_of_understanding',
    title: 'Memorandum of Understanding (MOU)',
    blurb: 'Records a mutual understanding between two parties before a formal agreement — covers purpose, responsibilities, term, and confidentiality.',
    fields: withLetterhead([
      { key: 'party_a_name', label: 'Party A — name', type: 'text', required: true },
      { key: 'party_a_address', label: 'Party A — address', type: 'textarea', required: true },
      { key: 'party_a_rep', label: 'Party A — represented by (name, designation)', type: 'text' },
      { key: 'party_b_name', label: 'Party B — name', type: 'text', required: true },
      { key: 'party_b_address', label: 'Party B — address', type: 'textarea', required: true },
      { key: 'party_b_rep', label: 'Party B — represented by (name, designation)', type: 'text' },
      { key: 'background', label: 'Background / context (recitals)', type: 'textarea', required: true, placeholder: 'Why are the parties entering this MOU — prior relationship, shared goal, opportunity identified, etc.' },
      { key: 'purpose', label: 'Purpose of this MOU', type: 'textarea', required: true },
      { key: 'party_a_responsibilities', label: "Party A's roles & responsibilities (one per line)", type: 'textarea', required: true },
      { key: 'party_b_responsibilities', label: "Party B's roles & responsibilities (one per line)", type: 'textarea', required: true },
      { key: 'binding_intent', label: 'Nature of this MOU', type: 'select', options: ['Non-binding statement of intent', 'Binding agreement between the parties'] },
      { key: 'term_months', label: 'Term (months)', type: 'number', placeholder: '12' },
      { key: 'termination_notice_days', label: "Termination notice period (days)", type: 'number', placeholder: '30' },
      { key: 'confidentiality_years', label: 'Confidentiality period after termination (years)', type: 'number', placeholder: '2' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text', placeholder: 'e.g. Delhi' },
      { key: 'place', label: 'Place of execution', type: 'text' },
      { key: 'witness1', label: 'Witness 1 name', type: 'text' },
      { key: 'witness2', label: 'Witness 2 name', type: 'text' },
    ]),
    render(f) {
      const aResp = lines(f.party_a_responsibilities);
      const bResp = lines(f.party_b_responsibilities);
      const isBinding = f.binding_intent === 'Binding agreement between the parties';
      let n = 1;
      return `
        <p>This Memorandum of Understanding ("<b>MOU</b>") is entered into on <b>${today()}</b> at ${esc(f.place || '')} by and between:</p>
        <p><b>${esc(f.party_a_name)}</b>, having its address at ${esc(f.party_a_address)}${f.party_a_rep ? ', represented by ' + esc(f.party_a_rep) : ''} (hereinafter referred to as "<b>Party A</b>", which expression shall, unless repugnant to the context, include its successors and permitted assigns), of the <b>FIRST PART</b>;</p>
        <p><b>AND</b></p>
        <p><b>${esc(f.party_b_name)}</b>, having its address at ${esc(f.party_b_address)}${f.party_b_rep ? ', represented by ' + esc(f.party_b_rep) : ''} (hereinafter referred to as "<b>Party B</b>", which expression shall, unless repugnant to the context, include its successors and permitted assigns), of the <b>SECOND PART</b>.</p>
        <p>Party A and Party B are hereinafter individually referred to as a "<b>Party</b>" and collectively as the "<b>Parties</b>".</p>

        <p class="doc-title" style="font-size:13px;text-decoration:none;text-align:left;margin:20px 0 8px">RECITALS</p>
        <div class="recitals">
          <p><b>WHEREAS</b>, ${nl(f.background)};</p>
          <p><b>WHEREAS</b>, the Parties wish to record their mutual understanding on the terms set out below;</p>
          <p><b>NOW, THEREFORE</b>, in consideration of the mutual covenants contained herein, the Parties agree as follows:</p>
        </div>

        ${clause(n++, 'Purpose', `<p>${nl(f.purpose)}</p>`)}
        ${clause(n++, "Party A's Roles & Responsibilities", clauseList(aResp.length ? aResp.map(esc) : ['To be mutually determined by the Parties.']))}
        ${clause(n++, "Party B's Roles & Responsibilities", clauseList(bResp.length ? bResp.map(esc) : ['To be mutually determined by the Parties.']))}
        ${clause(n++, 'Nature of this MOU', `<p>${isBinding
          ? 'This MOU constitutes a legally binding agreement between the Parties, enforceable in accordance with its terms.'
          : 'This MOU is intended as a statement of the Parties\' mutual intent and good-faith understanding, and, save for the clauses on Confidentiality and Governing Law, does not create legally binding obligations between the Parties unless and until superseded by a definitive written agreement executed by both Parties.'
        }</p>`)}
        ${clause(n++, 'Term & Termination', `<p>This MOU shall come into effect from the date first written above and shall continue for a period of ${esc(f.term_months || '12')} months, unless terminated earlier by either Party by giving ${esc(f.termination_notice_days || '30')} days' prior written notice to the other Party.</p>`)}
        ${clause(n++, 'Confidentiality', `<p>Each Party shall keep confidential all non-public information disclosed by the other Party in connection with this MOU, and shall not disclose such information to any third party without the prior written consent of the disclosing Party, save as required by law. This obligation shall survive for a period of ${esc(f.confidentiality_years || '2')} years from the date of termination or expiry of this MOU.</p>`)}
        ${clause(n++, 'No Partnership or Agency', `<p>Nothing in this MOU shall be construed as creating a partnership, joint venture, or agency relationship between the Parties. Neither Party shall have the authority to bind the other or to incur any obligation on the other's behalf, except as expressly agreed in writing.</p>`)}
        ${boilerplateClauses(n, f).html}

        <div class="doc-annexure-title">Execution</div>
        <p>IN WITNESS WHEREOF, the Parties hereto have set their hands on the day, month, and year first written above.</p>
        ${signatureRow('For Party A', f.party_a_name, 'For Party B', f.party_b_name)}
        ${witnessBlock(f.witness1, f.witness2)}
      `;
    },
  },
  {
    key: 'engagement_letter',
    title: 'Engagement / Retainer Letter',
    blurb: "Sets out scope, fees, and terms when taking on a new client's matter.",
    fields: withLetterhead([
      { key: 'advocate_name', label: 'Advocate / chamber name', type: 'text', required: true },
      { key: 'client_name', label: 'Client name', type: 'text', required: true },
      { key: 'client_address', label: 'Client address', type: 'textarea' },
      { key: 'matter', label: 'Matter description', type: 'textarea', required: true },
      { key: 'scope', label: 'Scope of work (one item per line)', type: 'textarea', required: true },
      { key: 'out_of_scope', label: 'Explicitly out of scope (optional, one per line)', type: 'textarea' },
      { key: 'fee_structure', label: 'Fee structure', type: 'textarea', placeholder: 'e.g. ₹1,500 per consultation; ₹25,000 retainer for the matter; ₹5,000 per hearing appearance' },
      { key: 'retainer_amount', label: 'Retainer amount payable upfront (₹)', type: 'text' },
      { key: 'payment_terms', label: 'Payment terms', type: 'textarea', placeholder: 'e.g. Invoiced monthly, payable within 7 days' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
    ]),
    render(f) {
      const scope = lines(f.scope);
      const outScope = lines(f.out_of_scope);
      const boiler = boilerplateClauses(outScope.length ? 8 : 7, f);
      return `
        <p style="text-align:right">${today()}</p>
        <p><b>To,</b><br>${nl(f.client_name)}<br>${nl(f.client_address)}</p>
        <p><b>Subject: Letter of Engagement — ${esc(f.matter).slice(0, 80)}</b></p>
        <p>Dear ${esc(f.client_name)},</p>
        <p>Thank you for choosing <b>${esc(f.advocate_name)}</b> ("we"/"us") to represent you ("you"/"the Client") in the matter described below. This letter, once countersigned by you, sets out the terms on which we agree to act for you.</p>
        ${clause(1, 'The Matter', `<p>${nl(f.matter)}</p>`)}
        ${clause(2, 'Scope of Work', clauseList(scope.length ? scope.map(esc) : ['To be mutually determined.']))}
        ${outScope.length ? clause(3, 'Explicitly Out of Scope', clauseList(outScope.map(esc)) + `<p>Any work beyond the scope above will only be undertaken after prior discussion and, where applicable, a revised fee estimate.</p>`) : ''}
        ${clause(outScope.length ? 4 : 3, 'Fees', `<p>${nl(f.fee_structure || 'To be mutually agreed for each stage of the matter.')}</p>${f.retainer_amount ? `<p>A retainer of <b>₹${esc(f.retainer_amount)}</b> is payable upon acceptance of this engagement, to be adjusted against final fees.</p>` : ''}`)}
        ${clause(outScope.length ? 5 : 4, 'Payment Terms', `<p>${nl(f.payment_terms || 'As invoiced.')}</p>`)}
        ${clause(outScope.length ? 6 : 5, 'Client Cooperation', `<p>You agree to provide complete and accurate instructions, documents, and information as reasonably required, and to respond to our requests in a timely manner. Delays in providing instructions may affect our ability to meet deadlines.</p>`)}
        ${clause(outScope.length ? 7 : 6, 'Termination', `<p>Either party may terminate this engagement at any time by written notice, subject to payment of fees and reimbursement of expenses for work already performed up to the date of termination.</p>`)}
        ${boiler.html}
        <p>Please sign and return a copy of this letter to confirm your acceptance of these terms. We look forward to working with you.</p>
        ${signatureRow(f.advocate_name, f.place, 'Accepted by', f.client_name)}
      `;
    },
  },
  {
    key: 'affidavit',
    title: 'Affidavit (General)',
    blurb: 'A sworn written statement of facts, customizable for most general purposes.',
    fields: withLetterhead([
      { key: 'deponent_name', label: 'Deponent name', type: 'text', required: true },
      { key: 'parent_name', label: "Son/Daughter/Wife of", type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
      { key: 'statements', label: 'Statements (one point per line)', type: 'textarea', required: true, placeholder: 'That I am the deponent herein...\nThat...\nThat...' },
      { key: 'place', label: 'Place of signing', type: 'text' },
    ]),
    render(f) {
      const points = lines(f.statements);
      return `
        <p style="text-align:center"><b>AFFIDAVIT</b></p>
        <p>I, <b>${esc(f.deponent_name)}</b>, ${f.parent_name ? 'S/o, D/o, W/o ' + esc(f.parent_name) + ', ' : ''}${f.age ? 'aged ' + esc(f.age) + ' years, ' : ''}${f.occupation ? 'working as ' + esc(f.occupation) + ', ' : ''}residing at ${esc(f.address)}, do hereby solemnly affirm and declare on oath as under:</p>
        <ol class="clause-list">
          ${points.map(p => `<li>${esc(p.replace(/^that\s*/i, '').trim())}</li>`).join('')}
        </ol>
        <p><b>Verification</b></p>
        <p>I, the deponent above named, do hereby verify that the contents of paragraphs 1 to ${points.length || '__'} of this affidavit are true and correct to the best of my knowledge, information, and belief, and that nothing material has been concealed therefrom or falsely stated therein.</p>
        <p style="margin-top:24px">Verified and signed at ${esc(f.place || '')} on this ${today()}.</p>
        <p style="margin-top:48px"><b>DEPONENT</b><br>${esc(f.deponent_name)}</p>
        <p style="margin-top:24px;font-size:11px;color:#555">(To be sworn before a Notary Public / Oath Commissioner as required.)</p>
      `;
    },
  },
  {
    key: 'general_poa',
    title: 'General Power of Attorney',
    blurb: 'Authorizes an agent to act on the principal\'s behalf for specified matters.',
    fields: withLetterhead([
      { key: 'principal_name', label: 'Principal (person granting authority)', type: 'text', required: true },
      { key: 'principal_address', label: "Principal's address", type: 'textarea', required: true },
      { key: 'agent_name', label: 'Agent / Attorney-holder', type: 'text', required: true },
      { key: 'agent_address', label: "Agent's address", type: 'textarea', required: true },
      { key: 'powers', label: 'Powers being granted (one per line)', type: 'textarea', required: true },
      { key: 'revocability', label: 'Revocability', type: 'select', options: ['Revocable at any time by the Principal', 'Irrevocable for a fixed term'] },
      { key: 'term_years', label: 'If irrevocable / time-bound — term (years)', type: 'number' },
      { key: 'place', label: 'Place', type: 'text' },
      { key: 'witness1', label: 'Witness 1 name', type: 'text' },
      { key: 'witness2', label: 'Witness 2 name', type: 'text' },
    ]),
    render(f) {
      const powers = lines(f.powers);
      const irrevocable = f.revocability === 'Irrevocable for a fixed term';
      return `
        <p style="text-align:center"><b>GENERAL POWER OF ATTORNEY</b></p>
        <p>BE IT KNOWN that I, <b>${esc(f.principal_name)}</b>, residing at ${esc(f.principal_address)} (hereinafter "the Principal"), do hereby nominate, constitute, and appoint <b>${esc(f.agent_name)}</b>, residing at ${esc(f.agent_address)} (hereinafter "the Attorney"), as my true and lawful attorney, to do the following acts, deeds, and things for me and on my behalf:</p>
        ${clause(1, 'Powers Granted', clauseList(powers.map(esc)))}
        ${clause(2, 'Ratification', `<p>I hereby agree and undertake to ratify and confirm all lawful acts, deeds, and things done by my said Attorney by virtue of this Power of Attorney, as if the same were done by me personally.</p>`)}
        ${clause(3, 'Revocability', `<p>${irrevocable
          ? `This Power of Attorney is granted for a fixed term of ${esc(f.term_years || '1')} year(s) from the date hereof and shall not be revoked by the Principal during this period, save with the written consent of the Attorney.`
          : `This Power of Attorney may be revoked by the Principal at any time by written notice to the Attorney, and such revocation shall take effect upon receipt of the notice by the Attorney. All acts done in good faith by the Attorney prior to such notice shall remain valid.`
        }</p>`)}
        ${clause(4, 'Sub-delegation', `<p>The Attorney shall not sub-delegate the powers granted herein to any third party without the prior written consent of the Principal.</p>`)}
        <p style="margin-top:24px">IN WITNESS WHEREOF, I have set my hand on this ${today()} at ${esc(f.place || '')}.</p>
        ${signatureRow('Principal', f.principal_name, 'Accepted by Attorney', f.agent_name)}
        ${witnessBlock(f.witness1, f.witness2)}
        <p style="margin-top:16px;font-size:11px;color:#555">(To be notarized / registered as required under applicable state law.)</p>
      `;
    },
  },
  {
    key: 'rent_agreement',
    title: 'Rent / Lease Agreement',
    blurb: 'Residential or commercial tenancy agreement between landlord and tenant.',
    fields: withLetterhead([
      { key: 'landlord_name', label: 'Landlord name', type: 'text', required: true },
      { key: 'landlord_address', label: "Landlord's address", type: 'textarea' },
      { key: 'tenant_name', label: 'Tenant name', type: 'text', required: true },
      { key: 'tenant_address', label: "Tenant's permanent address", type: 'textarea' },
      { key: 'property_address', label: 'Rented property address', type: 'textarea', required: true },
      { key: 'property_type', label: 'Property type / use', type: 'text', placeholder: 'e.g. 2BHK residential flat / commercial office' },
      { key: 'monthly_rent', label: 'Monthly rent (₹)', type: 'text', required: true },
      { key: 'rent_due_day', label: 'Rent due day of month', type: 'number', placeholder: '5' },
      { key: 'deposit', label: 'Security deposit (₹)', type: 'text' },
      { key: 'start_date', label: 'Lease start date', type: 'date' },
      { key: 'duration_months', label: 'Duration (months)', type: 'number', placeholder: '11' },
      { key: 'maintenance_terms', label: 'Maintenance / utilities terms', type: 'textarea' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
      { key: 'witness1', label: 'Witness 1 name', type: 'text' },
      { key: 'witness2', label: 'Witness 2 name', type: 'text' },
    ]),
    render(f) {
      const boiler = boilerplateClauses(f.deposit ? 9 : 8, f);
      return `
        <p style="text-align:center"><b>LEASE AGREEMENT</b></p>
        <p>This Lease Agreement ("Agreement") is made on ${today()} at ${esc(f.place || '')} between:</p>
        <p><b>${esc(f.landlord_name)}</b>, ${esc(f.landlord_address || '')} (hereinafter "the Landlord", which expression shall include their heirs, successors, and assigns), of the ONE PART; and</p>
        <p><b>${esc(f.tenant_name)}</b>, ${esc(f.tenant_address || '')} (hereinafter "the Tenant", which expression shall include their heirs, legal representatives, and permitted assigns), of the OTHER PART.</p>
        <p>WHEREAS the Landlord is the lawful owner of the premises described below and has agreed to let out the same to the Tenant, and the Tenant has agreed to take the same on lease, on the terms and conditions set out below.</p>
        ${clause(1, 'Premises', `<p>The Landlord agrees to let out ${f.property_type ? esc(f.property_type) + ' situated' : 'the premises situated'} at <b>${esc(f.property_address)}</b> ("the Premises") to the Tenant, for use strictly for the purpose stated above.</p>`)}
        ${clause(2, 'Rent', `<p>The Tenant shall pay a monthly rent of <b>₹${esc(f.monthly_rent)}</b>, payable in advance on or before the ${esc(f.rent_due_day || '5')}${(['1','21','31'].includes(String(f.rent_due_day)) ? 'st' : ['2','22'].includes(String(f.rent_due_day)) ? 'nd' : ['3','23'].includes(String(f.rent_due_day)) ? 'rd' : 'th')} of each calendar month, by bank transfer or such other mode as the parties may agree.</p>`)}
        ${f.deposit ? clause(3, 'Security Deposit', `<p>The Tenant has paid to the Landlord an interest-free, refundable security deposit of <b>₹${esc(f.deposit)}</b>, receipt of which the Landlord hereby acknowledges. The deposit shall be refunded to the Tenant within 30 days of vacating the Premises, after deducting any dues, damages (beyond normal wear and tear), or unpaid utility charges.</p>`) : ''}
        ${clause(f.deposit ? 4 : 3, 'Term', `<p>This lease is for a period of <b>${esc(f.duration_months || '11')} months</b>${f.start_date ? ' commencing from ' + esc(f.start_date) : ''}, renewable thereafter on terms to be mutually agreed in writing between the parties.</p>`)}
        ${clause(f.deposit ? 5 : 4, 'Use & Restrictions', `<p>The Tenant shall use the Premises strictly for the purpose stated above and shall not use it for any unlawful purpose. The Tenant shall not sublet, assign, or part with possession of the Premises, in whole or in part, without the Landlord's prior written consent.</p>`)}
        ${clause(f.deposit ? 6 : 5, 'Maintenance & Utilities', `<p>${nl(f.maintenance_terms || 'The Tenant shall maintain the Premises in good and tenantable condition, normal wear and tear excepted, and shall bear all utility charges (electricity, water, gas, internet) incurred during the tenancy. Structural repairs shall be the Landlord\'s responsibility.')}</p>`)}
        ${clause(f.deposit ? 7 : 6, 'Access for Inspection', `<p>The Landlord, or their authorized representative, may inspect the Premises at reasonable times with at least 48 hours' prior notice to the Tenant, save in cases of emergency.</p>`)}
        ${clause(f.deposit ? 8 : 7, 'Termination', `<p>Either party may terminate this Agreement by giving the other party one calendar month's prior written notice. On termination or expiry, the Tenant shall hand over vacant, peaceful possession of the Premises to the Landlord.</p>`)}
        ${boiler.html}
        <p style="margin-top:12px">IN WITNESS WHEREOF, the parties have signed this Agreement on the date first written above.</p>
        ${signatureRow('Landlord', f.landlord_name, 'Tenant', f.tenant_name)}
        ${witnessBlock(f.witness1, f.witness2)}
        <p style="margin-top:16px;font-size:11px;color:#555">(To be executed on stamp paper of the value prescribed under applicable state stamp law, and registered where the term exceeds 11 months.)</p>
      `;
    },
  },
  {
    key: 'partnership_deed',
    title: 'Partnership Deed (Basic)',
    blurb: 'Foundational deed for a two-partner firm — capital, profit share, and roles.',
    fields: withLetterhead([
      { key: 'firm_trade_name', label: 'Firm name', type: 'text', required: true },
      { key: 'firm_address', label: "Firm's principal place of business", type: 'textarea', required: true },
      { key: 'business_nature', label: 'Nature of business', type: 'text', required: true },
      { key: 'partner1_name', label: 'Partner 1 — name', type: 'text', required: true },
      { key: 'partner1_address', label: 'Partner 1 — address', type: 'textarea' },
      { key: 'partner1_capital', label: 'Partner 1 — capital contribution (₹)', type: 'text' },
      { key: 'partner2_name', label: 'Partner 2 — name', type: 'text', required: true },
      { key: 'partner2_address', label: 'Partner 2 — address', type: 'textarea' },
      { key: 'partner2_capital', label: 'Partner 2 — capital contribution (₹)', type: 'text' },
      { key: 'profit_ratio', label: 'Profit/loss sharing ratio', type: 'text', placeholder: 'e.g. 50:50' },
      { key: 'bank_operation', label: 'Bank account operation', type: 'select', options: ['Jointly by both partners', 'Severally by either partner'] },
      { key: 'admission_retirement', label: 'Admission / retirement terms (optional)', type: 'textarea', placeholder: 'How a new partner may be admitted, or an existing partner may retire' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
      { key: 'witness1', label: 'Witness 1 name', type: 'text' },
      { key: 'witness2', label: 'Witness 2 name', type: 'text' },
    ]),
    render(f) {
      return `
        <p style="text-align:center"><b>DEED OF PARTNERSHIP</b></p>
        <p>This Deed of Partnership is made on ${today()} at ${esc(f.place || '')} between <b>${esc(f.partner1_name)}</b>, ${esc(f.partner1_address || '')}, of the FIRST PART, and <b>${esc(f.partner2_name)}</b>, ${esc(f.partner2_address || '')}, of the SECOND PART (hereinafter collectively "the Partners"), who have mutually agreed to carry on business in partnership on the following terms:</p>
        ${clause(1, 'Name and Place of Business', `<p>The partnership shall carry on business under the name and style of <b>"${esc(f.firm_trade_name)}"</b> at ${esc(f.firm_address)}, or at such other place(s) as the Partners may mutually decide.</p>`)}
        ${clause(2, 'Nature of Business', `<p>${esc(f.business_nature)}, and such other allied business as the Partners may mutually agree to undertake from time to time.</p>`)}
        ${clause(3, 'Commencement and Duration', `<p>The partnership shall be deemed to have commenced from the date of this Deed and shall be "at will", continuing until dissolved by mutual consent of the Partners or in accordance with the provisions of the Indian Partnership Act, 1932.</p>`)}
        ${clause(4, 'Capital Contribution', `<p>${esc(f.partner1_name)} shall contribute ₹${esc(f.partner1_capital || '—')} and ${esc(f.partner2_name)} shall contribute ₹${esc(f.partner2_capital || '—')} as initial capital of the firm. Any further capital required shall be contributed by the Partners in the same proportion, unless otherwise agreed in writing.</p>`)}
        ${clause(5, 'Profit and Loss Sharing', `<p>The net profits and losses of the firm, after payment of all expenses and outgoings, shall be divided and borne by the Partners in the ratio of <b>${esc(f.profit_ratio || '50:50')}</b>.</p>`)}
        ${clause(6, 'Duties of Partners', `<p>Each Partner shall devote their time and attention to the business of the firm, act in good faith, and shall not, without the consent of the other Partner, engage in any other competing business.</p>`)}
        ${clause(7, 'Bank Account and Signing Authority', `<p>The partnership shall operate a bank account in the name of the firm, to be operated ${f.bank_operation === 'Severally by either partner' ? 'severally by either Partner' : 'jointly by both Partners'}.</p>`)}
        ${clause(8, 'Books of Account', `<p>Proper books of account shall be maintained at the firm's principal place of business and shall be open to inspection by either Partner at all reasonable times. The accounts shall be closed and finalized as at the end of each financial year.</p>`)}
        ${f.admission_retirement ? clause(9, 'Admission / Retirement of Partners', `<p>${nl(f.admission_retirement)}</p>`) : ''}
        ${boilerplateClauses(f.admission_retirement ? 10 : 9, f).html}
        <p style="margin-top:12px">IN WITNESS WHEREOF, the Partners have set their hands on the day, month, and year first written above.</p>
        ${signatureRow('Partner 1', f.partner1_name, 'Partner 2', f.partner2_name)}
        ${witnessBlock(f.witness1, f.witness2)}
      `;
    },
  },
  {
    key: 'nda',
    title: 'Non-Disclosure Agreement (NDA)',
    blurb: 'Protects confidential information shared between two parties.',
    fields: withLetterhead([
      { key: 'disclosing_party', label: 'Disclosing party', type: 'text', required: true },
      { key: 'disclosing_address', label: 'Disclosing party — address', type: 'textarea' },
      { key: 'receiving_party', label: 'Receiving party', type: 'text', required: true },
      { key: 'receiving_address', label: 'Receiving party — address', type: 'textarea' },
      { key: 'mutual', label: 'Type', type: 'select', options: ['One-way (Disclosing Party shares with Receiving Party)', 'Mutual (both parties share confidential information)'] },
      { key: 'purpose', label: 'Purpose of sharing information', type: 'textarea', required: true, placeholder: 'e.g. evaluating a potential business collaboration' },
      { key: 'exclusions', label: 'Exclusions (optional — beyond the standard list)', type: 'textarea' },
      { key: 'duration_years', label: 'Confidentiality period (years)', type: 'number', placeholder: '3' },
      { key: 'governing_state', label: 'Governing law (state)', type: 'text', placeholder: 'e.g. Maharashtra' },
      { key: 'place', label: 'Place', type: 'text' },
    ]),
    render(f) {
      const mutual = f.mutual === 'Mutual (both parties share confidential information)';
      const boiler = boilerplateClauses(8, f);
      return `
        <p style="text-align:center"><b>${mutual ? 'MUTUAL ' : ''}NON-DISCLOSURE AGREEMENT</b></p>
        <p>This ${mutual ? 'Mutual ' : ''}Non-Disclosure Agreement ("Agreement") is made on ${today()} at ${esc(f.place || '')} between <b>${esc(f.disclosing_party)}</b>, ${esc(f.disclosing_address || '')} ("${mutual ? 'Party A' : 'Disclosing Party'}") and <b>${esc(f.receiving_party)}</b>, ${esc(f.receiving_address || '')} ("${mutual ? 'Party B' : 'Receiving Party'}").</p>
        ${clause(1, 'Purpose', `<p>The parties wish to explore ${esc(f.purpose)}, in the course of which ${mutual ? 'each party may share confidential information with the other' : 'the Disclosing Party may share confidential information with the Receiving Party'}.</p>`)}
        ${clause(2, 'Definition of Confidential Information', `<p>"Confidential Information" means any information disclosed by ${mutual ? 'either party' : 'the Disclosing Party'}, whether oral, written, or electronic, that is designated as confidential or that a reasonable person would understand to be confidential given the nature of the information and the circumstances of disclosure, including business plans, financial data, technical data, client lists, and trade secrets.</p>`)}
        ${clause(3, 'Confidentiality Obligation', `<p>${mutual ? 'Each party' : 'The Receiving Party'} agrees to: (a) hold all Confidential Information in strict confidence; (b) use it solely for the stated Purpose; (c) not disclose it to any third party without the prior written consent of the disclosing party; and (d) protect it using at least the same degree of care used to protect its own confidential information, and no less than reasonable care.</p>`)}
        ${clause(4, 'Exclusions', `<p>This obligation does not extend to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was already lawfully in the receiving party's possession prior to disclosure; (c) is independently developed without use of the Confidential Information; or (d) is required to be disclosed by law or a competent court/authority, provided prior written notice is given to the disclosing party where legally permissible.${f.exclusions ? ' ' + nl(f.exclusions) : ''}</p>`)}
        ${clause(5, 'Return or Destruction', `<p>Upon the disclosing party's written request, or on termination of this Agreement, the receiving party shall promptly return or destroy all Confidential Information and any copies thereof, and certify such destruction if requested.</p>`)}
        ${clause(6, 'No License', `<p>Nothing in this Agreement shall be construed as granting any license or right to the receiving party in respect of the Confidential Information, other than the limited right to use it for the stated Purpose.</p>`)}
        ${clause(7, 'Term', `<p>This Agreement shall remain in effect for <b>${esc(f.duration_years || '3')} years</b> from the date of this Agreement, and the confidentiality obligations herein shall survive for that period from the date of each disclosure.</p>`)}
        ${boiler.html}
        <p style="margin-top:12px">IN WITNESS WHEREOF, the parties have executed this Agreement on the date first written above.</p>
        ${signatureRow(mutual ? 'Party A' : 'Disclosing Party', f.disclosing_party, mutual ? 'Party B' : 'Receiving Party', f.receiving_party)}
      `;
    },
  },
];

export function getTemplate(key) {
  return DOC_TEMPLATES.find(t => t.key === key);
}
