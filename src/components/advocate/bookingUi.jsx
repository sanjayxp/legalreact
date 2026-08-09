import { useState } from 'react';
import { Phone, Video, Building2, Mail, CalendarDays, Download, Trash2 } from 'lucide-react';
import { googleCalendarUrl, downloadIcs } from '../../lib/calendarLinks';
import { setAvailability, addTimeOff, deleteTimeOff } from '../../lib/cms';
import Card, { CardHeading } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Input } from '../ui/Field';
import ConfirmDialog from '../ui/ConfirmDialog';

export const MODE_ICON = { video: Video, phone: Phone, inperson: Building2 };
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const ENQUIRY_STATUS_TONE = { new: 'amber', contacted: 'blue', converted: 'green', dropped: 'gray' };

const MODE_DETAIL = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

// One booking's full details, plus (for confirmed ones) links to drop it
// into the advocate's own calendar app.
export function BookingDetail({ booking, end, tone }) {
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

export function AvailabilityEditor({ advocateId, availability, timeOff, onSaved, setMsg }) {
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
