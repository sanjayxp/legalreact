import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  Inbox,
  CalendarCheck2,
  MessageCircleQuestion,
  Copy,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserCog,
  Gavel,
  IndianRupee,
  ArrowRight,
  CalendarDays,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getAdvocateProfile, listMySlots, getAvailability, countMyAnswers, listMyCases, listMyInvoices, listQuestionsPublic, submitAnswer } from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Field';
import { Spinner, EmptyState, Toast } from '../../components/ui/Misc';

const STATUS_COPY = {
  none: { tone: 'amber', icon: AlertCircle, title: 'Set up your profile', body: 'Complete your profile to start receiving leads and bookings.' },
  pending: { tone: 'amber', icon: Clock, title: 'Verification pending', body: "We're reviewing your profile. It'll go live once approved — usually within 2 working days." },
  approved: { tone: 'green', icon: CheckCircle2, title: 'Verified & live', body: 'Your profile is public. Clients can find and book you.' },
  rejected: { tone: 'red', icon: AlertCircle, title: 'Changes needed', body: "Your last submission wasn't approved. Update your profile to resubmit." },
};

function inNextDays(dateStr, days) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return d >= new Date(now.toDateString()) && d <= end;
}
function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function Overview() {
  const { profile, user } = useAuth();
  const [advProfile, setAdvProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answering, setAnswering] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [ap, sl, av, ac, cs, inv, qs] = await Promise.all([
      getAdvocateProfile(user.id),
      listMySlots(user.id),
      getAvailability(user.id),
      countMyAnswers(user.id),
      listMyCases(user.id),
      listMyInvoices(user.id),
      listQuestionsPublic(),
    ]);
    setAdvProfile(ap);
    setSlots(sl);
    setAvailability(av);
    setAnswerCount(ac);
    setCases(cs);
    setInvoices(inv);
    setQuestions(qs);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const status = advProfile?.verification_status || 'none';
  const statusInfo = STATUS_COPY[status];
  const now = new Date();
  const leadRequests = slots.filter((s) => s.status === 'requested');
  const upcoming = slots.filter((s) => s.status === 'confirmed' && new Date(s.slot_start) >= now);
  const isApproved = status === 'approved';
  const profileLink = isApproved ? `${window.location.origin}/advocates/${user.id}` : '';
  const waLink = profileLink ? `https://wa.me/?text=${encodeURIComponent('Book a consultation with me on LegalConnects: ' + profileLink)}` : '';
  const qrSrc = profileLink ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profileLink)}` : '';
  const name = profile?.full_name || user?.email || '';

  // ---- Today / this week agenda: hearings (cases) + confirmed bookings ----
  const hearingsThisWeek = cases
    .filter((c) => inNextDays(c.next_hearing_date, 7))
    .map((c) => ({ kind: 'hearing', at: c.next_hearing_date, title: c.case_title, sub: c.court_name, href: `/dashboard/advocate/cases/${c.id}` }));
  const bookingsThisWeek = upcoming
    .filter((s) => inNextDays(s.slot_start, 7))
    .map((s) => ({ kind: 'booking', at: s.slot_start, title: s.client_name, sub: s.mode, href: '/dashboard/advocate/bookings' }));
  const agenda = [...hearingsThisWeek, ...bookingsThisWeek].sort((a, b) => new Date(a.at) - new Date(b.at));
  const todayCount = agenda.filter((a) => isToday(a.at)).length;

  // ---- Needs attention ----
  const unpaidTotal = invoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + Number(i.amount), 0);

  // ---- Q&A opportunities: recent questions in this advocate's practice areas ----
  const myAreas = new Set((advProfile?.practice_areas || []).map((a) => a.toLowerCase()));
  const opportunities = questions.filter((q) => myAreas.has((q.topic || '').toLowerCase())).slice(0, 3);

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[26px] font-extrabold text-ink-900">Welcome back, {name.split(' ')[0]}</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">
          {todayCount > 0 ? `You have ${todayCount} thing${todayCount === 1 ? '' : 's'} on today.` : "Here's how your practice is doing on LegalConnects."}
        </p>
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
          <Link to="/dashboard/advocate/bookings" className="font-bold underline">Set it up</Link> so clients can book you.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Profile views" value={advProfile?.profile_views ?? 0} icon={<Eye size={16} />} accent="brand" />
        <StatTile label="New leads" value={leadRequests.length} icon={<Inbox size={16} />} accent="coral" />
        <StatTile label="Upcoming bookings" value={upcoming.length} icon={<CalendarCheck2 size={16} />} accent="green" />
        <StatTile label="Q&A answers posted" value={answerCount} icon={<MessageCircleQuestion size={16} />} accent="sun" />
      </div>

      {/* ---- Today's agenda + Needs attention ---- */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeading title="This week's agenda" sub="Hearings and confirmed bookings, in order." />
          {agenda.length === 0 ? (
            <EmptyState icon={<CalendarDays size={22} />} title="Nothing scheduled this week" />
          ) : (
            <div className="space-y-1">
              {agenda.map((a, i) => (
                <Link key={i} to={a.href} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-50">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    {a.kind === 'hearing' ? <Gavel size={15} /> : <CalendarCheck2 size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-ink-900">{a.title}</div>
                    <div className="truncate text-[12px] text-ink-400">{a.sub}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[12px] font-bold text-ink-700">{isToday(a.at) ? 'Today' : new Date(a.at).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div className="text-[11px] text-ink-400">{new Date(a.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeading title="Needs your attention" />
          <div className="space-y-3">
            <Link to="/dashboard/advocate/bookings" className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:border-brand-200">
              <div className="flex items-center gap-2.5">
                <Inbox size={16} className="text-coral-500" />
                <span className="text-[13.5px] font-semibold text-ink-800">Pending lead requests</span>
              </div>
              <Badge tone={leadRequests.length > 0 ? 'amber' : 'gray'}>{leadRequests.length}</Badge>
            </Link>
            <Link to="/dashboard/advocate/clients" className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:border-brand-200">
              <div className="flex items-center gap-2.5">
                <IndianRupee size={16} className="text-coral-500" />
                <span className="text-[13.5px] font-semibold text-ink-800">Outstanding invoices</span>
              </div>
              <Badge tone={unpaidTotal > 0 ? 'amber' : 'gray'}>₹{unpaidTotal.toLocaleString('en-IN')}</Badge>
            </Link>
            {status === 'none' || status === 'rejected' ? (
              <Link to="/dashboard/advocate/profile" className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:border-brand-200">
                <div className="flex items-center gap-2.5">
                  <UserCog size={16} className="text-coral-500" />
                  <span className="text-[13.5px] font-semibold text-ink-800">Profile needs action</span>
                </div>
                <Badge tone="amber">1</Badge>
              </Link>
            ) : null}
          </div>
        </Card>
      </div>

      {/* ---- Q&A opportunities: build visibility by answering (verified advocates only) ---- */}
      {isApproved && advProfile?.practice_areas?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
          <Card>
            <div className="flex items-center justify-between">
              <CardHeading title="Answer & be seen" sub="Recent questions in your practice areas — answering builds public visibility." />
              <Link to="/qa" className="flex items-center gap-1 text-[13px] font-semibold text-brand-600">
                All questions <ArrowRight size={13} />
              </Link>
            </div>
            {opportunities.length === 0 ? (
              <EmptyState icon={<MessageCircleQuestion size={22} />} title="No open questions in your practice areas right now" />
            ) : (
              <div className="space-y-2">
                {opportunities.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 p-3">
                    <div className="min-w-0">
                      <Badge tone="blue">{q.topic}</Badge>
                      <div className="mt-1 truncate text-[13.5px] font-semibold text-ink-900">{q.title}</div>
                      <div className="text-[11.5px] text-ink-400">{q.answers?.[0]?.count ?? 0} answers so far</div>
                    </div>
                    <Button size="sm" variant="subtle" onClick={() => setAnswering(q)}>Answer</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

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

      <AnswerModal question={answering} onClose={() => setAnswering(null)} advocateId={user.id} onAnswered={() => { setAnswering(null); loadAll(); }} />
    </AdvocateShell>
  );
}

function AnswerModal({ question, onClose, advocateId, onAnswered }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setBody(''); setErr(''); }, [question]);
  if (!question) return null;

  async function handleSubmit() {
    if (!body.trim()) { setErr('Please write an answer.'); return; }
    setBusy(true);
    setErr('');
    try {
      await submitAnswer(question.id, advocateId, body.trim());
      onAnswered();
    } catch (e) {
      setErr(e.message || 'Could not post your answer.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!question} onClose={onClose} title={question.title}>
      <p className="mb-3 text-[13.5px] text-ink-500 line-clamp-3">{question.body}</p>
      <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share plain-language guidance — this is public and helps build your visibility." />
      {err && <div className="mt-3"><Toast text={err} kind="err" /></div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={busy}><ThumbsUp size={14} /> {busy ? 'Posting…' : 'Post answer'}</Button>
      </div>
    </Modal>
  );
}
