import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Inbox, CalendarCheck2, MessageCircleQuestion, Copy, Share2, CheckCircle2, Clock, AlertCircle, UserCog } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getAdvocateProfile, listMySlots, getAvailability, countMyAnswers } from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Misc';

const STATUS_COPY = {
  none: { tone: 'amber', icon: AlertCircle, title: 'Set up your profile', body: 'Complete your profile to start receiving leads and bookings.' },
  pending: { tone: 'amber', icon: Clock, title: 'Verification pending', body: "We're reviewing your profile. It'll go live once approved — usually within 2 working days." },
  approved: { tone: 'green', icon: CheckCircle2, title: 'Verified & live', body: 'Your profile is public. Clients can find and book you.' },
  rejected: { tone: 'red', icon: AlertCircle, title: 'Changes needed', body: "Your last submission wasn't approved. Update your profile to resubmit." },
};

export default function Overview() {
  const { profile, user } = useAuth();
  const [advProfile, setAdvProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ap, sl, av, ac] = await Promise.all([
        getAdvocateProfile(user.id),
        listMySlots(user.id),
        getAvailability(user.id),
        countMyAnswers(user.id),
      ]);
      setAdvProfile(ap);
      setSlots(sl);
      setAvailability(av);
      setAnswerCount(ac);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const status = advProfile?.verification_status || 'none';
  const statusInfo = STATUS_COPY[status];
  const now = new Date();
  const newLeads = slots.filter((s) => s.status === 'requested').length;
  const upcoming = slots.filter((s) => s.status === 'confirmed' && new Date(s.slot_start) >= now).length;
  const isApproved = status === 'approved';
  const profileLink = isApproved ? `${window.location.origin}/#advocate=${user.id}` : '';
  const waLink = profileLink ? `https://wa.me/?text=${encodeURIComponent('Book a consultation with me on LegalConnects: ' + profileLink)}` : '';
  const qrSrc = profileLink ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profileLink)}` : '';
  const name = profile?.full_name || user?.email || '';

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[26px] font-extrabold text-ink-900">Welcome back, {name.split(' ')[0]}</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Here's how your practice is doing on LegalConnects.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 flex items-start gap-3 rounded-2xl border border-ink-100 bg-white p-5"
      >
        <Badge tone={statusInfo.tone} className="mt-0.5 shrink-0">
          <statusInfo.icon size={13} />
        </Badge>
        <div className="flex-1">
          <div className="font-bold text-ink-900">{statusInfo.title}</div>
          <div className="mt-0.5 text-[13.5px] text-ink-500">{statusInfo.body}</div>
        </div>
        {status !== 'approved' && (
          <Link to="/dashboard/advocate/profile">
            <Button size="sm" variant={status === 'none' ? 'primary' : 'ghost'}>
              <UserCog size={14} /> {status === 'none' ? 'Set up profile' : 'Edit profile'}
            </Button>
          </Link>
        )}
      </motion.div>

      {availability.length === 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
          You haven't set your weekly availability yet.{' '}
          <Link to="/dashboard/advocate/bookings" className="font-bold underline">
            Set it up
          </Link>{' '}
          so clients can book you.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Profile views" value={advProfile?.profile_views ?? 0} icon={<Eye size={16} />} accent="brand" />
        <StatTile label="New leads" value={newLeads} icon={<Inbox size={16} />} accent="coral" />
        <StatTile label="Upcoming bookings" value={upcoming} icon={<CalendarCheck2 size={16} />} accent="green" />
        <StatTile label="Q&A answers posted" value={answerCount} icon={<MessageCircleQuestion size={16} />} accent="sun" />
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
        <Card>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {advProfile?.photo_url ? (
                <img src={advProfile.photo_url} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-[17px] font-bold text-ink-900">{name}</div>
                <div className="text-[13.5px] text-ink-500">{advProfile?.headline || 'Add a headline to your profile'}</div>
                {advProfile?.consultation_fee && (
                  <div className="mt-1 text-[13px] font-semibold text-brand-600">₹{advProfile.consultation_fee} / 30 min</div>
                )}
              </div>
            </div>

            {isApproved ? (
              <div className="flex flex-1 flex-wrap items-center gap-4 sm:justify-end">
                <img src={qrSrc} alt="QR code" className="h-24 w-24 rounded-lg border border-ink-100" />
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(profileLink)}>
                    <Copy size={14} /> Copy link
                  </Button>
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="subtle" className="w-full">
                      <Share2 size={14} /> Share on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-[13px] text-ink-400 sm:text-right">Your visiting card unlocks once you're verified &amp; live.</div>
            )}
          </div>
        </Card>
      </motion.div>
    </AdvocateShell>
  );
}
