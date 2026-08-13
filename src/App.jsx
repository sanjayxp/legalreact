import { useEffect, useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RequireRole, RequireAdminSection } from './components/layout/RouteGuards';
import { PostMatterProvider } from './components/marketing/PostMatterContext';

// The browser's own scroll-position memory (bfcache / history restoration)
// can otherwise fight with the reset below on back/forward navigation.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

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
import ResetPassword from './pages/auth/ResetPassword';
import ClientDashboard from './pages/client/ClientDashboard';

import AdvocateOverview from './pages/advocate/Overview';
import AdvocateProfile from './pages/advocate/Profile';
import AdvocateBookings from './pages/advocate/Bookings';
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

// React Router doesn't reset scroll position on navigation the way a full
// page load does — without this, going from the bottom of one page to
// another leaves the visitor stranded mid-scroll on the new page.
//
// Uses `key` (not just `pathname`) so clicking Home/the logo while already
// on "/" still resets scroll, and useLayoutEffect so the jump happens before
// paint — no visible flash of the old scroll position.
//
// The behavior option is what defeats the global `scroll-behavior: smooth`
// in index.css. An earlier version flipped that property inline around the
// call instead, which silently did nothing at all: the style change is not
// applied before scrollTo reads it, so the scroll stayed smooth and was then
// cancelled when the property was put back. Asking for the behaviour on the
// call itself needs no style recalculation and cannot race with one.
function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, key, hash]);
  return null;
}

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
    <ScrollToTop />
    <ScrollToHash />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/dashboard/client" element={<RequireRole role="client"><ClientDashboard /></RequireRole>} />

      <Route path="/dashboard/advocate" element={<RequireRole role="advocate"><AdvocateOverview /></RequireRole>} />
      <Route path="/dashboard/advocate/profile" element={<RequireRole role="advocate"><AdvocateProfile /></RequireRole>} />
      <Route path="/dashboard/advocate/bookings" element={<RequireRole role="advocate"><AdvocateBookings /></RequireRole>} />
      <Route path="/dashboard/advocate/cases" element={<RequireRole role="advocate"><AdvocateCases /></RequireRole>} />
      <Route path="/dashboard/advocate/cases/:id" element={<RequireRole role="advocate"><AdvocateCaseWorkspace /></RequireRole>} />
      <Route path="/dashboard/advocate/clients" element={<RequireRole role="advocate"><AdvocateClientsBilling /></RequireRole>} />
      <Route path="/dashboard/advocate/documents" element={<RequireRole role="advocate"><AdvocateDocuments /></RequireRole>} />
      <Route path="/dashboard/advocate/settings" element={<RequireRole role="advocate"><AdvocateSettings /></RequireRole>} />

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
