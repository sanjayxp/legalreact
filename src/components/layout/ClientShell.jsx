import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth, signOut } from '../../lib/auth';
import { Avatar } from '../ui/Misc';
import Logo from '../brand/Logo';

export default function ClientShell({ children }) {
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email || '';

  return (
    <div className="min-h-screen bg-ink-50/40">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
          <Logo size="sm" />
          <div className="ml-auto flex items-center gap-3">
            <Avatar name={name} size={34} />
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-[13px] font-semibold text-ink-500 hover:border-coral-400 hover:text-coral-500"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
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
