import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, GraduationCap, MapPin, Clock, IndianRupee, ExternalLink, Landmark, BookOpen, ArrowRight,
  Search, X, SlidersHorizontal,
} from 'lucide-react';
import { listJobsPublic, listCoursesPublic, listPublishedActs } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import HeroBanner from '../../components/marketing/HeroBanner';
import ApplyModal from '../../components/marketing/ApplyModal';
import EnrollModal from '../../components/marketing/EnrollModal';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days}d ago`;
  return `Posted ${Math.floor(days / 30)}mo ago`;
}

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// Counts how often each non-empty value of `key` appears, most common first —
// filter options built from what's actually posted, not a hardcoded list that
// can drift from the real vocabulary (see admin Jobs/Courses forms).
function optionCounts(rows, key) {
  const counts = new Map();
  for (const r of rows) {
    const v = r[key];
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'library';
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [acts, setActs] = useState([]);
  const [applyJob, setApplyJob] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);

  // ---- Jobs filters ----
  const [jobSearch, setJobSearch] = useState('');
  const [jobEmpTypes, setJobEmpTypes] = useState(new Set());
  const [jobLocTypes, setJobLocTypes] = useState(new Set());
  const [jobExpLevels, setJobExpLevels] = useState(new Set());
  const [jobFiltersOpen, setJobFiltersOpen] = useState(false);

  // ---- Courses filters ----
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFreeOnly, setCourseFreeOnly] = useState(false);
  const [courseTagTypes, setCourseTagTypes] = useState(new Set());
  const [courseModes, setCourseModes] = useState(new Set());
  const [courseFiltersOpen, setCourseFiltersOpen] = useState(false);

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

  const empTypeOptions = useMemo(() => optionCounts(jobs, 'employment_type'), [jobs]);
  const locTypeOptions = useMemo(() => optionCounts(jobs, 'location_type'), [jobs]);
  const expLevelOptions = useMemo(() => optionCounts(jobs, 'experience_level'), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (jobEmpTypes.size && !jobEmpTypes.has(j.employment_type)) return false;
      if (jobLocTypes.size && !jobLocTypes.has(j.location_type)) return false;
      if (jobExpLevels.size && !jobExpLevels.has(j.experience_level)) return false;
      if (jobSearch) {
        const s = jobSearch.toLowerCase();
        const hay = [j.title, j.firm_name, j.description].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [jobs, jobEmpTypes, jobLocTypes, jobExpLevels, jobSearch]);

  const jobActiveFilterCount = jobEmpTypes.size + jobLocTypes.size + jobExpLevels.size;
  function clearJobFilters() {
    setJobEmpTypes(new Set());
    setJobLocTypes(new Set());
    setJobExpLevels(new Set());
  }

  // Firms with an open role right now, most active first — not a fabricated
  // "featured" list, just what's actually posted.
  const firmsHiring = useMemo(() => {
    const seen = new Map();
    for (const j of jobs) {
      if (!j.firm_name) continue;
      if (!seen.has(j.firm_name)) seen.set(j.firm_name, { firm_name: j.firm_name, firm_initials: j.firm_initials, firm_color: j.firm_color, logo_url: j.logo_url, count: 0 });
      seen.get(j.firm_name).count += 1;
    }
    return [...seen.values()].sort((a, b) => b.count - a.count).slice(0, 4);
  }, [jobs]);

  const tagTypeOptions = useMemo(() => optionCounts(courses, 'tag_type'), [courses]);
  const modeOptions = useMemo(() => optionCounts(courses, 'mode'), [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (courseFreeOnly && !c.is_free) return false;
      if (courseTagTypes.size && !courseTagTypes.has(c.tag_type)) return false;
      if (courseModes.size && !courseModes.has(c.mode)) return false;
      if (courseSearch) {
        const s = courseSearch.toLowerCase();
        const hay = [c.title, c.instructor].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [courses, courseFreeOnly, courseTagTypes, courseModes, courseSearch]);

  const courseActiveFilterCount = (courseFreeOnly ? 1 : 0) + courseTagTypes.size + courseModes.size;
  function clearCourseFilters() {
    setCourseFreeOnly(false);
    setCourseTagTypes(new Set());
    setCourseModes(new Set());
  }

  const jobFilterFields = (
    <>
      {empTypeOptions.length > 0 && (
        <FilterGroup label="Employment type">
          {empTypeOptions.map(([val, count]) => (
            <FilterCheckbox key={val} label={val} count={count} checked={jobEmpTypes.has(val)} onChange={() => setJobEmpTypes((prev) => toggleInSet(prev, val))} />
          ))}
        </FilterGroup>
      )}
      {locTypeOptions.length > 0 && (
        <FilterGroup label="Work mode">
          {locTypeOptions.map(([val, count]) => (
            <FilterCheckbox key={val} label={val} count={count} checked={jobLocTypes.has(val)} onChange={() => setJobLocTypes((prev) => toggleInSet(prev, val))} />
          ))}
        </FilterGroup>
      )}
      {expLevelOptions.length > 0 && (
        <FilterGroup label="Experience">
          {expLevelOptions.map(([val, count]) => (
            <FilterCheckbox key={val} label={val} count={count} checked={jobExpLevels.has(val)} onChange={() => setJobExpLevels((prev) => toggleInSet(prev, val))} />
          ))}
        </FilterGroup>
      )}
    </>
  );

  const courseFilterFields = (
    <>
      <FilterGroup label="Price">
        <label className="flex items-center gap-2 py-1 text-[13px] text-ink-700">
          <input type="checkbox" className="accent-brand-500" checked={courseFreeOnly} onChange={(e) => setCourseFreeOnly(e.target.checked)} />
          Free only
        </label>
      </FilterGroup>
      {tagTypeOptions.length > 0 && (
        <FilterGroup label="Type">
          {tagTypeOptions.map(([val, count]) => (
            <FilterCheckbox key={val} label={val} count={count} checked={courseTagTypes.has(val)} onChange={() => setCourseTagTypes((prev) => toggleInSet(prev, val))} />
          ))}
        </FilterGroup>
      )}
      {modeOptions.length > 0 && (
        <FilterGroup label="Mode">
          {modeOptions.map(([val, count]) => (
            <FilterCheckbox key={val} label={val} count={count} checked={courseModes.has(val)} onChange={() => setCourseModes((prev) => toggleInSet(prev, val))} />
          ))}
        </FilterGroup>
      )}
    </>
  );

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
          <div className="mt-8">
            <div className="mb-5 flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <Input className="pl-10" placeholder="Search job title or firm…" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} />
              </div>
              <button
                onClick={() => setJobFiltersOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-100 px-4 text-[13.5px] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600 lg:hidden"
              >
                <SlidersHorizontal size={15} />
                Filters
                {jobActiveFilterCount > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{jobActiveFilterCount}</span>}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_240px]">
              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                <Card className="!p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-ink-900">Filters</h3>
                    {jobActiveFilterCount > 0 && (
                      <button onClick={clearJobFilters} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  {jobFilterFields}
                </Card>
              </aside>

              <div className="min-w-0">
                <div className="mb-4 text-[13.5px] text-ink-400">{filteredJobs.length} role{filteredJobs.length === 1 ? '' : 's'} found</div>
                {filteredJobs.length === 0 ? (
                  <EmptyState icon={<Briefcase size={28} />} title={jobs.length === 0 ? 'No open roles right now' : 'No roles match your filters'} sub={jobs.length === 0 ? undefined : 'Try clearing a filter or broadening your search.'} />
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map((j, i) => (
                      <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                        <Card hover className="!p-5 cursor-pointer" onClick={() => navigate(`/jobs/${j.id}`)}>
                          <div className="flex items-start gap-3">
                            {j.logo_url ? (
                              <img src={j.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: j.firm_color || colorFor(j.firm_name) }}>
                                {j.firm_initials || j.firm_name?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[15.5px] font-bold text-ink-900">{j.title}</div>
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

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-500">
                            {j.experience_level && <span className="flex items-center gap-1"><Briefcase size={12} /> {j.experience_level}</span>}
                            {j.location_type && <span className="flex items-center gap-1"><MapPin size={12} /> {j.location_type}</span>}
                            {j.salary_range && <span className="flex items-center gap-1 font-bold text-brand-600"><IndianRupee size={12} /> {j.salary_range}</span>}
                          </div>

                          {j.description && <p className="mt-2.5 line-clamp-2 text-[13.5px] text-ink-500">{j.description}</p>}

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {j.employment_type && <Badge tone="gray">{j.employment_type}</Badge>}
                          </div>

                          <div className="mt-3.5 flex items-center justify-between border-t border-ink-50 pt-3">
                            <span className="text-[11.5px] text-ink-300">{timeAgo(j.created_at)}</span>
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); setApplyJob(j); }}>Apply now</Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                <div className="space-y-4">
                  {firmsHiring.length > 0 && (
                    <Card>
                      <h3 className="mb-3 text-[13px] font-bold text-ink-900">Firms hiring now</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {firmsHiring.map((f) => (
                          <div key={f.firm_name} title={f.firm_name} className="truncate rounded-lg border border-ink-100 p-2.5 text-center text-[11px] font-bold text-ink-500">
                            {f.firm_name}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  <Card className="!border-0 bg-brand-600 text-white">
                    <h3 className="text-[13.5px] font-extrabold">Are you hiring?</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-white/80">Reach Bar Council-verified advocates and law students directly.</p>
                    <Link to="/contact">
                      <Button size="sm" className="mt-3 !bg-white !text-brand-700 hover:!bg-brand-50">Get in touch</Button>
                    </Link>
                  </Card>
                </div>
              </aside>
            </div>

            <Modal open={jobFiltersOpen} onClose={() => setJobFiltersOpen(false)} title="Filters" width="max-w-md">
              <div className="max-h-[65vh] overflow-y-auto pr-1">{jobFilterFields}</div>
              <div className="mt-5 flex gap-3">
                {jobActiveFilterCount > 0 && <Button variant="ghost" className="flex-1" onClick={clearJobFilters}>Clear ({jobActiveFilterCount})</Button>}
                <Button className="flex-1" onClick={() => setJobFiltersOpen(false)}>Show {filteredJobs.length} result{filteredJobs.length === 1 ? '' : 's'}</Button>
              </div>
            </Modal>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-3 flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <Input className="pl-10" placeholder="Search courses, webinars, instructors…" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} />
              </div>
              <button
                onClick={() => setCourseFiltersOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-100 px-4 text-[13.5px] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600 lg:hidden"
              >
                <SlidersHorizontal size={15} />
                Filters
                {courseActiveFilterCount > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{courseActiveFilterCount}</span>}
              </button>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setCourseFreeOnly((v) => !v)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${courseFreeOnly ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
              >
                Free only
              </button>
              {tagTypeOptions.map(([val]) => (
                <button
                  key={val}
                  onClick={() => setCourseTagTypes((prev) => toggleInSet(prev, val))}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${courseTagTypes.has(val) ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
                >
                  {val}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr_220px]">
              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                <Card className="!p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-ink-900">Filters</h3>
                    {courseActiveFilterCount > 0 && (
                      <button onClick={clearCourseFilters} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  {courseFilterFields}
                </Card>
              </aside>

              <div className="min-w-0">
                <div className="mb-4 text-[13.5px] text-ink-400">{filteredCourses.length} result{filteredCourses.length === 1 ? '' : 's'}</div>
                {filteredCourses.length === 0 ? (
                  <EmptyState icon={<GraduationCap size={28} />} title={courses.length === 0 ? 'No courses listed right now' : 'No courses match your filters'} sub={courses.length === 0 ? undefined : 'Try clearing a filter or broadening your search.'} />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredCourses.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }}>
                        <Card hover className="flex h-full flex-col !p-0 overflow-hidden cursor-pointer" onClick={() => navigate(`/courses/${c.id}`)}>
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
                                  <a href={c.college_website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto shrink-0 text-ink-300 hover:text-brand-600">
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="mt-4 flex items-center gap-2">
                              <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setEnrollCourse(c); }}>{c.cta_label || 'Enroll now'}</Button>
                              {c.course_url && (
                                <a
                                  href={c.course_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
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
              </div>

              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                <div className="space-y-4">
                  {tagTypeOptions.length > 0 && (
                    <Card>
                      <h3 className="mb-3 text-[13px] font-bold text-ink-900">Browse by type</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {tagTypeOptions.map(([val, count]) => (
                          <button
                            key={val}
                            onClick={() => setCourseTagTypes((prev) => toggleInSet(prev, val))}
                            className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${courseTagTypes.has(val) ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
                          >
                            {val} ({count})
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
                  <Card className="!border-0 bg-gold-600 text-white">
                    <h3 className="text-[13.5px] font-extrabold">Run a law school or training program?</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-white/85">List your course or certification and reach advocates across India.</p>
                    <Link to="/contact">
                      <Button size="sm" className="mt-3 !bg-white !text-gold-700 hover:!bg-gold-50">Get in touch</Button>
                    </Link>
                  </Card>
                </div>
              </aside>
            </div>

            <Modal open={courseFiltersOpen} onClose={() => setCourseFiltersOpen(false)} title="Filters" width="max-w-md">
              <div className="max-h-[65vh] overflow-y-auto pr-1">{courseFilterFields}</div>
              <div className="mt-5 flex gap-3">
                {courseActiveFilterCount > 0 && <Button variant="ghost" className="flex-1" onClick={clearCourseFilters}>Clear ({courseActiveFilterCount})</Button>}
                <Button className="flex-1" onClick={() => setCourseFiltersOpen(false)}>Show {filteredCourses.length} result{filteredCourses.length === 1 ? '' : 's'}</Button>
              </div>
            </Modal>
          </div>
        )}
      </section>

      <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />
      <EnrollModal course={enrollCourse} onClose={() => setEnrollCourse(null)} />

      <Footer />
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="mt-5 border-t border-ink-50 pt-4 first:mt-4 first:border-t-0 first:pt-0">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-400">{label}</div>
      {children}
    </div>
  );
}

function FilterCheckbox({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1 text-[13px] text-ink-700">
      <input type="checkbox" className="accent-brand-500" checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[11.5px] text-ink-400">{count}</span>
    </label>
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

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<BookOpen size={28} />} title="No acts published yet" sub="Check back soon — we're building out the library." />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[var(--shadow-card)]">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
              <Link
                to={`/library/${a.slug}`}
                title={a.short_title && a.short_title !== a.title ? a.title : undefined}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-brand-50/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="truncate text-[15px] font-bold text-ink-900 transition-colors group-hover:text-brand-700">
                      {a.short_title || a.title}
                    </h3>
                    {a.year && <span className="shrink-0 text-[12.5px] text-ink-400">{a.year}</span>}
                  </div>
                  {a.summary && <p className="mt-0.5 truncate text-[13px] text-ink-500">{a.summary}</p>}
                  {/* On phones the badge is hidden, so the category rides along here instead. */}
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-brand-600 sm:hidden">{a.category}</p>
                </div>
                {/* Wrapper does the hiding — Badge's own display utility would win over `hidden`. */}
                <span className="hidden shrink-0 sm:block"><Badge tone="blue">{a.category}</Badge></span>
                <ArrowRight size={15} className="shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
