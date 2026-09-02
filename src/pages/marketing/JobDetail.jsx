import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, MapPin, IndianRupee, ExternalLink, Clock } from 'lucide-react';
import { getJobPublic, listJobsByFirm } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import ApplyModal from '../../components/marketing/ApplyModal';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/Misc';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days}d ago`;
  return `Posted ${Math.floor(days / 30)}mo ago`;
}

export default function JobDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);
  const [applyJob, setApplyJob] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const j = await getJobPublic(id);
      setJob(j);
      if (j?.firm_name) setRelated(await listJobsByFirm(j.firm_name, id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white">
        <PublicNav />
        <Spinner className="min-h-[50vh]" />
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <EmptyState icon={<Briefcase size={28} />} title="This role couldn't be found" sub="It may have been removed." action={<Link to="/jobs?tab=jobs" className="mt-2 inline-block text-[13.5px] font-semibold text-brand-600 hover:underline">Back to Jobs</Link>} />
        </div>
        <Footer />
      </div>
    );
  }

  const isActive = job.status === 'active';

  return (
    <div className="bg-white">
      <PublicNav />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link to="/jobs?tab=jobs" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <Card>
              <div className="flex items-start gap-4">
                {job.logo_url ? (
                  <img src={job.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-[16px] font-extrabold text-white" style={{ background: job.firm_color || colorFor(job.firm_name) }}>
                    {job.firm_initials || job.firm_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[22px] font-extrabold text-ink-900">{job.title}</h1>
                    {!isActive && <Badge tone="gray">Closed</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[14.5px] text-ink-500">
                    {job.firm_name}
                    {job.company_url && (
                      <a href={job.company_url} target="_blank" rel="noreferrer" className="text-ink-300 hover:text-brand-600">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 pt-4 text-[13.5px] text-ink-600">
                {job.experience_level && <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-ink-400" /> {job.experience_level}</span>}
                {job.location_type && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-ink-400" /> {job.location_type}</span>}
                {job.salary_range && <span className="flex items-center gap-1.5 font-bold text-brand-600"><IndianRupee size={14} /> {job.salary_range}</span>}
                {job.created_at && <span className="flex items-center gap-1.5 text-ink-400"><Clock size={13} /> {timeAgo(job.created_at)}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.employment_type && <Badge tone="gray">{job.employment_type}</Badge>}
              </div>

              <Button className="mt-5 w-full sm:w-auto" onClick={() => setApplyJob(job)} disabled={!isActive}>
                {isActive ? 'Apply now' : 'No longer accepting applications'}
              </Button>
            </Card>

            {job.description && (
              <Card className="mt-6">
                <CardHeading title="Job description" />
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-700">{job.description}</p>
              </Card>
            )}

            {job.key_skills?.length > 0 && (
              <Card className="mt-6">
                <CardHeading title="Key skills" />
                <div className="flex flex-wrap gap-2">
                  {job.key_skills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
                </div>
              </Card>
            )}
          </div>

          <div>
            {related.length > 0 && (
              <Card>
                <CardHeading title={`More roles at ${job.firm_name}`} />
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link key={r.id} to={`/jobs/${r.id}`} className="block rounded-lg border border-ink-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
                      <div className="text-[13.5px] font-bold text-ink-900">{r.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
                        {r.experience_level && <span className="flex items-center gap-1"><Briefcase size={11} /> {r.experience_level}</span>}
                        {r.location_type && <span>· {r.location_type}</span>}
                      </div>
                      <div className="mt-1 text-[11px] text-ink-400">{timeAgo(r.created_at)}</div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />
      <Footer />
    </div>
  );
}
