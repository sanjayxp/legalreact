import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Pencil, Trash2, FileWarning, ShieldCheck, Eye, Mail, Phone, MapPin, Briefcase, GraduationCap, Languages, Video, IndianRupee } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  listAllAdvocates,
  listIncompleteAdvocateSignups,
  reviewAdvocateProfile,
  adminUpdateAdvocateProfile,
  deleteAdvocateProfile,
  getBarCertificateSignedUrl,
  uploadAdvocatePhoto,
} from '../../lib/cms';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Textarea, Label, FormRow } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Misc';
import { EmptyState, Spinner } from '../../components/ui/Misc';

import { PRACTICE_AREAS as AREAS } from '../../lib/practiceAreas';

export default function VerifyAdvocates() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [advocates, setAdvocates] = useState([]);
  const [incomplete, setIncomplete] = useState([]);
  const [tab, setTab] = useState('pending');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [all, inc] = await Promise.all([listAllAdvocates(), listIncompleteAdvocateSignups()]);
    setAdvocates(all);
    setIncomplete(inc);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: advocates.length,
    pending: advocates.filter((a) => a.verification_status === 'pending').length,
    approved: advocates.filter((a) => a.verification_status === 'approved').length,
    rejected: advocates.filter((a) => a.verification_status === 'rejected').length,
    incomplete: incomplete.length,
  }), [advocates, incomplete]);

  const filtered = tab === 'all' ? advocates : tab === 'incomplete' ? [] : advocates.filter((a) => a.verification_status === tab);

  async function handleReview(id, status) {
    await reviewAdvocateProfile(id, status, user.id);
    load();
  }
  async function handleDelete() {
    setDeleting(true);
    await deleteAdvocateProfile(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }
  async function viewCert(path) {
    try { window.open(await getBarCertificateSignedUrl(path), '_blank'); } catch { alert('Could not open certificate.'); }
  }

  if (loading) return <Spinner />;

  const tabs = [
    { key: 'all', label: 'All', count: counts.all, tone: 'brand' },
    { key: 'pending', label: 'Pending', count: counts.pending, tone: 'gold' },
    { key: 'approved', label: 'Approved', count: counts.approved, tone: 'emerald' },
    { key: 'rejected', label: 'Rejected', count: counts.rejected, tone: 'rose' },
    { key: 'incomplete', label: 'No profile yet', count: counts.incomplete, tone: 'slate' },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[18px] font-extrabold text-ink-900">Verify advocates</h2>
        <p className="mt-1 text-[13.5px] text-ink-500">Review Bar Council submissions and manage advocate profiles.</p>
      </motion.div>

      <div className="mt-5"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      <div className="mt-5 space-y-4">
        {tab === 'incomplete' ? (
          incomplete.length === 0 ? <EmptyState title="Everyone who signed up has started a profile" /> : incomplete.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-ink-900">{p.full_name || p.email}</div>
                <div className="text-[12.5px] text-ink-500">{p.email} · signed up {new Date(p.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <Badge tone="gray">No profile submitted</Badge>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={28} />} title="Nothing here" />
        ) : (
          filtered.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button onClick={() => setViewing(a)} className="shrink-0">
                  {a.photo_url ? <img src={a.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">{(a.profiles?.full_name || '?').charAt(0)}</div>}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setViewing(a)} className="font-bold text-ink-900 hover:text-brand-600 hover:underline">{a.profiles?.full_name}</button>
                    <Badge tone={a.verification_status === 'approved' ? 'green' : a.verification_status === 'rejected' ? 'red' : 'amber'}>{a.verification_status}</Badge>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ink-500">
                    {a.profiles?.email || 'no email'} · {a.profiles?.phone || 'no phone'} · Bar No. {a.bar_number || '—'}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ink-400">
                    Submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : '—'}
                  </div>
                  <div className="mt-1.5">
                    {a.bar_certificate_url ? (
                      <button onClick={() => viewCert(a.bar_certificate_url)} className="text-[12.5px] font-semibold text-brand-600 underline">View certificate</button>
                    ) : (
                      <span className="flex items-center gap-1 text-[12.5px] font-semibold text-coral-500"><FileWarning size={13} /> Certificate not uploaded</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(a.practice_areas || []).slice(0, 4).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}
                    {(a.practice_areas || []).length > 4 && <Badge tone="gray">+{a.practice_areas.length - 4}</Badge>}
                  </div>
                  <div className="mt-2 text-[12.5px] text-ink-500">{a.experience_years ? `${a.experience_years} yrs experience` : ''} {a.consultation_fee ? `· ₹${a.consultation_fee}/30min` : ''}</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.verification_status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleReview(a.id, 'approved')}><CheckCircle2 size={14} /> Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => handleReview(a.id, 'rejected')}><XCircle size={14} /> Reject</Button>
                      </>
                    )}
                    {a.verification_status === 'approved' && (
                      <Button size="sm" variant="danger" onClick={() => handleReview(a.id, 'rejected')}>Unapprove</Button>
                    )}
                    {a.verification_status === 'rejected' && (
                      <Button size="sm" onClick={() => handleReview(a.id, 'approved')}><CheckCircle2 size={14} /> Approve</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setViewing(a)}><Eye size={14} /> View details</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Pencil size={14} /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)}><Trash2 size={14} /> Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AdvocateEditModal advocate={editing} onClose={() => setEditing(null)} onSaved={load} />
      <AdvocateDetailsModal advocate={viewing} onClose={() => setViewing(null)} onViewCert={viewCert} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this advocate profile?"
        message={`This will delete ${deleteTarget?.profiles?.full_name || 'this advocate'}'s profile. Their login stays active — they'll see a fresh, unfilled profile next time they sign in.`}
      />
    </>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-ink-400" />
      <div>
        <div className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">{label}</div>
        <div className="text-[13.5px] text-ink-800">{value}</div>
      </div>
    </div>
  );
}

function AdvocateDetailsModal({ advocate, onClose, onViewCert }) {
  if (!advocate) return null;
  const p = advocate.profiles || {};

  return (
    <Modal open={!!advocate} onClose={onClose} title="Advocate details" width="max-w-2xl">
      <div className="flex items-center gap-4">
        {advocate.photo_url ? (
          <img src={advocate.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">{(p.full_name || '?').charAt(0)}</div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-extrabold text-ink-900">{p.full_name}</span>
            <Badge tone={advocate.verification_status === 'approved' ? 'green' : advocate.verification_status === 'rejected' ? 'red' : 'amber'}>{advocate.verification_status}</Badge>
          </div>
          {advocate.headline && <div className="text-[13.5px] text-ink-500">{advocate.headline}</div>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-ink-50 p-4 sm:grid-cols-2">
        <DetailRow icon={Mail} label="Email" value={p.email} />
        <DetailRow icon={Phone} label="Phone" value={p.phone} />
        <DetailRow icon={MapPin} label="Location" value={[advocate.city, advocate.state].filter(Boolean).join(', ')} />
        <DetailRow icon={Languages} label="Languages" value={(advocate.languages || []).join(', ')} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailRow icon={Briefcase} label="Bar No." value={advocate.bar_number} />
        <DetailRow icon={Briefcase} label="State Bar Council" value={advocate.state_bar_council} />
        <DetailRow icon={GraduationCap} label="Enrolled" value={advocate.enrollment_year} />
        <DetailRow icon={IndianRupee} label="Fee / 30min" value={advocate.consultation_fee ? `₹${advocate.consultation_fee}` : null} />
      </div>

      <div className="mt-4">
        {advocate.bar_certificate_url ? (
          <button onClick={() => onViewCert(advocate.bar_certificate_url)} className="text-[13px] font-semibold text-brand-600 underline">View Bar Council certificate</button>
        ) : (
          <span className="flex items-center gap-1 text-[13px] font-semibold text-coral-500"><FileWarning size={14} /> Certificate not uploaded</span>
        )}
      </div>

      {(advocate.consultation_modes || []).length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-600">
          <Video size={14} className="text-ink-400" /> Consults via {advocate.consultation_modes.join(', ')}
        </div>
      )}

      {(advocate.practice_areas || []).length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">Practice areas</div>
          <div className="flex flex-wrap gap-1.5">{advocate.practice_areas.map((pa) => <Badge key={pa} tone="blue">{pa}</Badge>)}</div>
        </div>
      )}

      {advocate.bio && (
        <div className="mt-4">
          <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">Bio</div>
          <p className="text-[13.5px] leading-relaxed text-ink-700">{advocate.bio}</p>
        </div>
      )}

      {(advocate.experience_timeline || []).length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">Experience</div>
          <div className="space-y-2">
            {advocate.experience_timeline.map((e, i) => (
              <div key={i} className="text-[13.5px] text-ink-700">
                <span className="font-semibold">{e.title}</span>{e.org && ` · ${e.org}`}{e.period && <span className="text-ink-400"> ({e.period})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(advocate.education_timeline || []).length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-400">Education</div>
          <div className="space-y-2">
            {advocate.education_timeline.map((e, i) => (
              <div key={i} className="text-[13.5px] text-ink-700">
                <span className="font-semibold">{e.degree}</span>{e.institution && ` · ${e.institution}`}{e.period && <span className="text-ink-400"> ({e.period})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-100 pt-3 text-[12px] text-ink-400">
        <span>Submitted {advocate.submitted_at ? new Date(advocate.submitted_at).toLocaleDateString('en-IN') : '—'}</span>
        {advocate.reviewed_at && <span>Reviewed {new Date(advocate.reviewed_at).toLocaleDateString('en-IN')}</span>}
        <span>{advocate.view_count || 0} profile views</span>
      </div>
    </Modal>
  );
}

function AdvocateEditModal({ advocate, onClose, onSaved }) {
  const [form, setForm] = useState(advocate || {});
  const [areas, setAreas] = useState(new Set());
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(advocate || {});
    setAreas(new Set(advocate?.practice_areas || []));
    setPhotoFile(null);
  }, [advocate]);

  if (!advocate) return null;

  function toggleArea(a) {
    const next = new Set(areas);
    next.has(a) ? next.delete(a) : next.add(a);
    setAreas(next);
  }

  async function save() {
    setSaving(true);
    try {
      const fields = {
        headline: form.headline,
        city: form.city,
        state: form.state,
        bio: form.bio,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        practice_areas: Array.from(areas),
      };
      if (photoFile) fields.photo_url = await uploadAdvocatePhoto(advocate.id, photoFile);
      await adminUpdateAdvocateProfile(advocate.id, fields);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!advocate} onClose={onClose} title={`Edit — ${advocate.profiles?.full_name || ''}`} width="max-w-2xl">
      <Label>Photo</Label>
      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="text-[13px]" />
      <Label>Headline</Label>
      <Input value={form.headline || ''} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
      <FormRow>
        <div><Label>City</Label><Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>State</Label><Input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
      </FormRow>
      <Label>Practice areas</Label>
      <div className="flex flex-wrap gap-2">{AREAS.map((a) => <Chip key={a} active={areas.has(a)} onClick={() => toggleArea(a)}>{a}</Chip>)}</div>
      <FormRow>
        <div><Label>Years of experience</Label><Input type="number" value={form.experience_years ?? ''} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></div>
        <div><Label>Consultation fee (₹)</Label><Input type="number" value={form.consultation_fee ?? ''} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} /></div>
      </FormRow>
      <Label>Bio</Label>
      <Textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </Modal>
  );
}
