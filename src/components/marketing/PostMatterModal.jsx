import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { submitMatterLead } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { PRACTICE_AREAS } from '../../lib/practiceAreas';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Select, Label, FormRow } from '../ui/Field';
import IdentityFields from './IdentityFields';
import { Toast } from '../ui/Misc';

const EMPTY_FORM = { client_name: '', phone: '', email: '', area: '', city: '', matter: '', budget: '' };

export default function PostMatterModal({ open, onClose }) {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // A signed-in visitor should not retype what their account already holds.
  useEffect(() => {
    if (!open || !session || !profile) return;
    setForm((f) => ({
      ...f,
      client_name: f.client_name || profile.full_name || '',
      phone: f.phone || profile.phone || '',
      email: f.email || profile.email || '',
    }));
  }, [open, session, profile]);

  function handleClose() {
    onClose?.();
    // Reset after the close animation has a moment to finish.
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setMsg('');
      setDone(false);
    }, 200);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_name.trim() || !form.phone.trim()) {
      setMsg('Name and phone are needed so an advocate can reach you.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await submitMatterLead({
        client_name: form.client_name,
        phone: form.phone,
        email: form.email,
        matter: [form.area, form.matter].filter(Boolean).join(' — '),
        city: form.city,
        budget: form.budget,
      });
      setDone(true);
    } catch {
      setMsg('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function goRegister() {
    handleClose();
    navigate('/login#register', {
      state: { prefill: { fullName: form.client_name, email: form.email, phone: form.phone } },
    });
  }

  function goAdvocates() {
    handleClose();
    navigate('/advocates');
  }

  return (
    <Modal open={open} onClose={handleClose} title={done ? 'Matter received' : 'Post your matter'}>
      {done ? (
        <>
          <Toast
            text="Thanks — we've got your matter. An advocate will be in touch shortly. Want to track its progress?"
            kind="ok"
          />
          <Button className="mt-5 w-full" onClick={goRegister}>
            Create a free account to track this <ArrowRight size={16} />
          </Button>
          <Button variant="ghost" className="mt-2.5 w-full" onClick={handleClose}>Maybe later</Button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-[13.5px] text-ink-500">
            Tell us what's going on, in plain language — no forms or jargon required. We'll match you with a
            Bar Council-verified advocate.
          </p>

          <IdentityFields form={form} onChange={setField} />

          <FormRow>
            <div>
              <Label hint="(optional)">Practice area</Label>
              <Select value={form.area} onChange={set('area')}>
                <option value="">Not sure yet</option>
                {PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div>
              <Label hint="(optional)">City</Label>
              <Input value={form.city} onChange={set('city')} placeholder="e.g. Bengaluru" />
            </div>
          </FormRow>

          <Label required>What's your matter about?</Label>
          <Textarea rows={4} value={form.matter} onChange={set('matter')} placeholder="A brief description helps the advocate prepare." />

          <Label hint="(optional)">Budget</Label>
          <Input value={form.budget} onChange={set('budget')} placeholder="e.g. ₹5,000–10,000" />

          <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
            By submitting, you consent to LegalConnects sharing these details with a matched advocate, as
            described in our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>

          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}

          <Button type="submit" className="mt-5 w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Submit my matter'}
          </Button>

          <button
            type="button"
            onClick={goAdvocates}
            className="mt-3 w-full text-center text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Prefer to browse yourself? Search advocates instead →
          </button>
        </form>
      )}
    </Modal>
  );
}
