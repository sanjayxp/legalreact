import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, MapPin, Clock, IndianRupee } from 'lucide-react';
import { listJobsPublic, listCoursesPublic, submitJobApplication, submitCourseEnrollment, uploadResume } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import { Input, Textarea, Label } from '../../components/ui/Field';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

export default function Jobs() {
  const [tab, setTab] = useState('jobs');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [j, c] = await Promise.all([listJobsPublic(), listCoursesPublic()]);
      setJobs(j);
      setCourses(c);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Careers &amp; growth</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Jobs &amp; Learning</h1>
          <p className="mt-2 max-w-lg text-[16px] text-ink-500">Legal roles at firms and chambers, plus courses and webinars to build your practice.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <Tabs
          tabs={[{ key: 'jobs', label: 'Jobs', count: jobs.length }, { key: 'courses', label: 'Courses & Webinars', count: courses.length }]}
          active={tab}
          onChange={setTab}
        />

        {loading ? (
          <Spinner />
        ) : tab === 'jobs' ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.length === 0 && <EmptyState icon={<Briefcase size={28} />} title="No open roles right now" />}
            {jobs.map((j, i) => (
              <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }}>
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    {j.logo_url ? (
                      <img src={j.logo_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: j.firm_color || colorFor(j.firm_name) }}>
                        {j.firm_initials || j.firm_name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-[15px] font-bold text-ink-900">{j.title}</div>
                      <div className="text-[13px] text-ink-500">{j.firm_name}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="gray">{j.employment_type}</Badge>
                    <Badge tone="gray"><MapPin size={11} /> {j.location_type}</Badge>
                    {j.experience_level && <Badge tone="gray">{j.experience_level}</Badge>}
                  </div>
                  {j.salary_range && <div className="mt-2 text-[13px] font-semibold text-brand-600">{j.salary_range}</div>}
                  <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] text-ink-500">{j.description}</p>
                  <Button size="sm" className="mt-4" onClick={() => setApplyJob(j)}>Apply now</Button>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 && <EmptyState icon={<GraduationCap size={28} />} title="No courses listed right now" />}
            {courses.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }}>
                <Card hover className="flex h-full flex-col !p-0 overflow-hidden">
                  <div className="h-28 w-full" style={{ background: c.image_url ? `url(${c.image_url}) center/cover` : c.band_color || colorFor(c.title) }} />
                  <div className="flex flex-1 flex-col p-5">
                    <Badge tone="blue" className="w-fit">{c.tag_type}</Badge>
                    <div className="mt-2 text-[15px] font-bold text-ink-900">{c.title}</div>
                    <div className="mt-1 text-[13px] text-ink-500">{c.instructor}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[12.5px] text-ink-400">
                      {c.duration && <span className="flex items-center gap-1"><Clock size={12} /> {c.duration}</span>}
                      {c.mode && <span>{c.mode}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[13.5px] font-bold text-brand-600">
                      {c.is_free ? 'Free' : <><IndianRupee size={13} /> {c.price}</>}
                    </div>
                    <Button size="sm" className="mt-4" onClick={() => setEnrollCourse(c)}>{c.cta_label || 'Enroll now'}</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />
      <EnrollModal course={enrollCourse} onClose={() => setEnrollCourse(null)} />

      <Footer />
    </div>
  );
}

function ApplyModal({ job, onClose }) {
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

function EnrollModal({ course, onClose }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { setForm({ full_name: '', email: '', phone: '' }); setMsg(''); setDone(false); }, [course]);
  if (!course) return null;

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) { setMsg('Please fill in your name, email, and phone.'); return; }
    setBusy(true);
    setMsg('');
    try {
      await submitCourseEnrollment({ course_id: course.id, ...form, enrolled_at: new Date().toISOString() });
      setDone(true);
    } catch (e) {
      setMsg(e.message || 'Could not submit your enrollment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!course} onClose={onClose} title={`Enroll — ${course.title}`}>
      {done ? (
        <Toast text="You're enrolled! Details will be sent to your email." kind="ok" />
      ) : (
        <>
          <Label required>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Label required>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label required>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>{busy ? 'Submitting…' : 'Confirm enrollment'}</Button>
        </>
      )}
    </Modal>
  );
}
