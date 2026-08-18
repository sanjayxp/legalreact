import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Inbox, MessageCircleQuestion, GraduationCap, Users,
  LifeBuoy, History, Bell, TrendingUp, Briefcase, Mail, ShieldCheck,
} from 'lucide-react';
import { signOut, useAdminAccess } from '../../lib/auth';
import { listPendingAdvocates } from '../../lib/cms';
import Logo from '../brand/Logo';

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Growth',
    items: [
      { to: '/admin/leads', label: 'Leads', icon: Inbox, section: 'leads' },
      { to: '/admin/matters', label: 'Matters', icon: Briefcase },
      { to: '/admin/performance', label: 'Performance', icon: TrendingUp },
    ],
  },
  {
    label: 'Content & People',
    items: [
      { to: '/admin/qa', label: 'Q&A', icon: MessageCircleQuestion, section: 'qa' },
      { to: '/admin/jobs', label: 'Jobs & Learning', icon: GraduationCap, section: 'jobs_learning' },
      { to: '/admin/people', label: 'People', icon: Users, section: 'people', badge: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
      { to: '/admin/alerts', label: 'Alerts', icon: Bell },
      { to: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
      { to: '/admin/audit', label: 'Audit Log', icon: History },
    ],
  },
  {
    label: 'Communication',
    items: [{ to: '/admin/email-templates', label: 'Email Templates', icon: Mail }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminShell({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const { can, isSuper } = useAdminAccess();
  const canSee = (item) => !item.section || can(item.section);

  useEffect(() => {
    if (!can('people')) return;
    let mounted = true;
    listPendingAdvocates()
      .then((rows) => { if (mounted) setPendingCount(rows.length); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [can]);

  return (
    <div className="min-h-screen bg-ink-50/40 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-16 items-center px-5">
          <Logo dark size="sm" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group, gi) => {
            const items = group.items.filter(canSee);
            if (items.length === 0) return null;
            return (
              <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
                {group.label && (
                  <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/35">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                            isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && pendingCount > 0 && (
                          <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {pendingCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          {!isSuper && (
            <span className="block w-fit rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/60">
              Delegated admin
            </span>
          )}
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 hover:border-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-ink-900 lg:hidden">
        <div className="flex h-16 items-center gap-6 px-4 sm:px-8">
          <Logo dark size="sm" />
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
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2">
          {ALL_ITEMS.filter(canSee).map((item) => (
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
        className="min-w-0 flex-1 px-4 py-8 sm:px-8"
      >
        <div className="mx-auto max-w-6xl">{children}</div>
      </motion.main>
    </div>
  );
}
