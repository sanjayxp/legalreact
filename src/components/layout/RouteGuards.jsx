import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAdminAccess } from '../../lib/auth';
import { Spinner } from '../ui/Misc';

// session existence only (mirrors requireAuth())
export function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading || session === undefined) return <Spinner className="min-h-screen" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// session + role match (mirrors the per-page role redirects)
export function RequireRole({ role, children }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading || session === undefined) return <Spinner className="min-h-screen" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  // OAuth signups must pick client/advocate before entering any dashboard —
  // otherwise a direct URL would drop them in as the trigger's default client.
  if (profile && !profile.role_confirmed && profile.role !== 'admin') {
    return <Navigate to="/choose-role" replace />;
  }
  if (profile && profile.role !== role) {
    const routes = { client: '/dashboard/client', advocate: '/dashboard/advocate', admin: '/admin' };
    return <Navigate to={routes[profile.role] || '/login'} replace />;
  }
  return children;
}

// Admin routes beyond the overview are gated per-section for delegated
// admins — a sub-admin without the "leads" grant, say, gets bounced to
// /admin instead of seeing a page they have no data access to anyway.
export function RequireAdminSection({ section, children }) {
  const { loading: accessLoading, can } = useAdminAccess();
  if (accessLoading) return <Spinner className="min-h-screen" />;
  if (!can(section)) return <Navigate to="/admin" replace />;
  return children;
}
