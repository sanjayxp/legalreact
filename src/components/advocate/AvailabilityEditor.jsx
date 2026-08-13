import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { setAvailability, addTimeOff, deleteTimeOff } from '../../lib/cms';
import Card, { CardHeading } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import ConfirmDialog from '../ui/ConfirmDialog';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Working hours and blocked dates. Lifted out of the bookings page so Settings
// can own it — nothing here is about a particular booking.
export default function AvailabilityEditor({ advocateId, availability, timeOff, onSaved, setMsg }) {
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
        setMsg(`${WEEKDAYS[d.weekday]}: end time must be after start time.`, 'err');
        return;
      }
    }
    setSaving(true);
    try {
      await setAvailability(
        advocateId,
        enabledDays.map((d) => ({ weekday: d.weekday, start_time: d.start_time, end_time: d.end_time, slot_minutes: d.slot_minutes })),
      );
      setMsg('Availability saved.', 'ok');
      onSaved();
    } catch (e) {
      setMsg(e.message, 'err');
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
