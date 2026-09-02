import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { submitJobApplication, uploadResume } from '../../lib/cms';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Label } from '../ui/Field';
import { Toast } from '../ui/Misc';

// Shared by the Jobs list and the job detail page, so "Apply now" behaves
// identically wherever it's clicked from.
export default function ApplyModal({ job, onClose }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', cover_note: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { setForm({ full_name: '', email: '', phone: '', cover_note: '' }); setFile(null); setMsg(''); setDone(false); }, [job]);
  if (!job) return null;

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) { setMsg('Please fill in your name, email, and phone.'); return; }
    setBusy(true);
    setMsg('');
    try {
      let resume_path = null;
      if (file) resume_path = await uploadResume(job.id, file);
      await submitJobApplication({ job_id: job.id, ...form, resume_path, applied_at: new Date().toISOString() });
      setDone(true);
    } catch (e) {
      setMsg(e.message || 'Could not submit your application.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!job} onClose={onClose} title={`Apply — ${job.title}`}>
      {done ? (
        <Toast text="Application submitted! The firm will reach out if there's a fit." kind="ok" />
      ) : (
        <>
          {job.company_url && (
            <a href={job.company_url} target="_blank" rel="noreferrer" className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
              Visit {job.firm_name}'s website <ExternalLink size={12} />
            </a>
          )}
          <Label required>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Label required>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label required>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Label>Cover note</Label>
          <Textarea rows={3} value={form.cover_note} onChange={(e) => setForm({ ...form, cover_note: e.target.value })} />
          <Label>Resume</Label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} className="text-[13px]" />
          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</Button>
        </>
      )}
    </Modal>
  );
}
