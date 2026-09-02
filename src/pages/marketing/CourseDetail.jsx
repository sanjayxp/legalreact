import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, IndianRupee, ExternalLink, Landmark, GraduationCap } from 'lucide-react';
import { getCoursePublic, listCoursesByInstructor } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import EnrollModal from '../../components/marketing/EnrollModal';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { EmptyState, Spinner } from '../../components/ui/Misc';

export default function CourseDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [related, setRelated] = useState([]);
  const [enrollCourse, setEnrollCourse] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const c = await getCoursePublic(id);
      setCourse(c);
      if (c?.instructor) setRelated(await listCoursesByInstructor(c.instructor, id));
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

  if (!course) {
    return (
      <div className="bg-white">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <EmptyState icon={<GraduationCap size={28} />} title="This course couldn't be found" sub="It may have been removed." action={<Link to="/jobs?tab=courses" className="mt-2 inline-block text-[13.5px] font-semibold text-brand-600 hover:underline">Back to Courses</Link>} />
        </div>
        <Footer />
      </div>
    );
  }

  const isActive = course.status === 'active';

  return (
    <div className="bg-white">
      <PublicNav />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link to="/jobs?tab=courses" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All courses
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <Card className="!p-0 overflow-hidden">
              <div className="h-40 w-full" style={{ background: course.image_url ? `url(${course.image_url}) center/cover` : course.band_color || colorFor(course.title) }} />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {course.tag_type && <Badge tone="blue">{course.tag_type}</Badge>}
                  {!isActive && <Badge tone="gray">Closed</Badge>}
                </div>
                <h1 className="mt-2 text-[22px] font-extrabold text-ink-900">{course.title}</h1>
                {course.instructor && <div className="mt-1 text-[14.5px] text-ink-500">{course.instructor}</div>}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 pt-4 text-[13.5px] text-ink-600">
                  <span className="flex items-center gap-1.5 font-bold text-brand-600">
                    <IndianRupee size={14} /> {course.is_free ? 'Free' : course.price}
                  </span>
                  {course.duration && <span className="flex items-center gap-1.5"><Clock size={14} className="text-ink-400" /> {course.duration}</span>}
                  {course.mode && <span>{course.mode}</span>}
                  {course.schedule_text && <span className="text-ink-400">{course.schedule_text}</span>}
                </div>

                <Button className="mt-5 w-full sm:w-auto" onClick={() => setEnrollCourse(course)} disabled={!isActive}>
                  {isActive ? (course.cta_label || 'Enroll now') : 'No longer open for enrollment'}
                </Button>
              </div>
            </Card>

            {course.description && (
              <Card className="mt-6">
                <CardHeading title="About this course" />
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-700">{course.description}</p>
              </Card>
            )}

            {course.college_name && (
              <Card className="mt-6">
                <CardHeading title="Issuing institution" />
                <div className="flex items-center gap-2 text-[14px] text-ink-700">
                  <Landmark size={16} className="shrink-0 text-ink-400" />
                  {course.college_name}
                  {course.college_website && (
                    <a href={course.college_website} target="_blank" rel="noreferrer" className="text-ink-300 hover:text-brand-600">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                {course.college_contact && <div className="mt-1.5 text-[13px] text-ink-500">{course.college_contact}</div>}
              </Card>
            )}
          </div>

          <div>
            {related.length > 0 && (
              <Card>
                <CardHeading title={`More from ${course.instructor}`} />
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link key={r.id} to={`/courses/${r.id}`} className="block rounded-lg border border-ink-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
                      <div className="text-[13.5px] font-bold text-ink-900">{r.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
                        {r.tag_type && <span>{r.tag_type}</span>}
                        {r.duration && <span>· {r.duration}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      <EnrollModal course={enrollCourse} onClose={() => setEnrollCourse(null)} />
      <Footer />
    </div>
  );
}
