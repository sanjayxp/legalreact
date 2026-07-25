import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth, signOut } from '../../lib/auth';
import Logo from '../brand/Logo';
import Button from '../ui/Button';
import { Avatar } from '../ui/Misc';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/qa', label: 'Legal Q&A' },
  { to: '/track-case', label: 'Track Your Case' },
  { to: '/jobs', label: 'Jobs & Learning' },
  { to: '/for-advocates', label: 'For Advocates' },
];

const DASHBOARD_PATH = { client: '/dashboard/client', advocate: '/dashboard/advocate', admin: '/admin' };

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { session, profile, user } = useAuth();
  const isLoggedIn = !!session;
  const dashboardPath = DASHBOARD_PATH[profile?.role] || '/dashboard/client';
  const name = profile?.full_name || user?.email || '';

  const linkClass = ({ isActive }) =>
    `relative pb-1.5 text-[15px] font-semibold transition-colors ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center px-5 sm:px-8">
        <Link to="/"><Logo size="lg" /></Link>
        <nav className="ml-14 hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <span className="absolute -bottom-[1px] left-0 h-[3px] w-full rounded-full bg-brand-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          {isLoggedIn ? (
            <>
              <Link to={dashboardPath} className="flex items-center gap-2.5 text-[14px] font-semibold text-ink-700 hover:text-brand-600">
                <Avatar name={name} size={30} />
                Dashboard
              </Link>
              <button onClick={signOut} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 hover:text-coral-500">
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-[15px] font-semibold text-ink-700 hover:text-brand-600">
                Log in
              </Link>
              <Link to="/login#register">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
        <button className="ml-auto rounded-lg p-2 text-ink-800 lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-ink-100 bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={({ isActive }) => `py-1.5 text-[15px] font-semibold ${isActive ? 'text-brand-600' : 'text-ink-700'}`}>
                {l.label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="py-1.5 text-[15px] font-semibold text-ink-700">Dashboard</Link>
                <button onClick={signOut} className="py-1.5 text-left text-[15px] font-semibold text-coral-500">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="py-1.5 text-[15px] font-semibold text-ink-700">Log in</Link>
                <Link to="/login#register"><Button className="mt-1 w-full">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
