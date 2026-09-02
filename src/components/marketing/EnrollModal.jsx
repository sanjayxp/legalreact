import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { submitCourseEnrollment } from '../../lib/cms';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Label } from '../ui/Field';
import { Toast } from '../ui/Misc';

// Shared by the Courses grid and the course detail page.
export default function EnrollModal({ course, onClose }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { setForm({ full_name: '', email: '', phone: '' }); setMsg(''); setDone(false); }, [course]);
  if (!course) return null;

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) { setMsg('Please fill in your name, email, and phone.'); return; }
    setBusy(true);
    setMsg('');
    try {
      await submitCourseEnrollment({ course_id: course.id, ...form, enrolled_at: new Date().toISOString() });
      setDone(true);
    } catch (e) {
      setMsg(e.message || 'Could not submit your enrollment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!course} onClose={onClose} title={`Enroll — ${course.title}`}>
      {done ? (
        <Toast text="You're enrolled! Details will be sent to your email." kind="ok" />
      ) : (
        <>
          {(course.course_url || course.college_website) && (
            <a
              href={course.course_url || course.college_website}
              target="_blank"
              rel="noreferrer"
              className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
            >
              View full course details <ExternalLink size={12} />
            </a>
          )}
          <Label required>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Label required>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label required>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>{busy ? 'Submitting…' : 'Confirm enrollment'}</Button>
        </>
      )}
    </Modal>
  );
}
