// Helpers for adding a booking to an external calendar. These are plain
// links — no Google account connection or OAuth involved. A full two-way
// sync would need a Google Cloud project and stored OAuth tokens.

// Google's template URL wants UTC basic-format timestamps: 20260801T093000Z
function toGoogleStamp(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl({ title, start, end, details, location }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Consultation',
    dates: `${toGoogleStamp(start)}/${toGoogleStamp(end)}`,
  });
  if (details) params.set('details', details);
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(text = '') {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Builds a .ics file and triggers a download — works with Apple Calendar,
// Outlook, and Google Calendar's import.
export function downloadIcs({ title, start, end, details, location, uid }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LegalConnects//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}@legalconnects`}`,
    `DTSTAMP:${toGoogleStamp(new Date())}`,
    `DTSTART:${toGoogleStamp(start)}`,
    `DTEND:${toGoogleStamp(end)}`,
    `SUMMARY:${escapeIcs(title || 'Consultation')}`,
    details ? `DESCRIPTION:${escapeIcs(details)}` : null,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'consultation.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
