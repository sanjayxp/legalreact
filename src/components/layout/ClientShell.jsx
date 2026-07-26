import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Search, MessageCircleQuestion, Gavel, Globe } from 'lucide-react';
import { useAuth, signOut } from '../../lib/auth';
import { Avatar } from '../ui/Misc';
import Logo from '../brand/Logo';

const NAV = [
  { to: '/advocates', label: 'Find an advocate', icon: Search },
  { to: '/qa', label: 'Legal Q&A', icon: MessageCircleQuestion },
  { to: '/track-case', label: 'Track your case', icon: Gavel },
];

export default function ClientShell({ children }) {
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email || '';

  return (
    <div className="min-h-screen bg-ink-50/40">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
          <Link to="/dashboard/client"><Logo size="sm" /></Link>
          <nav className="ml-6 hidden items-center gap-5 sm:flex">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
                <item.icon size={14} /> {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="hidden items-center gap-1.5 text-[13px] font-semibold text-ink-400 hover:text-brand-600 sm:flex">
              <Globe size={14} /> Visit website
            </Link>
            <Avatar name={name} size={34} />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-[13px] font-semibold text-ink-500 hover:border-coral-400 hover:text-coral-500"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-4 overflow-x-auto border-t border-ink-50 px-4 py-2 sm:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-ink-500">
              <item.icon size={13} /> {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
