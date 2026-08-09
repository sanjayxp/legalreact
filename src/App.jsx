import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RequireRole, RequireAdminSection } from './components/layout/RouteGuards';
import { PostMatterProvider } from './components/marketing/PostMatterContext';

import Home from './pages/marketing/Home';
import PublicQA from './pages/marketing/QA';
import QuestionDetail from './pages/marketing/QuestionDetail';
import PublicJobs from './pages/marketing/Jobs';
import LegalActReader from './pages/marketing/LegalActReader';
import TrackCase from './pages/marketing/TrackCase';
import ForAdvocates from './pages/marketing/ForAdvocates';
import Advocates from './pages/marketing/Advocates';
import PublicAdvocateProfile from './pages/marketing/AdvocateProfile';
import About from './pages/marketing/About';
import Privacy from './pages/marketing/Privacy';
import Terms from './pages/marketing/Terms';
import Disclaimer from './pages/marketing/Disclaimer';
import RefundPolicy from './pages/marketing/RefundPolicy';
import Contact from './pages/marketing/Contact';
import Careers from './pages/marketing/Careers';
import Login from './pages/auth/Login';
import ClientDashboard from './pages/client/ClientDashboard';

import AdvocateOverview from './pages/advocate/Overview';
import AdvocateProfile from './pages/advocate/Profile';
import AdvocateEnquiries from './pages/advocate/Enquiries';
import AdvocateDiary from './pages/advocate/Diary';
import AdvocateSettings from './pages/advocate/Settings';
import AdvocateCases from './pages/advocate/Cases';
import AdvocateCaseWorkspace from './pages/advocate/CaseWorkspace';
import AdvocateClientsBilling from './pages/advocate/ClientsBilling';
import AdvocateDocuments from './pages/advocate/Documents';

import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/Overview';
import AdminLeads from './pages/admin/Leads';
import AdminQA from './pages/admin/QA';
import AdminJobsLearning from './pages/admin/JobsLearning';
import AdminPeople from './pages/admin/People';

// React Router doesn't scroll to an in-page anchor on navigation the way a
// full page load does — this restores that for links like /#how-it-works.
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 0);
    return () => clearTimeout(timer);
  }, [hash, pathname]);
  return null;
}

export default function App() {
  return (
    <PostMatterProvider>
    <ScrollToHash />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/dashboard/client" element={<RequireRole role="client"><ClientDashboard /></RequireRole>} />

      <Route path="/dashboard/advocate" element={<RequireRole role="advocate"><AdvocateOverview /></RequireRole>} />
      <Route path="/dashboard/advocate/profile" element={<RequireRole role="advocate"><AdvocateProfile /></RequireRole>} />
      <Route path="/dashboard/advocate/enquiries" element={<RequireRole role="advocate"><AdvocateEnquiries /></RequireRole>} />
      <Route path="/dashboard/advocate/diary" element={<RequireRole role="advocate"><AdvocateDiary /></RequireRole>} />
      <Route path="/dashboard/advocate/settings" element={<RequireRole role="advocate"><AdvocateSettings /></RequireRole>} />
      {/* The old combined page split in two; keep existing links working. */}
      <Route path="/dashboard/advocate/bookings" element={<Navigate to="/dashboard/advocate/diary" replace />} />
      <Route path="/dashboard/advocate/cases" element={<RequireRole role="advocate"><AdvocateCases /></RequireRole>} />
      <Route path="/dashboard/advocate/cases/:id" element={<RequireRole role="advocate"><AdvocateCaseWorkspace /></RequireRole>} />
      <Route path="/dashboard/advocate/clients" element={<RequireRole role="advocate"><AdvocateClientsBilling /></RequireRole>} />
      <Route path="/dashboard/advocate/documents" element={<RequireRole role="advocate"><AdvocateDocuments /></RequireRole>} />

      <Route path="/admin" element={<RequireRole role="admin"><AdminOverview /></RequireRole>} />
      <Route path="/admin/leads" element={<RequireRole role="admin"><RequireAdminSection section="leads"><AdminLeads /></RequireAdminSection></RequireRole>} />
      <Route path="/admin/qa" element={<RequireRole role="admin"><RequireAdminSection section="qa"><AdminQA /></RequireAdminSection></RequireRole>} />
      <Route path="/admin/jobs" element={<RequireRole role="admin"><RequireAdminSection section="jobs_learning"><AdminJobsLearning /></RequireAdminSection></RequireRole>} />
      <Route path="/admin/people" element={<RequireRole role="admin"><RequireAdminSection section="people"><AdminPeople /></RequireAdminSection></RequireRole>} />
      <Route path="/admin/courses" element={<Navigate to="/admin/jobs?tab=courses" replace />} />
      <Route path="/admin/team" element={<Navigate to="/admin/people?tab=team" replace />} />
      <Route path="/admin/clients" element={<Navigate to="/admin/people?tab=clients" replace />} />
      <Route path="/admin/admins" element={<Navigate to="/admin/people?tab=admins" replace />} />
      <Route path="/admin/verify-advocates" element={<Navigate to="/admin/people?tab=advocates" replace />} />

      <Route path="/" element={<Home />} />
      <Route path="/qa" element={<PublicQA />} />
      <Route path="/qa/:id" element={<QuestionDetail />} />
      <Route path="/jobs" element={<PublicJobs />} />
      <Route path="/library/:slug" element={<LegalActReader />} />
      <Route path="/track-case" element={<TrackCase />} />
      <Route path="/for-advocates" element={<ForAdvocates />} />
      <Route path="/advocates" element={<Advocates />} />
      <Route path="/advocates/:id" element={<PublicAdvocateProfile />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </PostMatterProvider>
  );
}
