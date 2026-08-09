import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CalendarDays, List, Check, X as XIcon,
  Inbox, Clock, CircleDot,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  listMySlots, getAvailability, listTimeOff, listMyLeads,
  confirmBookingRequest, declineBookingRequest, updateSlotStatus,
} from '../../lib/cms';
import { computeDaySlots, startOfWeek, dayKey } from '../../lib/slots';
import AdvocateShell from '../../components/layout/AdvocateShell';
import { BookingDetail, MODE_ICON, WEEKDAYS } from '../../components/advocate/bookingUi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

const LIST_FILTERS = [
  { key: 'requests', label: 'Awaiting you' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const isSameDay = (a, b) => dayKey(a) === dayKey(b);

export default function Diary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailabilityState] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [leads, setLeads] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [view, setView] = useState('week');
  const [listFilter, setListFilter] = useState('requests');
  const [openDay, setOpenDay] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('ok');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  function say(t, kind = 'ok') { setMsg(t); setMsgKind(kind); }

  async function load() {
    const [sl, av, to, ld] = await Promise.all([
      listMySlots(user.id), getAvailability(user.id), listTimeOff(user.id), listMyLeads(user.id),
    ]);
    setSlots(sl); setAvailabilityState(av); setTimeOff(to); setLeads(ld);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user]);

  const now = new Date();
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }),
    [weekStart],
  );

  // Everything that lands on a given day: consultations the client asked for or
  // that are confirmed, plus enquiries that arrived that day. An advocate's day
  // is not only their bookings.
  const byDay = useMemo(() => {
    const map = {};
    for (const d of days) map[dayKey(d)] = { bookings: [], enquiries: [] };
    for (const s of slots) {
      if (s.status === 'declined' || s.status === 'cancelled') continue;
      const k = s.slot_start.slice(0, 10);
      if (map[k]) map[k].bookings.push(s);
    }
    for (const l of leads) {
      const k = (l.created_at || '').slice(0, 10);
      if (map[k]) map[k].enquiries.push(l);
    }
    for (const k of Object.keys(map)) {
      map[k].bookings.sort((a, b) => a.slot_start.localeCompare(b.slot_start));
    }
    return map;
  }, [days, slots, leads]);

  const requests = slots.filter((s) => s.status === 'requested');
  const upcoming = slots.filter((s) => s.status === 'confirmed' && new Date(s.slot_start) >= now);
  const past = slots.filter(
    (s) => ['completed', 'cancelled', 'declined'].includes(s.status) ||
      (s.status === 'confirmed' && new Date(s.slot_start) < now),
  );
  const listRows = listFilter === 'requests' ? requests : listFilter === 'upcoming' ? upcoming : past;

  async function handleConfirm(id) {
    try { await confirmBookingRequest(id); say('Confirmed — the client has been told.'); await load(); }
    catch (e) { say(e.message, 'err'); }
  }
  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'decline') { await declineBookingRequest(confirm.id); say('Declined.'); }
      else { await updateSlotStatus(confirm.id, confirm.status); say('Updated.'); }
      setConfirm(null);
      await load();
    } catch (e) { say(e.message, 'err'); }
    finally { setBusy(false); }
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">My diary</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">
          Consultations and enquiries, on the days they fall. Everything that was spread across four
          lists is here.
        </p>
      </motion.div>

      {msg && <div className="mt-3"><Toast text={msg} kind={msgKind} /></div>}

      {/* ---- toolbar ---- */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })}
            aria-label="Previous week"
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink-100 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-600"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })}
            aria-label="Next week"
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink-100 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronRight size={16} />
          </button>
          <div className="ml-1 text-[15px] font-bold text-ink-900">
            {days[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {days[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="flex rounded-lg border border-ink-100 bg-white p-0.5">
          {[{ k: 'week', label: 'Week', icon: CalendarDays }, { k: 'list', label: 'List', icon: List }].map((v) => (
            <button
              key={v.k}
              onClick={() => setView(v.k)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                view === v.k ? 'bg-brand-500 text-white' : 'text-ink-500 hover:text-brand-600'
              }`}
            >
              <v.icon size={14} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' ? (
        <>
          {/* ---- legend ---- */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Confirmed consultation</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-400" /> Waiting for your reply</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Enquiry received</span>
          </div>

          {/* One bordered grid rather than seven separate cards — it reads as a
              calendar instead of a row of forms. Stacks to an agenda on phones. */}
          <div className="mt-3 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-1 sm:grid-cols-7 sm:divide-x sm:divide-ink-100">
              {days.map((d) => {
                const k = dayKey(d);
                const today = isSameDay(d, now);
                const computed = computeDaySlots(d, availability, timeOff);
                const { bookings, enquiries } = byDay[k] || { bookings: [], enquiries: [] };
                const taken = new Set(bookings.map((b) => b.slot_start));
                const freeCount = computed.filter((s) => !taken.has(s.start.toISOString())).length;
                const isOff = computed.length === 0;
                const nothing = bookings.length === 0 && enquiries.length === 0;

                return (
                  <div
                    key={k}
                    className={`flex flex-col border-b border-ink-100 last:border-b-0 sm:min-h-[172px] sm:border-b-0 ${today ? 'bg-brand-50/50' : ''}`}
                  >
                    <div className={`flex items-baseline justify-between gap-2 px-3 py-2.5 sm:block sm:text-center ${today ? '' : 'border-b border-ink-50 sm:border-b-0'}`}>
                      <div className={`text-[11px] font-bold uppercase tracking-wide ${today ? 'text-brand-600' : 'text-ink-400'}`}>
                        {WEEKDAYS[d.getDay()]}
                      </div>
                      <div className={`text-[17px] font-extrabold leading-tight sm:mt-0.5 ${today ? 'text-brand-700' : 'text-ink-900'}`}>
                        {d.getDate()}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2.5">
                      {bookings.map((b) => {
                        const pending = b.status === 'requested';
                        const Icon = MODE_ICON[b.mode];
                        return (
                          <button
                            key={b.id}
                            onClick={() => setOpenDay({ date: d, focus: b })}
                            className={`w-full overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5 text-left transition-colors ${
                              pending
                                ? 'border-l-gold-400 bg-gold-50 hover:bg-gold-100/70'
                                : 'border-l-brand-500 bg-brand-50 hover:bg-brand-100/70'
                            }`}
                          >
                            <div className={`flex items-center gap-1 text-[11px] font-bold ${pending ? 'text-gold-700' : 'text-brand-700'}`}>
                              {Icon && <Icon size={10} className="shrink-0" />}
                              {fmtTime(new Date(b.slot_start))}
                            </div>
                            <div className="truncate text-[12px] font-semibold text-ink-800">
                              {b.client_name || 'Client'}
                            </div>
                            {pending && <div className="text-[10.5px] font-semibold text-gold-700">Needs your reply</div>}
                          </button>
                        );
                      })}

                      {enquiries.length > 0 && (
                        <button
                          onClick={() => setOpenDay({ date: d })}
                          className="w-full rounded-lg border-l-[3px] border-l-violet-400 bg-violet-50 px-2 py-1.5 text-left transition-colors hover:bg-violet-100/70"
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-violet-700">
                            <Inbox size={10} className="shrink-0" />
                            {enquiries.length} {enquiries.length === 1 ? 'enquiry' : 'enquiries'}
                          </div>
                          <div className="truncate text-[12px] text-ink-600">{enquiries[0].client_name || 'New enquiry'}</div>
                        </button>
                      )}

                      {nothing && (
                        <div className="flex flex-1 items-center justify-center py-2 text-[11px] text-ink-300">
                          {isOff ? 'Not working' : 'Nothing booked'}
                        </div>
                      )}
                    </div>

                    {!isOff && (
                      <button
                        onClick={() => setOpenDay({ date: d })}
                        className="border-t border-ink-50 px-3 py-1.5 text-[11px] font-semibold text-ink-400 hover:text-brand-600"
                      >
                        {freeCount} free
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {LIST_FILTERS.map((f) => {
              const n = f.key === 'requests' ? requests.length : f.key === 'upcoming' ? upcoming.length : past.length;
              const active = listFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setListFilter(f.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    active ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-100 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {f.label} <span className={active ? 'text-white/70' : 'text-ink-400'}>{n}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            {listRows.length === 0 && (
              <EmptyState
                icon={<Clock size={28} />}
                title={listFilter === 'requests' ? 'Nothing waiting on you' : listFilter === 'upcoming' ? 'Nothing coming up' : 'Nothing in the past'}
              />
            )}
            {listRows.map((s) => {
              const start = new Date(s.slot_start);
              const Icon = MODE_ICON[s.mode];
              return (
                <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-ink-900">{s.client_name || 'Client'}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                      <span>{start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(start)}</span>
                      {Icon && <span className="flex items-center gap-1"><Icon size={12} /> {s.mode}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge tone={s.status === 'confirmed' ? 'blue' : s.status === 'requested' ? 'amber' : 'gray'}>{s.status}</Badge>
                    {s.status === 'requested' && (
                      <>
                        <Button size="sm" onClick={() => handleConfirm(s.id)}><Check size={14} /> Confirm</Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirm({ kind: 'decline', id: s.id, label: s.client_name || 'This client' })}>
                          <XIcon size={14} /> Decline
                        </Button>
                      </>
                    )}
                    {s.status === 'confirmed' && new Date(s.slot_start) < now && (
                      <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'status', id: s.id, status: 'completed', label: s.client_name || 'This booking' })}>
                        Mark done
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ---- one day, in full ---- */}
      <Modal
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        title={openDay ? openDay.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        width="max-w-md"
      >
        {openDay && <DayDetail
          day={openDay}
          byDay={byDay}
          availability={availability}
          timeOff={timeOff}
          onConfirm={handleConfirm}
          onDecline={(id, label) => setConfirm({ kind: 'decline', id, label })}
        />}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        busy={busy}
        busyLabel="Working…"
        confirmLabel={confirm?.kind === 'decline' ? 'Decline' : 'Mark done'}
        danger={confirm?.kind === 'decline'}
        title={confirm?.kind === 'decline' ? 'Decline this booking?' : 'Mark this as done?'}
        message={
          confirm?.kind === 'decline'
            ? `${confirm?.label} will be told the slot was not confirmed. This cannot be undone.`
            : `${confirm?.label} will be recorded as completed.`
        }
      />
    </AdvocateShell>
  );
}

function DayDetail({ day, byDay, availability, timeOff, onConfirm, onDecline }) {
  const k = dayKey(day.date);
  const { bookings, enquiries } = byDay[k] || { bookings: [], enquiries: [] };
  const computed = computeDaySlots(day.date, availability, timeOff);
  const taken = new Set(bookings.map((b) => b.slot_start));
  const free = computed.filter((s) => !taken.has(s.start.toISOString()));

  return (
    <div className="space-y-4">
      {bookings.length > 0 && (
        <div className="space-y-2.5">
          {bookings.map((b) => (
            <div key={b.id}>
              <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-400">
                {fmtTime(new Date(b.slot_start))}
              </div>
              <BookingDetail booking={b} tone={b.status === 'confirmed' ? 'confirmed' : 'pending'} />
              {b.status === 'requested' && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => onConfirm(b.id)}><Check size={14} /> Confirm</Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => onDecline(b.id, b.client_name || 'This client')}>
                    <XIcon size={14} /> Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {enquiries.length > 0 && (
        <div>
          <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-400">Enquiries received</div>
          <div className="space-y-1.5">
            {enquiries.map((l) => (
              <div key={l.id} className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2">
                <div className="text-[13px] font-bold text-ink-900">{l.client_name || 'Client'}</div>
                <div className="truncate text-[12px] text-ink-500">{l.matter || 'Legal matter'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-400">
          Free times ({free.length})
        </div>
        {free.length === 0 ? (
          <div className="text-[13px] text-ink-400">Nothing free on this day.</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {free.map((s, i) => (
              <span key={i} className="rounded-md border border-ink-100 bg-ink-50 px-2 py-1 text-[11.5px] text-ink-500">
                {fmtTime(s.start)}
              </span>
            ))}
          </div>
        )}
      </div>

      {bookings.length === 0 && enquiries.length === 0 && free.length === 0 && (
        <div className="flex items-center gap-2 text-[13px] text-ink-400">
          <CircleDot size={14} /> Not a working day.
        </div>
      )}
    </div>
  );
}
