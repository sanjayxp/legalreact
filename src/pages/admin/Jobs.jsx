import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Briefcase } from 'lucide-react';
import { listJobsAdmin, saveJob, deleteJob, countApplications, listJobApplicants, uploadPhoto, getResumeSignedUrl } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Textarea, Label, Select, FormRow } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

const EMPTY = { title: '', firm_name: '', firm_initials: '', logo_url: '', company_url: '', employment_type: 'Full-time', location_type: 'On-site', experience_level: '', salary_range: '', description: '', key_skills: [], status: 'active' };

export default function Jobs() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({});
  const [editing, setEditing] = useState(null);
  const [applicantsFor, setApplicantsFor] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const rows = await listJobsAdmin();
    setJobs(rows);
    const c = {};
    await Promise.all(rows.map(async (j) => { c[j.id] = await countApplications(j.id); }));
    setCounts(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(job, logoFile) {
    const fields = { ...job };
    if (!fields.firm_initials) fields.firm_initials = (fields.firm_name || '').slice(0, 2).toUpperCase();
    fields.firm_color = colorFor(fields.firm_name);
    if (logoFile) fields.logo_url = await uploadPhoto('job-logos', `${Date.now()}-${logoFile.name}`, logoFile);
    await saveJob(fields);
    setEditing(null);
    load();
  }
  async function handleDelete() {
    setDeleting(true);
    await deleteJob(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }
  async function openApplicants(job) {
    setApplicantsFor(job);
    setApplicants(await listJobApplicants(job.id));
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-extrabold text-ink-900">Jobs</h2>
          <p className="mt-1 text-[13.5px] text-ink-500">Postings shown on the public Jobs &amp; Learning page.</p>
        </motion.div>
        <Button onClick={() => setEditing(EMPTY)}><Plus size={15} /> New job</Button>
      </div>

      <Card className="mt-5 overflow-x-auto !p-0">
        {jobs.length === 0 ? (
          <EmptyState icon={<Briefcase size={28} />} title="No jobs posted yet" />
        ) : (
          <table className="w-full min-w-[800px] text-[13px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11.5px] font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Role</th><th className="px-4 py-3">Firm</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Applicants</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink-900">{j.title}</div>
                    <div className="text-ink-400">{j.experience_level}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {j.firm_name}
                    {j.company_url && (
                      <a href={j.company_url} target="_blank" rel="noreferrer" className="ml-1.5 text-brand-500 hover:text-brand-700">↗</a>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={j.status === 'active' ? 'green' : 'gray'}>{j.status}</Badge></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openApplicants(j)} className="flex items-center gap-1 font-semibold text-brand-600"><Users size={13} /> {counts[j.id] ?? 0}</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(j)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(j)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <JobEditor job={editing} onClose={() => setEditing(null)} onSave={handleSave} />

      <Modal open={!!applicantsFor} onClose={() => setApplicantsFor(null)} title={`Applicants — ${applicantsFor?.title || ''}`}>
        <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
          {applicants.map((a) => (
            <div key={a.id} className="rounded-lg bg-ink-50 p-3 text-[13px]">
              <div className="font-bold text-ink-900">{a.full_name}</div>
              <div className="text-ink-500">{a.email} · {a.phone}</div>
              {a.cover_note && <div className="mt-1 italic text-ink-500">"{a.cover_note}"</div>}
              {a.resume_path && (
                <button onClick={async () => window.open(await getResumeSignedUrl(a.resume_path), '_blank')} className="mt-1 font-semibold text-brand-600">
                  View resume
                </button>
              )}
            </div>
          ))}
          {applicants.length === 0 && <div className="text-[13px] text-ink-400">No applicants yet.</div>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this job posting?"
        message={`This will permanently delete "${deleteTarget?.title}" at ${deleteTarget?.firm_name}. This can't be undone.`}
      />
    </>
  );
}

function JobEditor({ job, onClose, onSave }) {
  const [form, setForm] = useState(job || EMPTY);
  const [logoFile, setLogoFile] = useState(null);
  // Edited as a comma-separated string for a simpler input; stored as the
  // text[] the DB column actually is.
  const [skillsText, setSkillsText] = useState((job?.key_skills || []).join(', '));
  useEffect(() => { setForm(job || EMPTY); setLogoFile(null); setSkillsText((job?.key_skills || []).join(', ')); }, [job]);
  if (!job) return null;

  function handleSave() {
    const key_skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    onSave({ ...form, key_skills }, logoFile);
  }

  return (
    <Modal open={!!job} onClose={onClose} title={job.id ? 'Edit job' : 'New job'} width="max-w-2xl">
      <Label required>Title</Label>
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <FormRow>
        <div><Label required>Firm name</Label><Input value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} /></div>
        <div><Label>Logo</Label><input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="text-[13px]" /></div>
      </FormRow>
      <Label hint="(optional)">Company website</Label>
      <Input placeholder="https://…" value={form.company_url} onChange={(e) => setForm({ ...form, company_url: e.target.value })} />
      <FormRow>
        <div><Label>Employment type</Label><Select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
          {['Full-time', 'Part-time', 'Internship', 'Contract'].map((o) => <option key={o}>{o}</option>)}
        </Select></div>
        <div><Label>Location type</Label><Select value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })}>
          {['On-site', 'Hybrid', 'Remote'].map((o) => <option key={o}>{o}</option>)}
        </Select></div>
      </FormRow>
      <FormRow>
        <div><Label>Experience / PQE</Label><Input placeholder="e.g. 3-5 years" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })} /></div>
        <div><Label>Salary range</Label><Input placeholder="e.g. ₹8L - ₹12L per annum" value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} /></div>
      </FormRow>
      <Label>Description</Label>
      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Label hint="comma-separated — shown as chips on the job detail page">Key skills</Label>
      <Input placeholder="e.g. Contract review, Litigation, Drafting" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
      <Label>Status</Label>
      <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Active</option><option value="closed">Closed</option>
      </Select>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!form.title || !form.firm_name}>Save</Button>
      </div>
    </Modal>
  );
}
