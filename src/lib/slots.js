// Client-computed slot generation for the calendar view — mirrors the
// original advocate-bookings.html logic exactly (weekday: 0=Sun..6=Sat).
export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// Returns array of { start: Date, end: Date } for the given day.
export function computeDaySlots(date, availability, timeOff) {
  const weekday = date.getDay();
  const key = dayKey(date);
  if (timeOff.some((t) => t.off_date === key)) return [];
  const rule = availability.find((a) => a.weekday === weekday);
  if (!rule) return [];
  const step = rule.slot_minutes || 30;
  const startMin = timeToMinutes(rule.start_time);
  const endMin = timeToMinutes(rule.end_time);
  const out = [];
  for (let t = startMin; t + step <= endMin; t += step) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(t);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + step);
    out.push({ start, end });
  }
  return out;
}

export function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
