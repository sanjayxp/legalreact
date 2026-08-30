// ============================================================
// LegalConnects — CMS data helpers (ported 1:1 from app/js/cms.js)
// ============================================================
import { supabase } from './supabase';

// ---------- JOBS ----------
export async function listJobsAdmin() {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function saveJob(job) {
  const { id, ...fields } = job;
  if (id) {
    const { error } = await supabase.from('jobs').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('jobs').insert(fields);
    if (error) throw error;
  }
}
export async function deleteJob(id) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw error;
}
export async function countApplications(jobId) {
  const { count, error } = await supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('job_id', jobId);
  if (error) throw error;
  return count || 0;
}
export async function listJobApplicants(jobId) {
  const { data, error } = await supabase.from('job_applications').select('*').eq('job_id', jobId).order('applied_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- COURSES ----------
export async function listCoursesAdmin() {
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function saveCourse(course) {
  const { id, ...fields } = course;
  if (id) {
    const { error } = await supabase.from('courses').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('courses').insert(fields);
    if (error) throw error;
  }
}
export async function deleteCourse(id) {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}
export async function countEnrollments(courseId) {
  const { count, error } = await supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId);
  if (error) throw error;
  return count || 0;
}
export async function listCourseEnrollees(courseId) {
  const { data, error } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId).order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- TEAM MEMBERS ----------
export async function listTeamPublic() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('status', 'active')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function listTeamAdmin() {
  const { data, error } = await supabase.from('team_members').select('*').order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function saveTeamMember(member) {
  const { id, ...fields } = member;
  if (id) {
    const { error } = await supabase.from('team_members').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('team_members').insert(fields);
    if (error) throw error;
  }
}
export async function deleteTeamMember(id) {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}

// ---------- ADVOCATE PROFILES ----------
export async function getAdvocateProfile(userId) {
  const { data, error } = await supabase.from('advocate_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function upsertAdvocateProfile(userId, fields, isFirstSubmit) {
  if (isFirstSubmit) {
    const { error } = await supabase.from('advocate_profiles').insert({ id: userId, ...fields });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('advocate_profiles').update(fields).eq('id', userId);
    if (error) throw error;
  }
}
export async function listPendingAdvocates() {
  const { data, error } = await supabase
    .from('advocate_profiles')
    .select('*, profiles!advocate_profiles_id_fkey(full_name, phone, email)')
    .eq('verification_status', 'pending')
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function listAllAdvocates() {
  const { data, error } = await supabase
    .from('advocate_profiles')
    .select('*, profiles!advocate_profiles_id_fkey(full_name, phone, email)')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function listIncompleteAdvocateSignups() {
  const { data: started, error: e1 } = await supabase.from('advocate_profiles').select('id');
  if (e1) throw e1;
  const startedIds = new Set((started || []).map((a) => a.id));
  const { data: accounts, error: e2 } = await supabase.from('profiles').select('*').eq('role', 'advocate').order('created_at', { ascending: false });
  if (e2) throw e2;
  return (accounts || []).filter((p) => !startedIds.has(p.id));
}
export async function reviewAdvocateProfile(userId, status, reviewerId) {
  const { error } = await supabase
    .from('advocate_profiles')
    .update({ verification_status: status, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('id', userId);
  if (error) throw error;
  await logSelfAction('advocate_' + status, 'advocate_profile', userId, { status }, null);
}
export async function adminUpdateAdvocateProfile(userId, fields) {
  const { error } = await supabase.from('advocate_profiles').update(fields).eq('id', userId);
  if (error) throw error;
}
export async function deleteAdvocateProfile(userId) {
  const { error } = await supabase.from('advocate_profiles').delete().eq('id', userId);
  if (error) throw error;
}

// Removes the login itself, not just the profile row. The browser can't touch
// auth.users, so this goes through a definer RPC; profiles cascades from there
// and takes bookings, answers, cases and the rest with it. Uploaded files are
// not cascaded by the database, so they're cleared here first.
export async function adminDeleteUserAccount(userId) {
  // Delete storage files first
  for (const bucket of ['advocate-photos', 'bar-certificates']) {
    const { data: files } = await supabase.storage.from(bucket).list(userId);
    const paths = (files || []).map((f) => `${userId}/${f.name}`);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  // Delete the auth user via admin API (requires admin key)
  // This will also cascade delete the profile due to database FK constraints
  try {
    const { error } = await supabase.rpc('admin_delete_user', { target_id: userId });
    if (error) {
      console.error('RPC delete error:', error);
      throw error;
    }
  } catch (e) {
    // If RPC fails, fall back to direct delete which cascades
    console.error('Admin delete failed:', e);
    const { error: cascadeError } = await supabase.from('profiles').delete().eq('id', userId);
    if (cascadeError) throw cascadeError;
  }

  // Log the deletion for audit trail
  await logSelfAction('account_deleted_by_admin', 'profile', userId, null, 'Admin deleted user account');
}

// ---------- CLIENTS (admin, read-only on profiles) ----------
// role_confirmed excludes the placeholder row OAuth signups get before they
// pick client/advocate on /choose-role — that row has to exist the instant
// they authenticate (see AuthProvider's sign-out-on-missing-profile logic),
// but it isn't a real client account yet and shouldn't show as one here.
export async function listClients() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'client').eq('role_confirmed', true).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- ADMIN ACCOUNTS ----------
export async function listAdmins() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function findProfileByEmail(email) {
  const { data, error } = await supabase.from('profiles').select('*').ilike('email', email.trim()).maybeSingle();
  if (error) throw error;
  return data;
}
export async function promoteToAdmin(userId) {
  const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  if (error) throw error;
  await logSelfAction('promote_to_admin', 'profile', userId, null, null);
}
export async function updateOwnName(userId, fullName) {
  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
  if (error) throw error;
}

// ---------- BOOKINGS ----------
export async function getAvailability(advocateId) {
  const { data, error } = await supabase.from('advocate_availability').select('*').eq('advocate_id', advocateId).order('weekday', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function setAvailability(advocateId, days) {
  const { error: delErr } = await supabase.from('advocate_availability').delete().eq('advocate_id', advocateId);
  if (delErr) throw delErr;
  if (!days.length) return;
  const rows = days.map((d) => ({ advocate_id: advocateId, ...d }));
  const { error } = await supabase.from('advocate_availability').insert(rows);
  if (error) throw error;
}
export async function listTimeOff(advocateId) {
  const { data, error } = await supabase.from('advocate_time_off').select('*').eq('advocate_id', advocateId).order('off_date', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function addTimeOff(advocateId, offDate, note) {
  const { error } = await supabase.from('advocate_time_off').insert({ advocate_id: advocateId, off_date: offDate, note: note || null });
  if (error) throw error;
}
export async function deleteTimeOff(timeOffId) {
  const { error } = await supabase.from('advocate_time_off').delete().eq('id', timeOffId);
  if (error) throw error;
}
export async function listMySlots(advocateId) {
  const { data, error } = await supabase.from('booking_slots').select('*').eq('advocate_id', advocateId).order('slot_start', { ascending: true });
  if (error) throw error;
  return data || [];
}
// Client — their own bookings, matched by the email on their account
// (booking_slots has no client_id since booking never requires login).
export async function listMyBookingsByEmail(email) {
  if (!email) return [];
  const { data, error } = await supabase
    .from('booking_slots')
    .select('*')
    .ilike('client_email', email)
    .order('slot_start', { ascending: false });
  if (error) throw error;

  const rows = data || [];
  if (!rows.length) return rows;

  // booking_slots.advocate_id points at profiles, not advocate_profiles, so
  // there is no relationship for PostgREST to embed through — asking for one
  // fails the whole query. The advocate's display details are fetched
  // separately and attached under the same key the callers already expect.
  const ids = [...new Set(rows.map((r) => r.advocate_id).filter(Boolean))];
  const { data: advocates } = await supabase
    .from('advocate_profiles')
    .select('id, photo_url, profiles!advocate_profiles_id_fkey(full_name)')
    .in('id', ids);

  const byId = new Map((advocates || []).map((a) => [a.id, a]));
  return rows.map((r) => ({ ...r, advocate_profiles: byId.get(r.advocate_id) || null }));
}
// Client — their own submitted matters, matched by the email on their
// account (leads has no client_id since posting a matter never requires login).
export async function listMyLeadsByEmail(email) {
  if (!email) return [];
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .ilike('email', email)
    // Booking an advocate also raises a lead so the advocate sees the enquiry.
    // That is the same act as the consultation already listed above it, so it
    // does not belong in the client's list of matters they posted.
    .neq('source', 'booking')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function confirmBookingRequest(requestId) {
  const { data, error } = await supabase.rpc('confirm_booking_request', { p_request_id: requestId });
  if (error) throw new Error(error.message || 'Could not confirm that request.');
  return data;
}
export async function declineBookingRequest(requestId) {
  const { data, error } = await supabase.rpc('decline_booking_request', { p_request_id: requestId });
  if (error) throw new Error(error.message || 'Could not decline that request.');
  return data;
}
export async function updateSlotStatus(slotId, status) {
  const { error } = await supabase.from('booking_slots').update({ status, updated_at: new Date().toISOString() }).eq('id', slotId);
  if (error) throw error;
}
export async function deleteSlot(slotId) {
  const { error } = await supabase.from('booking_slots').delete().eq('id', slotId);
  if (error) throw error;
}

// ---------- UPLOADS ----------
export async function uploadPhoto(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
// Storage serves public objects with a long cache lifetime, so overwriting the
// same path leaves the browser and the CDN handing back the previous image —
// and since getPublicUrl returns an unchanged string, photo_url doesn't change
// either, so nothing re-renders. Each upload gets its own filename instead, and
// the advocate's older photos are cleared out so copies don't pile up.
export async function uploadAdvocatePhoto(advocateId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${advocateId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('advocate-photos').upload(path, file, { contentType: file.type });
  if (error) throw error;

  const { data: existing } = await supabase.storage.from('advocate-photos').list(advocateId);
  const stale = (existing || []).map((o) => `${advocateId}/${o.name}`).filter((p) => p !== path);
  if (stale.length) await supabase.storage.from('advocate-photos').remove(stale);

  const { data } = supabase.storage.from('advocate-photos').getPublicUrl(path);
  return data.publicUrl;
}
export async function uploadBarCertificate(userId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('bar-certificates').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}
export async function getBarCertificateSignedUrl(path) {
  const { data, error } = await supabase.storage.from('bar-certificates').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
export async function getResumeSignedUrl(path) {
  const { data, error } = await supabase.storage.from('job-resumes').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

// ---------- Q&A MODERATION ----------
export async function listQuestionsForModeration() {
  const { data, error } = await supabase
    .from('questions')
    .select('*, answers(id, body, upvote_count, created_at, profiles:advocate_id(full_name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function deleteAnswer(id) {
  const { error } = await supabase.from('answers').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteQuestion(id) {
  const { error: e1 } = await supabase.from('answers').delete().eq('question_id', id);
  if (e1) throw e1;
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}
export async function countMyAnswers(advocateId) {
  const { count, error } = await supabase.from('answers').select('id', { count: 'exact', head: true }).eq('advocate_id', advocateId);
  if (error) throw error;
  return count || 0;
}

// ---------- LEADS (admin) ----------
export async function listLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function listApprovedAdvocatesForAssignment() {
  const { data, error } = await supabase
    .from('advocate_profiles')
    .select('id, profiles!advocate_profiles_id_fkey(full_name)')
    .eq('verification_status', 'approved');
  if (error) throw error;
  return data || [];
}
export async function updateLead(id, fields) {
  const { error } = await supabase.from('leads').update(fields).eq('id', id);
  if (error) throw error;
}
// Marking a matter "completed" from the admin side has to do what an
// advocate's own accept does — create/link the advocate_clients row — or
// the client ends up converted on paper but absent from that advocate's
// client register. Requires the matter to already have an advocate assigned.
export async function adminConvertLead(id) {
  const { data, error } = await supabase.rpc('admin_convert_lead', { p_lead_id: id });
  if (error) throw new Error(error.message || 'Could not mark this matter completed.');
  return data;
}
export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

// ---------- LEADS (advocate — enquiries assigned to them) ----------
export async function listMyLeads(advocateId) {
  const { data, error } = await supabase.from('leads').select('*').eq('advocate_id', advocateId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
// Matters nobody has taken on yet — visible to every verified advocate. The
// client's phone and email are deliberately withheld until one advocate takes
// the matter, so posting a matter doesn't hand contact details to everyone.
export async function listOpenLeads() {
  const { data, error } = await supabase.rpc('list_open_leads');
  if (error) throw new Error(error.message || 'Could not load open matters.');
  return data || [];
}

// Takes an unclaimed matter. The first advocate through wins; anyone later is
// told it has gone rather than quietly overwriting the first.
export async function claimLead(id) {
  const { error } = await supabase.rpc('claim_lead', { p_lead_id: id });
  if (error) throw new Error(error.message || 'Could not take this matter.');
}

// Accepting turns the enquiry into (or links it to) a row in the advocate's
// own private client register — this is the one place "lead" becomes "client".
export async function acceptLead(id) {
  const { data, error } = await supabase.rpc('accept_lead', { p_lead_id: id });
  if (error) throw new Error(error.message || 'Could not accept this lead.');
  return data;
}
export async function declineLead(id) {
  const { data, error } = await supabase.rpc('decline_lead', { p_lead_id: id });
  if (error) throw new Error(error.message || 'Could not decline this lead.');
  return data;
}

// ---------- DELEGATED ADMIN RIGHTS ----------
export const ADMIN_SECTIONS = [
  { key: 'leads', label: 'Leads' },
  { key: 'qa', label: 'Q&A' },
  { key: 'jobs_learning', label: 'Jobs & Learning' },
  { key: 'people', label: 'People' },
];
export async function listAdminPermissions() {
  const { data, error } = await supabase.from('admin_permissions').select('*');
  if (error) throw error;
  return data || [];
}
export async function grantAdminSection(adminId, section, grantedBy) {
  const { error } = await supabase.from('admin_permissions').upsert({ admin_id: adminId, section, granted_by: grantedBy }, { onConflict: 'admin_id,section' });
  if (error) throw error;
  await logSelfAction('grant_admin_section', 'admin_permissions', adminId, { section }, null);
}
export async function revokeAdminSection(adminId, section) {
  const { error } = await supabase.from('admin_permissions').delete().eq('admin_id', adminId).eq('section', section);
  if (error) throw error;
  await logSelfAction('revoke_admin_section', 'admin_permissions', adminId, { section }, null);
}
export async function demoteAdmin(userId) {
  const { error } = await supabase.from('profiles').update({ role: 'client', is_super_admin: false }).eq('id', userId);
  if (error) throw error;
  await logSelfAction('demote_admin', 'profile', userId, null, null);
}

// ---------- CASE TRACKING ----------
export async function listMyCases(advocateId) {
  const { data, error } = await supabase.from('court_cases').select('*').eq('advocate_id', advocateId).order('next_hearing_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}
// Only these are real court_cases columns. The eCourts lookup returns extra
// keys (case_status, history) that aren't stored, and passing them straight
// through made PostgREST reject the whole insert.
const CASE_COLUMNS = [
  'crn', 'case_title', 'court_name', 'case_type', 'filed_date',
  'next_hearing_date', 'stage', 'last_order', 'labels', 'register_client_id',
  'client_id', 'whatsapp_alerts_enabled',
];

export async function createCase(advocateId, fields) {
  const row = { advocate_id: advocateId, source: fields.source || 'manual' };
  for (const k of CASE_COLUMNS) {
    if (fields[k] !== undefined && fields[k] !== '') row[k] = fields[k];
  }
  const { error } = await supabase.from('court_cases').insert(row);
  if (error) throw error;
}
export async function deleteCase(caseId) {
  const { error } = await supabase.from('court_cases').delete().eq('id', caseId);
  if (error) throw error;
}
export async function getCase(caseId) {
  const { data, error } = await supabase.from('court_cases').select('*').eq('id', caseId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function lookupCaseByCNR(cnr, { full = false } = {}) {
  const { data, error } = await supabase.functions.invoke('ecourts-lookup', { body: { cnr, full } });
  if (error) {
    let msg = 'Could not look up that CNR. Please try again.';
    try {
      const body = await error.context.json();
      if (body?.error) msg = body.error;
    } catch (_) {
      /* fall back to generic message */
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data.data;
}
// For someone who doesn't have their CNR handy — full-text search across
// party names, advocates, and case metadata. Returns a page of lightweight
// results; call lookupCaseByCNR on the chosen one for the full record.
export async function searchCasesByName(query, page = 1) {
  const { data, error } = await supabase.functions.invoke('ecourts-search', { body: { query, page } });
  if (error) {
    let msg = 'Search failed. Please try again.';
    try {
      const body = await error.context.json();
      if (body?.error) msg = body.error;
    } catch (_) {
      /* fall back to generic message */
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data.data;
}

// ---------- ADVOCATE ACCOUNT SETTINGS ----------
// Phone is written once by the signup trigger and had no field anywhere, so a
// wrong number entered at signup could never be corrected.
export async function updateOwnPhone(userId, phone) {
  const { error } = await supabase
    .from('profiles')
    .update({ phone: phone.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// Hides the advocate from the public directory without touching their
// verification, so coming back needs no re-review.
export async function setListingPaused(userId, paused) {
  const { error } = await supabase
    .from('advocate_profiles')
    .update({ listing_paused: paused })
    .eq('id', userId);
  if (error) throw error;
}

// The DPDP Act's right to erasure. Uploaded files are not cascaded by the
// database, so they go first — same order as the admin route.
export async function deleteOwnAccount(userId) {
  for (const bucket of ['advocate-photos', 'bar-certificates']) {
    const { data: files } = await supabase.storage.from(bucket).list(userId);
    const paths = (files || []).map((f) => `${userId}/${f.name}`);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new Error(error.message || 'Could not delete your account.');
}

// ---------- PRECEDENT RESEARCH ----------
// Every result comes back from the eCourts search with a real CNR. Nothing on
// screen is invented by a model — the relevance line only explains a record
// that was actually retrieved, and is dropped server-side if it doesn't match one.
export async function researchPrecedents({ matter, acts = [] }) {
  const { data, error } = await supabase.functions.invoke('case-research', { body: { matter, acts } });
  if (error) {
    let msg = 'Precedent search failed. Please try again.';
    try {
      const body = await error.context.json();
      if (body?.error) msg = body.error;
    } catch (_) {
      /* fall back to generic message */
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data.data;
}

export async function listCasePrecedents(caseId) {
  const { data, error } = await supabase
    .from('case_precedents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function savePrecedent(advocateId, caseId, r) {
  const { error } = await supabase.from('case_precedents').insert({
    case_id: caseId,
    advocate_id: advocateId,
    cnr: r.cnr,
    case_title: r.case_title,
    court_name: r.court_name,
    decision_date: r.decision_date || null,
    judges: r.judges || [],
    acts_and_sections: r.acts_and_sections || [],
  });
  if (error) throw error;
}

export async function deletePrecedent(id) {
  const { error } = await supabase.from('case_precedents').delete().eq('id', id);
  if (error) throw error;
}

// ---------- CASE WORKSPACE ----------
export async function listCaseEvents(caseId) {
  const { data, error } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', caseId)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addCaseEvent(caseId, advocateId, fields) {
  const { error } = await supabase.from('case_events').insert({ case_id: caseId, advocate_id: advocateId, ...fields });
  if (error) throw error;
}
// Pulls the hearing history and orders the court already holds for this CNR
// into the timeline. Entries the advocate already has are skipped, so running
// it twice is harmless and their own notes are never touched.
export async function importCaseHistory(caseId, advocateId, crn) {
  const data = await lookupCaseByCNR(crn, { full: true });

  const incoming = [
    ...(data.history || [])
      .filter((h) => h.date)
      .map((h) => ({
        event_date: h.date,
        kind: 'hearing',
        title: h.purpose ? `Listed — ${h.purpose}` : 'Listed for hearing',
        detail: h.judge ? `Before ${h.judge}` : null,
      })),
    ...(data.orders || [])
      .filter((o) => o.date)
      .map((o) => ({
        event_date: o.date,
        kind: 'order',
        title: o.type || 'Order',
        detail: o.description || null,
      })),
  ];

  if (!incoming.length) return { added: 0, skipped: 0 };

  const existing = await listCaseEvents(caseId);
  const seen = new Set(existing.map((e) => `${e.event_date}|${e.title}`));

  const fresh = [];
  for (const row of incoming) {
    const fingerprint = `${row.event_date}|${row.title}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    fresh.push({ case_id: caseId, advocate_id: advocateId, ...row });
  }

  if (fresh.length) {
    const { error } = await supabase.from('case_events').insert(fresh);
    if (error) throw error;
  }
  return { added: fresh.length, skipped: incoming.length - fresh.length };
}

export async function deleteCaseEvent(id) {
  const { error } = await supabase.from('case_events').delete().eq('id', id);
  if (error) throw error;
}
export async function setCaseLabels(caseId, labels) {
  const { error } = await supabase.from('court_cases').update({ labels, updated_at: new Date().toISOString() }).eq('id', caseId);
  if (error) throw error;
}
export async function listCaseDocuments(caseId) {
  const { data, error } = await supabase.from('case_documents').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function uploadCaseDocument(caseId, advocateId, file) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${advocateId}/${caseId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage.from('case-docs').upload(path, file);
  if (upErr) throw upErr;
  const { error } = await supabase.from('case_documents').insert({ case_id: caseId, advocate_id: advocateId, file_name: file.name, file_path: path });
  if (error) throw error;
}
export async function caseDocumentUrl(filePath) {
  const { data, error } = await supabase.storage.from('case-docs').createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function deleteCaseDocument(doc) {
  await supabase.storage.from('case-docs').remove([doc.file_path]);
  const { error } = await supabase.from('case_documents').delete().eq('id', doc.id);
  if (error) throw error;
}

// Cases an advocate has attached this client to. Deliberately narrow: the
// client sees where the matter stands, not the advocate's timeline notes or
// documents, which are work product.
export async function listMyCasesAsClient() {
  const { data, error } = await supabase
    .from('court_cases')
    .select('id, case_title, crn, court_name, case_type, stage, next_hearing_date, last_order, filed_date')
    .order('next_hearing_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

// ---------- CLIENT MANAGEMENT (advocate's private register) ----------
export async function listMyClients(advocateId) {
  const { data, error } = await supabase.from('advocate_clients').select('*').eq('advocate_id', advocateId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addClient(advocateId, fields) {
  const { data, error } = await supabase.from('advocate_clients').insert({ advocate_id: advocateId, ...fields }).select().single();
  if (error) throw error;
  return data;
}
export async function updateClient(id, fields) {
  const { error } = await supabase.from('advocate_clients').update(fields).eq('id', id);
  if (error) throw error;
}
export async function deleteClient(id) {
  const { error } = await supabase.from('advocate_clients').delete().eq('id', id);
  if (error) throw error;
}
export async function linkCaseToClient(caseId, registerClientId) {
  const { error } = await supabase.from('court_cases').update({ register_client_id: registerClientId }).eq('id', caseId);
  if (error) throw error;
}
export async function listClientCases(advocateId, registerClientId) {
  const { data, error } = await supabase
    .from('court_cases')
    .select('id, case_title, next_hearing_date, stage')
    .eq('advocate_id', advocateId)
    .eq('register_client_id', registerClientId);
  if (error) throw error;
  return data || [];
}
// Matters/enquiries that became this client — accepting a lead links it via
// advocate_client_id, so a returning client's new matter shows up here
// instead of only being visible as a one-off row in the admin Matters list.
export async function listClientMatters(registerClientId) {
  const { data, error } = await supabase
    .from('leads')
    .select('id, matter, matter_type, status, source, created_at')
    .eq('advocate_client_id', registerClientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function logClientUpdate(advocateId, clientId, caseId, message, channel) {
  const { error } = await supabase.from('client_updates').insert({ advocate_id: advocateId, client_id: clientId, case_id: caseId || null, message, channel });
  if (error) throw error;
}
export async function listClientUpdates(clientId) {
  const { data, error } = await supabase.from('client_updates').select('*').eq('client_id', clientId).order('sent_at', { ascending: false }).limit(20);
  if (error) throw error;
  return data || [];
}
export async function listMyInvoices(advocateId) {
  const { data, error } = await supabase.from('invoices').select('*, advocate_clients(full_name)').eq('advocate_id', advocateId).order('issued_on', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addInvoice(advocateId, fields) {
  const { error } = await supabase.from('invoices').insert({ advocate_id: advocateId, ...fields });
  if (error) throw error;
}
export async function setInvoiceStatus(id, status) {
  const patch = { status };
  if (status === 'paid') patch.paid_on = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('invoices').update(patch).eq('id', id);
  if (error) throw error;
}

// ---------- PUBLIC LISTINGS (jobs & courses) ----------
export async function listJobsPublic() {
  const { data, error } = await supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function listCoursesPublic() {
  const { data, error } = await supabase.from('courses').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function submitJobApplication(app) {
  const { error } = await supabase.from('job_applications').insert(app);
  if (error) throw error;
}
export async function submitCourseEnrollment(enroll) {
  const { error } = await supabase.from('course_enrollments').insert(enroll);
  if (error) throw error;
}
export async function uploadResume(jobId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${jobId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('job-resumes').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

// ---------- LEGAL Q&A (public forum) ----------
// Columns exposed to anonymous readers — guest_email is deliberately left out
// so an asker's contact email is never sent to the browser on a public page.
const PUBLIC_QUESTION_COLUMNS = 'id, topic, title, body, budget, view_count, status, client_id, guest_name, created_at';

export async function listQuestionsPublic(topic) {
  let q = supabase.from('questions').select(`${PUBLIC_QUESTION_COLUMNS}, answers(count)`).order('created_at', { ascending: false });
  if (topic && topic !== 'all') q = q.ilike('topic', topic); // case-insensitive: some seeded topics are lowercase
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function getQuestionDetail(questionId) {
  const { data: question, error: qErr } = await supabase.from('questions').select(PUBLIC_QUESTION_COLUMNS).eq('id', questionId).maybeSingle();
  if (qErr) throw qErr;
  if (!question) return null;
  const { data: answers, error: aErr } = await supabase
    .from('answers')
    .select('*, profiles!answers_advocate_id_fkey(full_name)')
    .eq('question_id', questionId)
    .order('upvote_count', { ascending: false });
  if (aErr) throw aErr;
  const advocateIds = [...new Set((answers || []).map((a) => a.advocate_id))];
  let advocateInfo = {};
  if (advocateIds.length) {
    const { data: profs, error: pErr } = await supabase.from('advocate_profiles').select('id, headline, practice_areas').in('id', advocateIds);
    if (pErr) throw pErr;
    (profs || []).forEach((p) => { advocateInfo[p.id] = p; });
  }
  const answersWithProfiles = (answers || []).map((a) => ({ ...a, advocate_profiles: advocateInfo[a.advocate_id] || null }));
  const answerIds = answersWithProfiles.map((a) => a.id);
  let comments = [];
  if (answerIds.length) {
    const { data: c, error: cErr } = await supabase.from('answer_comments').select('*').in('answer_id', answerIds).order('created_at', { ascending: true });
    if (cErr) throw cErr;
    comments = c || [];
  }
  return { question, answers: answersWithProfiles, comments };
}
export async function incrementQuestionViews(questionId) {
  const { error } = await supabase.rpc('increment_question_views', { q_id: questionId });
  if (error) throw error;
}
export async function submitQuestion({ topic, title, body, budget, client_id, guest_email, guest_name }) {
  const { data, error } = await supabase
    .from('questions')
    .insert({ topic, title, body, budget, client_id: client_id || null, guest_email: guest_email || null, guest_name: guest_name || null })
    .select(PUBLIC_QUESTION_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data;
}
// Quora-style toggle — voting again removes the vote. Requires login;
// the RPC raises if there's no session.
export async function toggleAnswerVote(answerId) {
  const { data, error } = await supabase.rpc('toggle_answer_vote', { p_answer_id: answerId });
  if (error) throw new Error(error.message?.includes('log in') ? 'Log in to mark an answer helpful.' : error.message || 'Could not register your vote.');
  return data?.[0] || { voted: false, upvote_count: 0 };
}
// Which of this question's answers the signed-in user has already voted on.
export async function listMyVotedAnswerIds(answerIds) {
  if (!answerIds.length) return [];
  const { data, error } = await supabase.from('answer_votes').select('answer_id').in('answer_id', answerIds);
  if (error) throw error;
  return (data || []).map((r) => r.answer_id);
}
export async function addAnswerComment(answerId, authorRole, authorId, body) {
  const { error } = await supabase.from('answer_comments').insert({ answer_id: answerId, author_role: authorRole, author_id: authorId || null, body });
  if (error) throw error;
}
export async function submitAnswer(questionId, advocateId, body) {
  const { error } = await supabase.from('answers').insert({ question_id: questionId, advocate_id: advocateId, body });
  if (error) throw error;
}

// ---------- PUBLIC ADVOCATE DIRECTORY (no login required) ----------
export async function listApprovedAdvocatesPublic() {
  const { data, error } = await supabase
    .from('advocate_profiles')
    .select('*, profiles!advocate_profiles_id_fkey(full_name)')
    .eq('verification_status', 'approved')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getApprovedAdvocatePublic(id) {
  const { data, error } = await supabase
    .from('advocate_profiles')
    .select('*, profiles!advocate_profiles_id_fkey(full_name)')
    .eq('id', id)
    .eq('verification_status', 'approved')
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function incrementProfileView(advocateProfileId) {
  const { error } = await supabase.rpc('increment_profile_view', { profile_id: advocateProfileId });
  if (error) throw error;
}
// Public "request this advocate" capture — lands in the same admin Leads
// queue as other public-site enquiries, pre-assigned to this advocate.
export async function requestAdvocateLead({ advocate_id, client_name, phone, email, matter }) {
  const { error } = await supabase.from('leads').insert({
    advocate_id,
    client_name,
    phone,
    email: email || null,
    matter: matter || null,
    source: 'booking',
    status: 'new',
  });
  if (error) throw error;
}

// Public "Post your matter" capture — general enquiry, not yet assigned to
// any advocate. Lands in the same admin Leads queue for triage/assignment.
export async function submitMatterLead({ client_name, phone, email, matter, matter_type, details, city, budget }) {
  const { error } = await supabase.from('leads').insert({
    client_name,
    phone,
    email: email || null,
    matter: matter || null,
    // What the client picked, plus their answers for that type. matter stays
    // the readable summary so anything already reading it is unaffected.
    matter_type: matter_type || null,
    details: details || null,
    city: city || null,
    budget: budget || null,
    source: 'post_case',
    status: 'new',
  });
  if (error) throw error;
}

// ---------- PUBLIC BOOKING FLOW (no login required) ----------
// Computed on the fly server-side (weekly hours minus time-off minus
// confirmed bookings) — never reads booking_slots rows directly, so no
// other client's name/email/phone is ever exposed to the browser.
export async function listOpenSlotsPublic(advocateId, fromDate, toDate) {
  const { data, error } = await supabase.rpc('list_open_slots', {
    p_advocate_id: advocateId,
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) throw error;
  return data || [];
}

// Public — request a slot. Re-validated against real availability
// server-side. Multiple clients can request the same time; only one will
// end up confirmed.
export async function requestSlot(advocateId, slotStart, slotEnd, { mode, client_name, client_email, client_phone, client_notes }) {
  const { data, error } = await supabase.rpc('request_booking_slot', {
    p_advocate_id: advocateId,
    p_slot_start: slotStart,
    p_slot_end: slotEnd,
    p_mode: mode,
    p_client_name: client_name,
    p_client_email: client_email || null,
    p_client_phone: client_phone,
    p_client_notes: client_notes || null,
  });
  if (error) throw new Error(error.message || 'Could not send that request.');
  return data;
}

// ---------- ADMIN ACTIVITY FEED ----------
// Merges the last N events across the tables an admin cares about into one
// timeline, so the overview page reflects "everything happening" rather
// than just static totals.
export async function listRecentActivity(limit = 15) {
  const [signups, leads, questions, submissions] = await Promise.all([
    // Excludes the pre-choice OAuth placeholder (role_confirmed: false) —
    // it isn't really "signed up as client" yet, it's mid-signup.
    supabase.from('profiles').select('id, full_name, role, created_at').eq('role_confirmed', true).order('created_at', { ascending: false }).limit(limit),
    supabase.from('leads').select('id, client_name, matter, source, created_at').order('created_at', { ascending: false }).limit(limit),
    supabase.from('questions').select('id, title, topic, created_at').order('created_at', { ascending: false }).limit(limit),
    supabase.from('advocate_profiles').select('id, submitted_at, profiles!advocate_profiles_id_fkey(full_name)').order('submitted_at', { ascending: false }).limit(limit),
  ]);

  const events = [
    ...(signups.data || []).map((r) => ({
      type: 'signup', id: r.id, at: r.created_at,
      title: `${r.full_name || 'Someone'} signed up as ${r.role}`,
      href: r.role === 'advocate' ? '/admin/people?tab=advocates' : '/admin/people?tab=clients',
    })),
    ...(leads.data || []).map((r) => ({
      type: 'lead', id: r.id, at: r.created_at,
      title: `New lead — ${r.client_name || 'unnamed'}${r.matter ? `: ${r.matter}` : ''}`,
      href: '/admin/leads',
    })),
    ...(questions.data || []).map((r) => ({
      type: 'question', id: r.id, at: r.created_at,
      title: `New question — ${r.title}`,
      href: '/admin/qa',
    })),
    ...(submissions.data || []).map((r) => ({
      type: 'submission', id: r.id, at: r.submitted_at,
      title: `${r.profiles?.full_name || 'An advocate'} submitted a profile for review`,
      href: '/admin/people?tab=advocates',
    })),
  ].filter((e) => e.at);

  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  return events.slice(0, limit);
}

// ---------- LEGAL LIBRARY (public bare-acts repository) ----------
export const LEGAL_LIBRARY_CATEGORIES = [
  'Constitutional Law',
  'Criminal Law',
  'Contract & Civil Law',
  'Corporate Law',
  'Family Law',
  'Property Law',
  'Labour Law',
  'Other',
];

export async function listPublishedActs() {
  const { data, error } = await supabase
    .from('legal_acts')
    .select('id, slug, title, short_title, category, year, summary')
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function getPublishedAct(slug) {
  const { data: act, error: aErr } = await supabase
    .from('legal_acts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (aErr) throw aErr;
  if (!act) return null;
  const { data: sections, error: sErr } = await supabase
    .from('legal_act_sections')
    .select('*')
    .eq('act_id', act.id)
    .order('order_index', { ascending: true });
  if (sErr) throw sErr;
  return { act, sections: sections || [] };
}

// ---------- LEGAL LIBRARY (admin) ----------
export async function listActsAdmin() {
  const { data, error } = await supabase.from('legal_acts').select('*').order('display_order', { ascending: true }).order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function saveAct(act) {
  const { id, ...fields } = act;
  if (id) {
    const { error } = await supabase.from('legal_acts').update(fields).eq('id', id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase.from('legal_acts').insert(fields).select('id').single();
  if (error) throw error;
  return data.id;
}
export async function deleteAct(id) {
  const { error } = await supabase.from('legal_acts').delete().eq('id', id);
  if (error) throw error;
}
export async function listActSectionsAdmin(actId) {
  const { data, error } = await supabase.from('legal_act_sections').select('*').eq('act_id', actId).order('order_index', { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function saveActSection(section) {
  const { id, ...fields } = section;
  if (id) {
    const { error } = await supabase.from('legal_act_sections').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('legal_act_sections').insert(fields);
    if (error) throw error;
  }
}
export async function deleteActSection(id) {
  const { error } = await supabase.from('legal_act_sections').delete().eq('id', id);
  if (error) throw error;
}

// ---------- ADMIN: SUPPORT TICKETS ----------
export async function createSupportTicket({ user_id, user_email, user_name, category, title, description }) {
  const { error } = await supabase.from('support_tickets').insert({
    user_id, user_email, user_name, category, title, description, status: 'open'
  });
  if (error) throw error;
}

export async function listSupportTickets(filter = {}) {
  let q = supabase.from('support_tickets').select('*');
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.priority) q = q.eq('priority', filter.priority);
  if (filter.category) q = q.eq('category', filter.category);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateTicket(id, updates) {
  const { error } = await supabase.from('support_tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  if (updates.status) await logSelfAction('ticket_' + updates.status, 'support_ticket', id, updates, updates.resolution_notes || null);
}

// ---------- ADMIN: AUDIT LOG ----------
export async function logAdminAction(admin_id, admin_email, action, target_type, target_id, changes, notes) {
  const { error } = await supabase.from('audit_log').insert({
    admin_id, admin_email, action, target_type, target_id, changes, notes
  });
  if (error) throw error;
}

// Resolves the signed-in admin itself, so call sites don't have to plumb
// id/email through. Best-effort: a logging failure must never block the
// action it's describing, so errors are swallowed rather than thrown.
async function logSelfAction(action, target_type, target_id, changes, notes) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await logAdminAction(user.id, user.email, action, target_type, target_id, changes, notes);
  } catch (e) {
    console.error('audit log failed', e);
  }
}

export async function listAuditLog(limit = 50) {
  const { data, error } = await supabase.from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ---------- ADMIN: ANALYTICS ----------
export async function getAnalyticsSummary() {
  const { data: tickets } = await supabase.from('support_tickets').select('*');
  const { data: leads } = await supabase.from('leads').select('*');
  const { data: profiles } = await supabase.from('profiles').select('role, role_confirmed');
  const { data: slots } = await supabase.from('booking_slots').select('status');

  // Only counts settled accounts — the pre-choice OAuth placeholder
  // (role_confirmed: false) isn't a real client or advocate yet.
  const confirmed = (profiles || []).filter((p) => p.role_confirmed);

  return {
    tickets: {
      total: tickets?.length || 0,
      open: tickets?.filter(t => t.status === 'open').length || 0,
      urgent: tickets?.filter(t => t.priority === 'urgent').length || 0,
    },
    leads: {
      total: leads?.length || 0,
      new: leads?.filter(l => l.status === 'new').length || 0,
      converted: leads?.filter(l => l.status === 'converted').length || 0,
    },
    users: {
      advocates: confirmed.filter(p => p.role === 'advocate').length,
      clients: confirmed.filter(p => p.role === 'client').length,
      total: confirmed.length,
    },
    consultations: {
      confirmed: slots?.filter(s => s.status === 'confirmed').length || 0,
      pending: slots?.filter(s => s.status === 'requested').length || 0,
    }
  };
}


// ---------- ADMIN: ADVOCATE PERFORMANCE ----------
export async function getAdvocatePerformance() {
  const { data: advocates, error } = await supabase.from('advocate_profiles')
    .select('id, verification_status, view_count, submitted_at');

  if (error) {
    console.error('getAdvocatePerformance error:', error);
    return [];
  }
  if (!advocates || advocates.length === 0) return [];

  const ids = advocates.map((a) => a.id);

  // Three batched queries instead of two per advocate.
  const [profilesRes, slotsRes, leadsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', ids),
    supabase.from('booking_slots').select('advocate_id').in('advocate_id', ids).eq('status', 'confirmed'),
    supabase.from('leads').select('advocate_id').in('advocate_id', ids).eq('status', 'converted'),
  ]);

  const nameById = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name || p.email]));
  const countBy = (rows) => {
    const m = new Map();
    (rows || []).forEach((r) => m.set(r.advocate_id, (m.get(r.advocate_id) || 0) + 1));
    return m;
  };
  const slotCounts = countBy(slotsRes.data);
  const leadCounts = countBy(leadsRes.data);

  return advocates.map((adv) => ({
    id: adv.id,
    full_name: nameById.get(adv.id) || 'Unknown Advocate',
    verification_status: adv.verification_status || 'pending',
    view_count: adv.view_count || 0,
    created_at: adv.submitted_at,
    consultations: slotCounts.get(adv.id) || 0,
    cases: leadCounts.get(adv.id) || 0,
  }));
}

// ---------- ADMIN: MATTER MANAGEMENT ----------
// Attaches advocate_name so the admin Matters list can show "Assigned to X"
// vs. "Unclaimed" instead of leaving assignment state invisible — status
// alone ('new') doesn't tell you whether a matter already has an advocate.
export async function listAllMatters(filter = {}) {
  let q = supabase.from('leads').select('*');
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.type) q = q.eq('matter_type', filter.type);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  const matters = data || [];

  const advocateIds = [...new Set(matters.map((m) => m.advocate_id).filter(Boolean))];
  if (advocateIds.length === 0) return matters;

  const { data: advocates } = await supabase
    .from('advocate_profiles')
    .select('id, profiles!advocate_profiles_id_fkey(full_name)')
    .in('id', advocateIds);
  const nameById = new Map((advocates || []).map((a) => [a.id, a.profiles?.full_name]));

  return matters.map((m) => ({ ...m, advocate_name: m.advocate_id ? nameById.get(m.advocate_id) || 'Advocate' : null }));
}

export async function getMatterStats() {
  const { data } = await supabase.from('leads').select('status, matter_type');
  if (!data) return {};
  
  const stats = {
    total: data.length,
    byStatus: {},
    byType: {},
  };
  
  data.forEach((m) => {
    stats.byStatus[m.status] = (stats.byStatus[m.status] || 0) + 1;
    stats.byType[m.matter_type] = (stats.byType[m.matter_type] || 0) + 1;
  });
  
  return stats;
}

// ---------- ADMIN: NOTIFICATIONS ----------
// Real event feed, populated by database triggers on leads/profiles/
// advocate_profiles/support_tickets — see migration add_admin_notifications_system.
// This means every matter posted, account created, advocate profile
// submitted, and support ticket opened lands here regardless of which
// frontend path caused it (public forms, OAuth, email signup, etc).
export async function listNotifications({ unreadOnly = false, type = '' } = {}) {
  let q = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  if (unreadOnly) q = q.eq('read', false);
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getUnreadNotificationCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) throw error;
}

// ---------- ADMIN: BULK OPERATIONS ----------
export async function bulkApproveAdvocates(advocateIds) {
  const { error } = await supabase.from('advocate_profiles')
    .update({ verification_status: 'approved' })
    .in('id', advocateIds);
  if (error) throw error;
  await logSelfAction('bulk_advocate_approved', 'advocate_profile', null, { advocateIds }, null);
}

export async function bulkRejectAdvocates(advocateIds) {
  const { error } = await supabase.from('advocate_profiles')
    .update({ verification_status: 'rejected' })
    .in('id', advocateIds);
  if (error) throw error;
  await logSelfAction('bulk_advocate_rejected', 'advocate_profile', null, { advocateIds }, null);
}

export async function bulkAssignLeads(leadIds, advocateId) {
  const { error } = await supabase.from('leads')
    .update({ advocate_id: advocateId, assigned_at: new Date().toISOString() })
    .in('id', leadIds);
  if (error) throw error;
  await logSelfAction('bulk_leads_assigned', 'lead', null, { leadIds, advocateId }, null);
}

// ---------- ADMIN: EMAIL TEMPLATES ----------
export async function listEmailTemplates() {
  const { data, error } = await supabase.from('email_templates').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveEmailTemplate(template) {
  const { id, ...fields } = template;
  fields.updated_at = new Date().toISOString();
  if (id) {
    const { error } = await supabase.from('email_templates').update(fields).eq('id', id);
    if (error) throw error;
    await logSelfAction('email_template_updated', 'email_template', id, { name: fields.name }, null);
    return id;
  }
  const { data, error } = await supabase.from('email_templates').insert(fields).select('id').single();
  if (error) throw error;
  await logSelfAction('email_template_created', 'email_template', data.id, { name: fields.name }, null);
  return data.id;
}

export async function deleteEmailTemplate(id) {
  const { error } = await supabase.from('email_templates').delete().eq('id', id);
  if (error) throw error;
  await logSelfAction('email_template_deleted', 'email_template', id, null, null);
}

// ---------- ADMIN: COMPLIANCE (DPDP Act 2023) ----------
export async function getComplianceSnapshot() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const [erasureLog, pendingStale, missingCert, ticketBreaches, incomplete] = await Promise.all([
    supabase.from('audit_log').select('*')
      .in('action', ['account_deleted', 'self_account_deletion'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('advocate_profiles')
      .select('id, profiles!advocate_profiles_id_fkey(full_name, email), submitted_at')
      .eq('verification_status', 'pending')
      .lt('submitted_at', sevenDaysAgo),
    supabase.from('advocate_profiles')
      .select('id, profiles!advocate_profiles_id_fkey(full_name, email)')
      .eq('verification_status', 'approved')
      .is('bar_certificate_url', null),
    supabase.from('support_tickets').select('*')
      .in('status', ['open', 'in_progress'])
      .lt('created_at', twoDaysAgo),
    listIncompleteAdvocateSignups(),
  ]);

  return {
    erasureRequests: erasureLog.data || [],
    stalePendingReview: pendingStale.data || [],
    missingBarCertificate: missingCert.data || [],
    ticketSlaBreaches: ticketBreaches.data || [],
    incompleteSignups: incomplete || [],
  };
}

