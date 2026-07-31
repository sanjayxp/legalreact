import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, MapPin, Clock, IndianRupee, ExternalLink, Landmark, BookOpen, ArrowRight } from 'lucide-react';
import { listJobsPublic, listCoursesPublic, listPublishedActs, submitJobApplication, submitCourseEnrollment, uploadResume } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import HeroBanner from '../../components/marketing/HeroBanner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import { Input, Textarea, Label } from '../../components/ui/Field';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days}d ago`;
  return `Posted ${Math.floor(days / 30)}mo ago`;
}

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'library';
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [acts, setActs] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [j, c, a] = await Promise.all([listJobsPublic(), listCoursesPublic(), listPublishedActs()]);
      setJobs(j);
      setCourses(c);
      setActs(a);
      setLoading(false);
    })();
  }, []);

  function setTab(k) {
    setSearchParams(k === 'library' ? {} : { tab: k });
  }

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <HeroBanner colors={['gradient-sun', 'gradient-brand']} layout={3} />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Careers &amp; growth</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Jobs &amp; Learning</h1>
          <p className="mt-2 max-w-lg text-[16px] text-ink-500">A free library of bare acts, plus courses, webinars, and legal roles at firms and chambers.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <Tabs
          tabs={[
            { key: 'library', label: 'Legal Library', count: acts.length, tone: 'violet', icon: BookOpen },
            { key: 'courses', label: 'Courses & Webinars', count: courses.length, tone: 'gold', icon: GraduationCap },
            { key: 'jobs', label: 'Jobs', count: jobs.length, tone: 'brand', icon: Briefcase },
          ]}
          active={tab}
          onChange={setTab}
        />

        {loading ? (
          <Spinner />
        ) : tab === 'library' ? (
          <LibraryGrid acts={acts} />
        ) : tab === 'jobs' ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.length === 0 && <EmptyState icon={<Briefcase size={28} />} title="No open roles right now" />}
            {jobs.map((j, i) => (
              <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }}>
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {j.logo_url ? (
                        <img src={j.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: j.firm_color || colorFor(j.firm_name) }}>
                          {j.firm_initials || j.firm_name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-[15px] font-bold text-ink-900">{j.title}</div>
                        <div className="flex items-center gap-1.5 text-[13px] text-ink-500">
                          {j.firm_name}
                          {j.company_url && (
                            <a href={j.company_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-ink-300 hover:text-brand-600">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="gray">{j.employment_type}</Badge>
                    <Badge tone="gray"><MapPin size={11} /> {j.location_type}</Badge>
                    {j.experience_level && <Badge tone="gray">{j.experience_level}</Badge>}
                  </div>
                  {j.salary_range && (
                    <div className="mt-3 flex items-center gap-1 text-[14px] font-bold text-brand-600">
                      <IndianRupee size={13} /> {j.salary_range}
                    </div>
                  )}
                  <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] text-ink-500">{j.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-3">
                    <span className="text-[11.5px] text-ink-300">{timeAgo(j.created_at)}</span>
                    <Button size="sm" onClick={() => setApplyJob(j)}>Apply now</Button>
                  </div>
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
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="blue" className="w-fit">{c.tag_type}</Badge>
                      <div className="text-[13.5px] font-bold text-brand-600">
                        {c.is_free ? 'Free' : <span className="flex items-center gap-0.5"><IndianRupee size={12} />{c.price}</span>}
                      </div>
                    </div>
                    <div className="mt-2 text-[15px] font-bold text-ink-900">{c.title}</div>
                    <div className="mt-1 text-[13px] text-ink-500">{c.instructor}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[12.5px] text-ink-400">
                      {c.duration && <span className="flex items-center gap-1"><Clock size={12} /> {c.duration}</span>}
                      {c.mode && <span>{c.mode}</span>}
                    </div>
                    {c.college_name && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-[12px] text-ink-500">
                        <Landmark size={12} className="shrink-0 text-ink-400" />
                        <span className="truncate">Issued by {c.college_name}</span>
                        {c.college_website && (
                          <a href={c.college_website} target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-ink-300 hover:text-brand-600">
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setEnrollCourse(c)}>{c.cta_label || 'Enroll now'}</Button>
                      {c.course_url && (
                        <a
                          href={c.course_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-ink-100 px-3 py-2 text-[12.5px] font-semibold text-ink-500 hover:border-brand-300 hover:text-brand-600"
                        >
                          Details <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
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

function LibraryGrid({ acts }) {
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => [...new Set(acts.map((a) => a.category))], [acts]);
  const filtered = category === 'all' ? acts : acts.filter((a) => a.category === category);

  return (
    <div className="mt-8">
      <p className="max-w-2xl text-[14px] text-ink-500">
        Bare acts and legal texts for students to study — Constitution, codes, and statutes, organized by subject.
      </p>
      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${category === 'all' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${category === c ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <EmptyState icon={<BookOpen size={28} />} title="No acts published yet" sub="Check back soon — we're building out the library." />}
        {filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }}>
            <Link to={`/library/${a.slug}`}>
              <Card hover className="flex h-full flex-col">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><BookOpen size={18} /></div>
                <Badge tone="blue" className="mt-3.5 w-fit">{a.category}</Badge>
                <h3 className="mt-2 flex items-center gap-1.5 text-[15px] font-bold text-ink-900">
                  {a.short_title || a.title} <ArrowRight size={13} />
                </h3>
                {a.short_title && a.short_title !== a.title && <div className="text-[12px] text-ink-400">{a.title}{a.year ? ` (${a.year})` : ''}</div>}
                <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] text-ink-500">{a.summary}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
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
          {(course.course_url || course.college_website) && (
            <a
              href={course.course_url || course.college_website}
              target="_blank"
              rel="noreferrer"
              className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
            >
              View full course details <ExternalLink size={12} />
            </a>
          )}
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
