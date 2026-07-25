import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireRole } from './components/layout/RouteGuards';

import Home from './pages/marketing/Home';
import PublicQA from './pages/marketing/QA';
import QuestionDetail from './pages/marketing/QuestionDetail';
import PublicJobs from './pages/marketing/Jobs';
import TrackCase from './pages/marketing/TrackCase';
import ForAdvocates from './pages/marketing/ForAdvocates';
import Login from './pages/auth/Login';
import ClientDashboard from './pages/client/ClientDashboard';

import AdvocateOverview from './pages/advocate/Overview';
import AdvocateProfile from './pages/advocate/Profile';
import AdvocateBookings from './pages/advocate/Bookings';
import AdvocateCases from './pages/advocate/Cases';
import AdvocateCaseWorkspace from './pages/advocate/CaseWorkspace';
import AdvocateClientsBilling from './pages/advocate/ClientsBilling';
import AdvocateDocuments from './pages/advocate/Documents';

import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/Overview';
import AdminLeads from './pages/admin/Leads';
import AdminQA from './pages/admin/QA';
import AdminJobs from './pages/admin/Jobs';
import AdminCourses from './pages/admin/Courses';
import AdminTeam from './pages/admin/Team';
import AdminClients from './pages/admin/Clients';
import AdminAdmins from './pages/admin/Admins';
import AdminVerifyAdvocates from './pages/admin/VerifyAdvocates';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/dashboard/client" element={<RequireRole role="client"><ClientDashboard /></RequireRole>} />

      <Route path="/dashboard/advocate" element={<RequireRole role="advocate"><AdvocateOverview /></RequireRole>} />
      <Route path="/dashboard/advocate/profile" element={<RequireRole role="advocate"><AdvocateProfile /></RequireRole>} />
      <Route path="/dashboard/advocate/bookings" element={<RequireRole role="advocate"><AdvocateBookings /></RequireRole>} />
      <Route path="/dashboard/advocate/cases" element={<RequireRole role="advocate"><AdvocateCases /></RequireRole>} />
      <Route path="/dashboard/advocate/cases/:id" element={<RequireRole role="advocate"><AdvocateCaseWorkspace /></RequireRole>} />
      <Route path="/dashboard/advocate/clients" element={<RequireRole role="advocate"><AdvocateClientsBilling /></RequireRole>} />
      <Route path="/dashboard/advocate/documents" element={<RequireRole role="advocate"><AdvocateDocuments /></RequireRole>} />

      <Route path="/admin" element={<RequireRole role="admin"><AdminOverview /></RequireRole>} />
      <Route path="/admin/leads" element={<RequireRole role="admin"><AdminLeads /></RequireRole>} />
      <Route path="/admin/qa" element={<RequireRole role="admin"><AdminQA /></RequireRole>} />
      <Route path="/admin/jobs" element={<RequireRole role="admin"><AdminJobs /></RequireRole>} />
      <Route path="/admin/courses" element={<RequireRole role="admin"><AdminCourses /></RequireRole>} />
      <Route path="/admin/team" element={<RequireRole role="admin"><AdminTeam /></RequireRole>} />
      <Route path="/admin/clients" element={<RequireRole role="admin"><AdminClients /></RequireRole>} />
      <Route path="/admin/admins" element={<RequireRole role="admin"><AdminAdmins /></RequireRole>} />
      <Route path="/admin/verify-advocates" element={<RequireRole role="admin"><AdminVerifyAdvocates /></RequireRole>} />

      <Route path="/" element={<Home />} />
      <Route path="/qa" element={<PublicQA />} />
      <Route path="/qa/:id" element={<QuestionDetail />} />
      <Route path="/jobs" element={<PublicJobs />} />
      <Route path="/track-case" element={<TrackCase />} />
      <Route path="/for-advocates" element={<ForAdvocates />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
