import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Pencil, Trash2, FileWarning, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  listAllAdvocates,
  listIncompleteAdvocateSignups,
  reviewAdvocateProfile,
  adminUpdateAdvocateProfile,
  deleteAdvocateProfile,
  getBarCertificateSignedUrl,
  uploadPhoto,
} from '../../lib/cms';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
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
  async function handleDelete(id) {
    if (!window.confirm("Delete this profile? The advocate's login stays active — they'll see a fresh unfilled profile next time.")) return;
    await deleteAdvocateProfile(id);
    load();
  }
  async function viewCert(path) {
    try { window.open(await getBarCertificateSignedUrl(path), '_blank'); } catch { alert('Could not open certificate.'); }
  }

  if (loading) return <Spinner />;

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: 'incomplete', label: 'No profile yet', count: counts.incomplete },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[19px] font-extrabold text-ink-900">Verify advocates</h2>
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
                {a.photo_url ? <img src={a.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">{(a.profiles?.full_name || '?').charAt(0)}</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-900">{a.profiles?.full_name}</span>
                    <Badge tone={a.verification_status === 'approved' ? 'green' : a.verification_status === 'rejected' ? 'red' : 'amber'}>{a.verification_status}</Badge>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-ink-500">
                    Submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : '—'} · {a.profiles?.phone || 'no phone'} · Bar No. {a.bar_number || '—'}
                  </div>
                  <div className="mt-1.5">
                    {a.bar_certificate_url ? (
                      <button onClick={() => viewCert(a.bar_certificate_url)} className="text-[12.5px] font-semibold text-brand-600 underline">View certificate</button>
                    ) : (
                      <span className="flex items-center gap-1 text-[12.5px] font-semibold text-coral-500"><FileWarning size={13} /> Certificate not uploaded</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(a.practice_areas || []).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}
                  </div>
                  <div className="mt-2 text-[12.5px] text-ink-500">{a.experience_years ? `${a.experience_years} yrs experience` : ''} {a.consultation_fee ? `· ₹${a.consultation_fee}/30min` : ''}</div>
                  {a.bio && <p className="mt-1.5 text-[13px] text-ink-600">{a.bio}</p>}

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
                    <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Pencil size={14} /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 size={14} /> Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AdvocateEditModal advocate={editing} onClose={() => setEditing(null)} onSaved={load} />
    </>
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
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        fields.photo_url = await uploadPhoto('advocate-photos', `${advocate.id}/photo.${ext}`, photoFile);
      }
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
