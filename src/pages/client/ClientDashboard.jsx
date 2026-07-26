import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, CalendarClock, MessagesSquare, Sparkles, Video, Phone, Building2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { listMyBookingsByEmail } from '../../lib/cms';
import ClientShell from '../../components/layout/ClientShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Avatar, EmptyState, Spinner } from '../../components/ui/Misc';

const CARDS = [
  { icon: Search, title: 'Find an Advocate', body: 'Browse Bar Council-verified advocates by practice area, city, and language.', accent: 'brand', to: '/advocates' },
  { icon: MessagesSquare, title: 'Legal Q&A', body: 'Ask a question and get answers from verified advocates — free.', accent: 'sun', to: '/qa' },
];

const accentClasses = {
  brand: 'bg-brand-50 text-brand-600',
  coral: 'bg-rose-50 text-rose-600',
  sun: 'bg-amber-50 text-amber-600',
};

const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

const STATUS_TONE = { requested: 'gray', confirmed: 'blue', declined: 'gray', completed: 'blue', cancelled: 'gray' };
const STATUS_LABEL = { requested: 'Awaiting confirmation', confirmed: 'Confirmed', declined: 'Declined', completed: 'Completed', cancelled: 'Cancelled' };

function formatSlot(slot) {
  const d = new Date(slot.slot_start);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function ClientDashboard() {
  const { profile, user } = useAuth();
  const name = profile?.full_name || user?.email || '';
  const firstName = name.split(' ')[0];
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!profile?.email) return;
    listMyBookingsByEmail(profile.email)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.email]);

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
            <div className="font-bold">Ready when you are</div>
            <div className="text-[13px] text-white/80">
              Browse verified advocates, ask a free question, or check your upcoming consultations below.
            </div>
          </div>
        </div>
        <div className="blob-shape gradient-sun absolute -right-10 -top-10 h-40 w-40 opacity-30" />
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CARDS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <Link to={c.to}>
              <Card hover className="h-full">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${accentClasses[c.accent]}`}>
                  <c.icon size={19} />
                </div>
                <h3 className="mt-4 text-[14.5px] font-bold text-ink-900">{c.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{c.body}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-ink-900">
            <CalendarClock size={17} className="text-rose-600" /> My Consultations
          </h2>
          <Link to="/advocates" className="text-[13px] font-semibold text-brand-600">Book another →</Link>
        </div>

        {loading ? (
          <Spinner className="py-8" />
        ) : bookings.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CalendarClock size={26} />}
              title="No consultations yet"
              sub="When you book a slot with an advocate, it'll show up here."
              action={<Link to="/advocates" className="font-semibold text-brand-600">Find an advocate →</Link>}
            />
          </Card>
        ) : (
          <div className="space-y-2.5">
            {bookings.map((b) => {
              const advName = b.advocate_profiles?.profiles?.full_name || 'Advocate';
              const mode = MODE_META[b.mode];
              return (
                <Card key={b.id} className="flex items-center gap-4 !p-4">
                  <Avatar src={b.advocate_profiles?.photo_url} name={advName} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink-900">{advName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                      <span>{formatSlot(b)}</span>
                      {mode && <span className="flex items-center gap-1"><mode.icon size={12} /> {mode.label}</span>}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[b.status] || 'gray'}>{STATUS_LABEL[b.status] || b.status}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </ClientShell>
  );
}
