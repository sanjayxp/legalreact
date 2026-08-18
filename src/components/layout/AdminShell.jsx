import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signOut, useAdminAccess } from '../../lib/auth';
import { listPendingAdvocates } from '../../lib/cms';
import Logo from '../brand/Logo';

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/leads', label: 'Leads', section: 'leads' },
  { to: '/admin/qa', label: 'Q&A', section: 'qa' },
  { to: '/admin/jobs', label: 'Jobs & Learning', section: 'jobs_learning' },
  { to: '/admin/people', label: 'People', section: 'people', badge: true },
  { to: '/admin/support', label: 'Support Tickets' },
  { to: '/admin/audit', label: 'Audit Log' },
];

export default function AdminShell({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const { can, isSuper } = useAdminAccess();
  const visibleNav = NAV.filter((item) => !item.section || can(item.section));

  useEffect(() => {
    if (!can('people')) return;
    let mounted = true;
    listPendingAdvocates()
      .then((rows) => { if (mounted) setPendingCount(rows.length); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [can]);

  return (
    <div className="min-h-screen bg-ink-50/40">
      <header className="sticky top-0 z-50 bg-ink-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-8">
          <Logo dark size="sm" />
          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`
                }
              >
                {item.label}
                {item.badge && pendingCount > 0 && (
                  <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {!isSuper && (
              <span className="hidden rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/60 sm:inline">
                Delegated admin
              </span>
            )}
            <button
              onClick={signOut}
              className="rounded-lg border border-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 hover:border-white/40 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60'
                }`
              }
            >
              {item.label}{item.badge && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </NavLink>
          ))}
        </nav>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
