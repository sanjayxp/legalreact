import { motion } from 'framer-motion';
import { Search, CalendarClock, MessagesSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import ClientShell from '../../components/layout/ClientShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const CARDS = [
  {
    icon: Search,
    title: 'Find an Advocate',
    body: 'Browse Bar Council-verified advocates by practice area, city, and language — coming soon.',
    accent: 'brand',
  },
  {
    icon: CalendarClock,
    title: 'My Consultations',
    body: 'Track upcoming and past bookings with your advocate in one place — coming soon.',
    accent: 'coral',
  },
  {
    icon: MessagesSquare,
    title: 'Legal Q&A',
    body: 'Ask a question and get answers from verified advocates — coming soon.',
    accent: 'sun',
  },
];

const accentClasses = {
  brand: 'bg-brand-50 text-brand-600',
  coral: 'bg-rose-50 text-rose-600',
  sun: 'bg-amber-50 text-amber-600',
};

export default function ClientDashboard() {
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email || '';
  const firstName = name.split(' ')[0];

  return (
    <ClientShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Here's what's happening with your legal matters.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mt-6 overflow-hidden rounded-2xl gradient-brand p-6 text-white"
      >
        <div className="relative z-10 flex items-center gap-3">
          <Sparkles size={20} />
          <div>
            <div className="font-bold">You're all set up</div>
            <div className="text-[13px] text-white/80">
              We're building out advocate search, consultations, and Q&amp;A for clients next.
            </div>
          </div>
        </div>
        <div className="blob-shape gradient-sun absolute -right-10 -top-10 h-40 w-40 opacity-30" />
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CARDS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <Card hover className="h-full">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${accentClasses[c.accent]}`}>
                <c.icon size={19} />
              </div>
              <h3 className="mt-4 text-[14.5px] font-bold text-ink-900">{c.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{c.body}</p>
              <Badge tone="gray" className="mt-4">
                Coming soon
              </Badge>
            </Card>
          </motion.div>
        ))}
      </div>
    </ClientShell>
  );
}
