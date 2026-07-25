import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserRound,
  Inbox,
  Gavel,
  Users,
  FileText,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { signOut } from '../../lib/auth';
import { listMySlots } from '../../lib/cms';
import { Avatar } from '../ui/Misc';
import Logo from '../brand/Logo';

const NAV = [
  { to: '/dashboard/advocate', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/advocate/profile', label: 'Profile', icon: UserRound },
  { to: '/dashboard/advocate/bookings', label: 'Leads & Bookings', icon: Inbox, badge: true },
  { to: '/dashboard/advocate/cases', label: 'My Cases', icon: Gavel },
  { to: '/dashboard/advocate/clients', label: 'Clients', icon: Users },
  { to: '/dashboard/advocate/documents', label: 'Documents', icon: FileText },
];

export default function AdvocateShell({ children }) {
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email || '';
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    listMySlots(user.id)
      .then((rows) => setLeadCount(rows.filter((s) => s.status === 'requested').length))
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-5 md:flex">
        <div className="mb-6 px-2"><Logo size="sm" /></div>

        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-ink-50 px-2.5 py-2.5">
          <Avatar src={null} name={name} size={36} />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-ink-900">{name.split(' ')[0] || '…'}</div>
            <div className="text-[11.5px] text-ink-400">Advocate</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                }`
              }
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && leadCount > 0 && (
                <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{leadCount}</span>
              )}
            </NavLink>
          ))}
          <Link
            to="/"
            className="mt-2 flex items-center gap-2.5 rounded-lg border-t border-ink-100 px-3 py-2.5 pt-4 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600"
          >
            <Globe size={16} />
            Visit Website
          </Link>
        </nav>

        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px] font-semibold text-ink-500 hover:border-coral-400 hover:text-coral-500"
        >
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8"
      >
        <div className="mx-auto max-w-5xl">{children}</div>
      </motion.main>
    </div>
  );
}
