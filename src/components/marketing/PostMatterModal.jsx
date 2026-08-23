import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { submitMatterLead } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import { MATTER_TYPES, findMatterType, summariseMatter } from '../../lib/matterTypes';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea, Label, FormRow } from '../ui/Field';
import IdentityFields from './IdentityFields';
import MatterFields from './MatterFields';
import { Toast } from '../ui/Misc';

// Tile colours, kept here so the types file stays free of Tailwind classes.
const TILE_TINTS = {
  brand: 'bg-brand-500/10 text-brand-600',
  gold: 'bg-gold-500/10 text-gold-600',
  coral: 'bg-coral-500/10 text-coral-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-ink-100 text-ink-500',
};

const EMPTY_FORM = { client_name: '', phone: '', email: '', city: '', matter: '', budget: '' };

export default function PostMatterModal({ open, onClose, preselect = '' }) {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  // Step 1 picks the kind of matter; step 2 asks what that kind needs.
  const [typeSlug, setTypeSlug] = useState('');
  // Which type `details` was filled in for — lets "back" return to the
  // picker without losing answers already typed for that same type.
  const [detailsTypeSlug, setDetailsTypeSlug] = useState('');
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const type = findMatterType(typeSlug);

  function setDetail(name, value) {
    setDetails((d) => ({ ...d, [name]: value }));
  }

  // Different matter types ask different questions, so switching to a new
  // one starts fresh — but re-picking the type you just came from (e.g.
  // after tapping "All matter types" to glance around) keeps what you'd
  // already typed instead of throwing it away.
  function pickType(slug) {
    if (slug !== detailsTypeSlug) {
      setDetails({});
      setDetailsTypeSlug(slug);
    }
    setTypeSlug(slug);
    setMsg('');
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Opening from a homepage tile skips straight to that type's questions.
  useEffect(() => {
    if (open && preselect) pickType(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselect]);

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
      setTypeSlug('');
      setDetailsTypeSlug('');
      setDetails({});
      setMsg('');
      setDone(false);
    }, 200);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!type) { setMsg('Pick what you need help with first.'); return; }
    if (!form.client_name.trim() || !form.phone.trim()) {
      setMsg('Name and phone are needed so an advocate can reach you.');
      return;
    }
    const missing = type.fields.filter((f) => !f.optional && !String(details?.[f.name] ?? '').trim());
    if (missing.length) {
      setMsg(`Please fill in: ${missing.map((f) => f.label).join(', ')}.`);
      return;
    }
    if (!form.matter.trim() && !type.fields.length) {
      setMsg('Tell us a little about the matter.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await submitMatterLead({
        client_name: form.client_name,
        phone: form.phone,
        email: form.email,
        matter: summariseMatter(type, details, form.matter),
        matter_type: type?.slug || null,
        details: Object.keys(details).length ? details : null,
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
    <Modal
      open={open}
      onClose={handleClose}
      title={done ? 'Matter received' : 'Post your matter'}
      width={!done && !type ? 'max-w-3xl' : 'max-w-lg'}
    >
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
        !type ? (
          <div className="sm:grid sm:grid-cols-[34%_1fr] sm:-mx-6 sm:-mb-6">
            {/* Reassurance panel — real product facts only, no fabricated stats.
                Hidden on mobile, where there's no room for it. */}
            <div className="relative hidden overflow-hidden rounded-bl-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex sm:flex-col sm:justify-between">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div>
                <ShieldCheck size={22} className="text-gold-300" />
                <p className="mt-4 text-[14.5px] font-bold leading-snug">
                  Describe what's going on — we'll match you with a Bar Council-verified advocate.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2 text-[12.5px] text-white/85">
                <span className="flex items-center gap-2"><Check size={13} className="shrink-0 text-gold-300" /> Free to post</span>
                <span className="flex items-center gap-2"><Check size={13} className="shrink-0 text-gold-300" /> Bar Council-verified advocates only</span>
                <span className="flex items-center gap-2"><Check size={13} className="shrink-0 text-gold-300" /> Shared only with a matched advocate</span>
              </div>
            </div>

            <div className="sm:py-6 sm:pl-5 sm:pr-6">
              <p className="text-[13.5px] text-ink-500">
                What do you need help with? Pick the closest one — you can explain in your own words next.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MATTER_TYPES.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => pickType(t.slug)}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-100 px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TILE_TINTS[t.tint] || TILE_TINTS.brand}`}>
                      <t.icon size={15} />
                    </span>
                    <span className="min-w-0 text-[12.5px] font-bold leading-tight text-ink-900">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <button
            type="button"
            onClick={() => { setTypeSlug(''); setMsg(''); }}
            className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-500 hover:text-brand-600"
          >
            <ArrowLeft size={13} /> All matter types
          </button>

          <div className="flex items-center gap-2.5 rounded-xl bg-brand-50/70 px-3.5 py-2.5">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TILE_TINTS[type.tint] || TILE_TINTS.brand}`}>
              <type.icon size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-ink-900">{type.label}</div>
              <div className="truncate text-[11.5px] text-ink-500">{type.blurb}</div>
            </div>
          </div>

          <IdentityFields form={form} onChange={setField} />

          <MatterFields type={type} details={details} onChange={setDetail} />

          <FormRow>
            <div>
              <Label htmlFor="pm-city" hint="(optional)">City</Label>
              <Input id="pm-city" value={form.city} onChange={set('city')} placeholder="e.g. Bengaluru" />
            </div>
            <div>
              <Label htmlFor="pm-budget" hint="(optional)">Budget</Label>
              <Input id="pm-budget" value={form.budget} onChange={set('budget')} placeholder="e.g. ₹5,000–10,000" />
            </div>
          </FormRow>

          <Label htmlFor="pm-notes" required={!type.fields.length} hint={type.fields.length ? '(optional)' : undefined}>
            Anything else we should know?
          </Label>
          <Textarea id="pm-notes" rows={3} value={form.matter} onChange={set('matter')} placeholder="In your own words — this reaches the advocate as you write it." />

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
        )
      )}
    </Modal>
  );
}
