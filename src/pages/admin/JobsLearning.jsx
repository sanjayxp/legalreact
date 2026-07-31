import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import AdminShell from '../../components/layout/AdminShell';
import Tabs from '../../components/ui/Tabs';
import JobsTab from './Jobs';
import CoursesTab from './Courses';
import LegalLibraryTab from './LegalLibrary';

export default function JobsLearning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'library';

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Jobs &amp; Learning</h1>
        <p className="mt-1 text-[14px] text-ink-500">Manage what's shown on the public Jobs &amp; Learning page.</p>
      </motion.div>

      <div className="mt-5">
        <Tabs
          tabs={[
            { key: 'library', label: 'Legal Library', tone: 'violet', icon: BookOpen },
            { key: 'courses', label: 'Courses & Webinars', tone: 'gold', icon: GraduationCap },
            { key: 'jobs', label: 'Jobs', tone: 'brand', icon: Briefcase },
          ]}
          active={tab}
          onChange={(k) => setSearchParams({ tab: k })}
        />
      </div>

      <div className="mt-6">
        {tab === 'jobs' && <JobsTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'library' && <LegalLibraryTab />}
      </div>
    </AdminShell>
  );
}
