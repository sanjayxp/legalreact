import { useEffect, useState } from 'react';
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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `relative pb-1.5 text-[15px] font-semibold transition-colors ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`;

  return (
    <>
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
        <button
          className="ml-auto rounded-lg p-2 text-ink-800 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-white px-5 py-6 lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-lg px-3 py-3 text-[16px] font-semibold ${isActive ? 'bg-brand-50 text-brand-600' : 'text-ink-700'}`}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="my-3 border-t border-ink-100" />
            {isLoggedIn ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-[16px] font-semibold text-ink-700">
                  <Avatar name={name} size={26} /> Dashboard
                </Link>
                <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg px-3 py-3 text-left text-[16px] font-semibold text-coral-500">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[16px] font-semibold text-ink-700">Log in</Link>
                <Link to="/login#register" onClick={() => setOpen(false)} className="mt-2 px-3">
                  <Button className="w-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
