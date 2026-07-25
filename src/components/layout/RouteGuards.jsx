import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
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
  if (profile && profile.role !== role) {
    const routes = { client: '/dashboard/client', advocate: '/dashboard/advocate', admin: '/admin' };
    return <Navigate to={routes[profile.role] || '/login'} replace />;
  }
  return children;
}
