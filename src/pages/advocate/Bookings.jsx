import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2, Check, X as XIcon, Phone, Video, Building2, UserPlus, ArrowRight, Inbox, CalendarDays, BellRing, CalendarCheck2, Clock, History, Mail, Download } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { googleCalendarUrl, downloadIcs } from '../../lib/calendarLinks';
import {
  listMySlots,
  getAvailability,
  setAvailability,
  listTimeOff,
  addTimeOff,
  deleteTimeOff,
  confirmBookingRequest,
  declineBookingRequest,
  updateSlotStatus,
  listMyLeads,
  acceptLead,
  declineLead,
} from '../../lib/cms';
import { computeDaySlots, startOfWeek, dayKey } from '../../lib/slots';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Field';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODE_ICON = { video: Video, phone: Phone, inperson: Building2 };

export default function Bookings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('enquiries');
  const [slots, setSlots] = useState([]);
  const [availability, setAvailabilityState] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('ok');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  async function loadAll() {
    const [sl, av, to, lq] = await Promise.all([listMySlots(user.id), getAvailability(user.id), listTimeOff(user.id), listMyLeads(user.id)]);
    setSlots(sl);
    setAvailabilityState(av);
    setTimeOff(to);
    setEnquiries(lq);
    setLoading(false);
  }

  useEffect(() => {
    if (user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const now = new Date();
  const openEnquiries = enquiries.filter((l) => l.status === 'new' || l.status === 'contacted');
  const requests = slots.filter((s) => s.status === 'requested');
  const upcoming = slots.filter((s) => s.status === 'confirmed' && new Date(s.slot_start) >= now);
  const past = slots.filter((s) => ['completed', 'cancelled', 'declined'].includes(s.status) || (s.status === 'confirmed' && new Date(s.slot_start) < now));

  const tabs = [
    { key: 'enquiries', label: 'Enquiries', count: openEnquiries.length, tone: 'rose', icon: Inbox },
    { key: 'calendar', label: 'Calendar', tone: 'brand', icon: CalendarDays },
    { key: 'requests', label: 'Booking requests', count: requests.length, tone: 'gold', icon: BellRing },
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length, tone: 'emerald', icon: CalendarCheck2 },
    { key: 'availability', label: 'Availability', tone: 'violet', icon: Clock },
    { key: 'past', label: 'Past', tone: 'slate', icon: History },
  ];

  function say(text, kind = 'ok') {
    setMsg(text);
    setMsgKind(kind);
  }

  async function handleConfirm(id) {
    try {
      await confirmBookingRequest(id);
      say('Confirmed.');
      loadAll();
    } catch (e) {
      say(e.message, 'err');
    }
  }
  async function handleDecline(id) {
    try {
      await declineBookingRequest(id);
      loadAll();
    } catch (e) {
      say(e.message, 'err');
    }
  }
  async function handleStatus(id, status) {
    await updateSlotStatus(id, status);
    loadAll();
  }
  async function handleAcceptLead(id) {
    try {
      await acceptLead(id);
      say('Accepted — added to your client register.');
      loadAll();
    } catch (e) {
      say(e.message, 'err');
    }
  }
  async function handleDeclineLead(id) {
    try {
      await declineLead(id);
      loadAll();
    } catch (e) {
      say(e.message, 'err');
    }
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Enquiries &amp; bookings</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Enquiries routed to you by our team, plus your availability and consultation requests.</p>
      </motion.div>

      <div className="mt-5"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
      {msg && <div className="mt-3"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5">
        {tab === 'enquiries' && <EnquiriesList enquiries={enquiries} onAccept={handleAcceptLead} onDecline={handleDeclineLead} />}
        {tab === 'calendar' && (
          <CalendarView weekStart={weekStart} setWeekStart={setWeekStart} availability={availability} timeOff={timeOff} slots={slots} onConfirm={handleConfirm} onDecline={handleDecline} />
        )}
        {tab === 'requests' && <RequestsList requests={requests} onConfirm={handleConfirm} onDecline={handleDecline} />}
        {tab === 'upcoming' && <BookingList list={upcoming} onStatus={handleStatus} showComplete />}
        {tab === 'availability' && (
          <AvailabilityEditor
            advocateId={user.id}
            availability={availability}
            timeOff={timeOff}
            onSaved={loadAll}
            setMsg={say}
          />
        )}
        {tab === 'past' && <BookingList list={past} readonly />}
      </div>
    </AdvocateShell>
  );
}

const ENQUIRY_STATUS_TONE = { new: 'amber', contacted: 'blue', converted: 'green', dropped: 'gray' };

function EnquiriesList({ enquiries, onAccept, onDecline }) {
  if (!enquiries.length) {
    return <EmptyState title="No enquiries yet" sub="Public enquiries our team routes to you will show up here — accept one to add it to your client register." />;
  }
  return (
    <div className="space-y-3">
      {enquiries.map((l) => {
        const actionable = l.status === 'new' || l.status === 'contacted';
        return (
          <Card key={l.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[14px] font-bold text-ink-900">{l.client_name || 'Unnamed enquiry'}</div>
                <Badge tone={ENQUIRY_STATUS_TONE[l.status] || 'gray'}>{l.status}</Badge>
              </div>
              <div className="text-[12.5px] text-ink-500">{l.phone} {l.email ? `· ${l.email}` : ''}</div>
              {l.matter && <div className="mt-1 text-[12.5px] text-ink-600">{l.matter}</div>}
            </div>
            {actionable ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onAccept(l.id)}><UserPlus size={14} /> Accept &amp; add as client</Button>
                <Button size="sm" variant="ghost" onClick={() => onDecline(l.id)}><XIcon size={14} /> Decline</Button>
              </div>
            ) : l.status === 'converted' ? (
              <Link to="/dashboard/advocate/clients" className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                View in Clients <ArrowRight size={13} />
              </Link>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function RequestsList({ requests, onConfirm, onDecline }) {
  if (!requests.length) return <EmptyState title="No booking requests right now" sub="New consultation-slot requests will show up here." />;
  const byTime = {};
  requests.forEach((l) => {
    (byTime[l.slot_start] ||= []).push(l);
  });
  return (
    <div className="space-y-3">
      {Object.entries(byTime).map(([time, group]) => (
        <Card key={time}>
          <div className="mb-2 text-[13px] font-bold text-ink-500">{new Date(time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          {group.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-50 py-3 first:border-0 first:pt-0">
              <div>
                <div className="text-[14px] font-bold text-ink-900">{s.client_name}</div>
                <div className="text-[12.5px] text-ink-500">{s.client_phone} {s.client_email ? `· ${s.client_email}` : ''}</div>
                {s.client_notes && <div className="mt-1 text-[12.5px] italic text-ink-400">"{s.client_notes}"</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onConfirm(s.id)}><Check size={14} /> Confirm</Button>
                <Button size="sm" variant="danger" onClick={() => onDecline(s.id)}><XIcon size={14} /> Decline</Button>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function BookingList({ list, onStatus, readonly, showComplete }) {
  if (!list.length) return <EmptyState title="Nothing here yet" />;
  const statusTone = { confirmed: 'green', completed: 'blue', cancelled: 'gray', declined: 'red' };
  return (
    <div className="space-y-2.5">
      {list.map((s) => {
        const Icon = MODE_ICON[s.mode] || Video;
        return (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={16} /></div>
              <div>
                <div className="text-[14px] font-bold text-ink-900">{s.client_name}</div>
                <div className="text-[12.5px] text-ink-500">{new Date(s.slot_start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={statusTone[s.status] || 'gray'}>{s.status}</Badge>
              {!readonly && showComplete && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onStatus(s.id, 'completed')}>Mark completed</Button>
                  <Button size="sm" variant="danger" onClick={() => onStatus(s.id, 'cancelled')}>Cancel</Button>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CalendarView({ weekStart, setWeekStart, availability, timeOff, slots, onConfirm, onDecline }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
  const [picker, setPicker] = useState(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })} className="rounded-lg border border-ink-100 p-2 hover:border-brand-300">
          <ChevronLeft size={16} />
        </button>
        <div className="text-[14px] font-bold text-ink-800">
          {days[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <button onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })} className="rounded-lg border border-ink-100 p-2 hover:border-brand-300">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {days.map((d) => {
          const computed = computeDaySlots(d, availability, timeOff);
          const key = dayKey(d);
          const dayBookings = slots.filter((s) => s.slot_start.slice(0, 10) === key && s.status !== 'declined' && s.status !== 'cancelled');
          return (
            <Card key={key} className="!p-3">
              <div className="mb-2 text-center">
                <div className="text-[11px] font-bold uppercase text-ink-400">{WEEKDAYS[d.getDay()]}</div>
                <div className="text-[15px] font-bold text-ink-900">{d.getDate()}</div>
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto scrollbar-thin">
                {computed.length === 0 && <div className="py-3 text-center text-[11px] text-ink-300">Off</div>}
                {computed.map((slot, i) => {
                  const iso = slot.start.toISOString();
                  const match = dayBookings.filter((b) => b.slot_start === iso);
                  const confirmed = match.find((b) => b.status === 'confirmed');
                  const pending = match.filter((b) => b.status === 'requested');
                  const hasBooking = !!confirmed || pending.length > 0;
                  let cls = 'border-ink-100 text-ink-400';
                  if (confirmed) cls = 'border-brand-300 bg-brand-50 text-brand-700 font-semibold cursor-pointer hover:border-brand-500';
                  else if (pending.length) cls = 'border-amber-300 bg-amber-50 text-amber-700 font-semibold cursor-pointer hover:border-amber-500';
                  return (
                    <button
                      key={i}
                      onClick={() => hasBooking && setPicker({ time: slot.start, end: slot.end, requests: pending, confirmed })}
                      className={`w-full rounded-md border px-2 py-1 text-[11px] ${cls}`}
                    >
                      <span className="block truncate">
                        {slot.start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                        {confirmed && ` · ${confirmed.client_name || 'Booked'}`}
                        {!confirmed && pending.length > 0 && ` · ${pending.length} req`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {picker && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 py-10" onMouseDown={(e) => e.target === e.currentTarget && setPicker(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-extrabold text-ink-900">
                  {picker.time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-500">
                  {picker.time.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  {picker.end && ` – ${picker.end.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`}
                </div>
              </div>
              <button onClick={() => setPicker(null)} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700">
                <XIcon size={18} />
              </button>
            </div>

            {picker.confirmed && (
              <BookingDetail booking={picker.confirmed} end={picker.end} tone="confirmed" />
            )}

            {picker.requests.length > 0 && (
              <>
                {picker.confirmed && (
                  <div className="mb-2 mt-5 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
                    Also requested for this time
                  </div>
                )}
                <div className="space-y-3">
                  {picker.requests.map((r) => (
                    <div key={r.id}>
                      <BookingDetail booking={r} end={picker.end} tone="pending" />
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => { onConfirm(r.id); setPicker(null); }}>
                          <Check size={14} /> Confirm
                        </Button>
                        <Button size="sm" variant="danger" className="flex-1" onClick={() => { onDecline(r.id); setPicker(null); }}>
                          <XIcon size={14} /> Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MODE_DETAIL = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

// One booking's full details, plus (for confirmed ones) links to drop it
// into the advocate's own calendar app.
function BookingDetail({ booking, end, tone }) {
  const mode = MODE_DETAIL[booking.mode];
  const start = new Date(booking.slot_start);
  const finish = booking.slot_end ? new Date(booking.slot_end) : end || new Date(start.getTime() + 30 * 60000);
  const title = `Consultation — ${booking.client_name || 'Client'}`;
  const details = [
    booking.client_phone && `Phone: ${booking.client_phone}`,
    booking.client_email && `Email: ${booking.client_email}`,
    mode && `Mode: ${mode.label}`,
    booking.client_notes && `Notes: ${booking.client_notes}`,
  ].filter(Boolean).join('\n');

  return (
    <div className={`rounded-xl border p-3.5 ${tone === 'confirmed' ? 'border-brand-200 bg-brand-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[14px] font-bold text-ink-900">{booking.client_name || 'Client'}</div>
        <Badge tone={tone === 'confirmed' ? 'blue' : 'amber'}>
          {tone === 'confirmed' ? 'Confirmed' : 'Awaiting your response'}
        </Badge>
      </div>

      <div className="mt-2.5 space-y-1.5 text-[12.5px] text-ink-700">
        {booking.client_phone && (
          <a href={`tel:${booking.client_phone}`} className="flex items-center gap-2 hover:text-brand-600">
            <Phone size={13} className="shrink-0 text-ink-400" /> {booking.client_phone}
          </a>
        )}
        {booking.client_email && (
          <a href={`mailto:${booking.client_email}`} className="flex items-center gap-2 truncate hover:text-brand-600">
            <Mail size={13} className="shrink-0 text-ink-400" /> {booking.client_email}
          </a>
        )}
        {mode && (
          <div className="flex items-center gap-2">
            <mode.icon size={13} className="shrink-0 text-ink-400" /> {mode.label}
          </div>
        )}
      </div>

      {booking.client_notes && (
        <div className="mt-2.5 rounded-lg bg-white/70 p-2.5 text-[12.5px] leading-relaxed text-ink-600">
          {booking.client_notes}
        </div>
      )}

      {tone === 'confirmed' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={googleCalendarUrl({ title, start, end: finish, details })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-600"
          >
            <CalendarDays size={13} /> Add to Google Calendar
          </a>
          <button
            onClick={() => downloadIcs({ title, start, end: finish, details, uid: `${booking.id}@legalconnects` })}
            className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-600"
          >
            <Download size={13} /> .ics
          </button>
        </div>
      )}
    </div>
  );
}

function AvailabilityEditor({ advocateId, availability, timeOff, onSaved, setMsg }) {
  const [days, setDays] = useState(() => {
    const map = {};
    availability.forEach((a) => { map[a.weekday] = a; });
    return Array.from({ length: 7 }, (_, w) => ({
      weekday: w,
      enabled: !!map[w],
      start_time: map[w]?.start_time?.slice(0, 5) || '10:00',
      end_time: map[w]?.end_time?.slice(0, 5) || '18:00',
      slot_minutes: map[w]?.slot_minutes || 30,
    }));
  });
  const [saving, setSaving] = useState(false);
  const [offDate, setOffDate] = useState('');
  const [offNote, setOffNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function updateDay(i, patch) {
    setDays((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function save() {
    const enabledDays = days.filter((d) => d.enabled);
    for (const d of enabledDays) {
      if (d.end_time <= d.start_time) {
        setMsg(`${WEEKDAYS[d.weekday]}: end time must be after start time.`);
        return;
      }
    }
    setSaving(true);
    try {
      await setAvailability(
        advocateId,
        enabledDays.map((d) => ({ weekday: d.weekday, start_time: d.start_time, end_time: d.end_time, slot_minutes: d.slot_minutes })),
      );
      setMsg('Availability saved.');
      onSaved();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTimeOff() {
    if (!offDate) return;
    await addTimeOff(advocateId, offDate, offNote);
    setOffDate('');
    setOffNote('');
    onSaved();
  }

  async function handleDeleteTimeOff() {
    setDeleting(true);
    await deleteTimeOff(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    onSaved();
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeading title="Weekly working hours" sub="Set the hours you're generally available for consultations." />
        <div className="space-y-2">
          {days.map((d, i) => (
            <div key={d.weekday} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-100 p-3">
              <label className="flex w-24 items-center gap-2 text-[13.5px] font-bold text-ink-800">
                <input type="checkbox" className="accent-brand-500" checked={d.enabled} onChange={(e) => updateDay(i, { enabled: e.target.checked })} />
                {WEEKDAYS[d.weekday]}
              </label>
              <Input type="time" className="!w-32" value={d.start_time} onChange={(e) => updateDay(i, { start_time: e.target.value })} disabled={!d.enabled} />
              <span className="text-ink-300">to</span>
              <Input type="time" className="!w-32" value={d.end_time} onChange={(e) => updateDay(i, { end_time: e.target.value })} disabled={!d.enabled} />
              <select
                className="rounded-lg border border-ink-100 px-2.5 py-2 text-[13px]"
                value={d.slot_minutes}
                onChange={(e) => updateDay(i, { slot_minutes: Number(e.target.value) })}
                disabled={!d.enabled}
              >
                <option value={15}>15 min slots</option>
                <option value={30}>30 min slots</option>
                <option value={45}>45 min slots</option>
                <option value={60}>60 min slots</option>
              </select>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save hours'}</Button>
        </div>
      </Card>

      <Card>
        <CardHeading title="Blocked dates" sub="Holidays, court dates, or leave — no bookings will be taken on these days." />
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="mb-1 block text-[12px] font-bold text-ink-600">Date</label><Input type="date" value={offDate} onChange={(e) => setOffDate(e.target.value)} /></div>
          <div className="flex-1"><label className="mb-1 block text-[12px] font-bold text-ink-600">Note (optional)</label><Input placeholder="e.g. Court leave" value={offNote} onChange={(e) => setOffNote(e.target.value)} /></div>
          <Button onClick={handleAddTimeOff}>Block date</Button>
        </div>
        <div className="mt-4 space-y-1.5">
          {timeOff.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
              <span className="font-semibold text-ink-800">{t.off_date} {t.note && `— ${t.note}`}</span>
              <button onClick={() => setDeleteTarget(t)} className="text-ink-400 hover:text-coral-500"><Trash2 size={14} /></button>
            </div>
          ))}
          {timeOff.length === 0 && <div className="text-[13px] text-ink-400">No blocked dates.</div>}
        </div>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTimeOff}
        busy={deleting}
        title="Unblock this date?"
        message={`This will remove the block on ${deleteTarget?.off_date}${deleteTarget?.note ? ` (${deleteTarget.note})` : ''} — clients will be able to book that day again.`}
        confirmLabel="Unblock"
      />
    </div>
  );
}
