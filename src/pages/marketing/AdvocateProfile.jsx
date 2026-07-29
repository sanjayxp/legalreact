import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BadgeCheck, IndianRupee, Video, Phone, Building2, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { getApprovedAdvocatePublic, incrementProfileView, requestAdvocateLead, listOpenSlotsPublic, requestSlot } from '../../lib/cms';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Label, Select } from '../../components/ui/Field';
import { Avatar, EmptyState, Spinner, Toast } from '../../components/ui/Misc';

const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

function formatSlot(slot) {
  const d = new Date(slot.slot_start);
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function AdvocateProfile() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [advocate, setAdvocate] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const a = await getApprovedAdvocatePublic(id);
      setAdvocate(a);
      setLoading(false);
      if (a) incrementProfileView(id);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white">
        <PublicNav />
        <Spinner className="min-h-[50vh]" />
        <Footer />
      </div>
    );
  }

  if (!advocate) {
    return (
      <div className="bg-white">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <EmptyState title="Advocate not found" sub="This profile may not be verified or public yet." action={<Link to="/advocates" className="font-semibold text-brand-600">← Back to directory</Link>} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <PublicNav />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link to="/advocates" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All advocates
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar src={advocate.photo_url} name={advocate.profiles?.full_name} size={88} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[25px] font-extrabold text-ink-900">{advocate.profiles?.full_name}</h1>
                  <BadgeCheck size={20} className="text-brand-500" />
                </div>
                <div className="mt-1 text-[15.5px] text-ink-500">{advocate.headline}</div>
                {(advocate.city || advocate.state) && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-ink-400">
                    <MapPin size={13} /> {[advocate.city, advocate.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {(advocate.practice_areas || []).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}
            </div>

            {advocate.bio && (
              <Card className="mt-6">
                <CardHeading title="About" />
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-700">{advocate.bio}</p>
              </Card>
            )}

            {(advocate.experience_timeline || []).length > 0 && (
              <Card className="mt-6">
                <CardHeading title="Experience" />
                <div className="space-y-4">
                  {advocate.experience_timeline.map((e, i) => (
                    <div key={i} className="flex gap-3">
                      <Briefcase size={16} className="mt-0.5 shrink-0 text-brand-500" />
                      <div>
                        <div className="text-[14px] font-bold text-ink-900">{e.title}</div>
                        <div className="text-[13px] text-ink-500">{e.org} {e.period && `· ${e.period}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(advocate.education_timeline || []).length > 0 && (
              <Card className="mt-6">
                <CardHeading title="Education" />
                <div className="space-y-4">
                  {advocate.education_timeline.map((e, i) => (
                    <div key={i} className="flex gap-3">
                      <GraduationCap size={16} className="mt-0.5 shrink-0 text-brand-500" />
                      <div>
                        <div className="text-[14px] font-bold text-ink-900">{e.degree}</div>
                        <div className="text-[13px] text-ink-500">{e.institution} {e.period && `· ${e.period}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="hidden lg:block">
            <Card className="sticky top-24">
              {advocate.consultation_fee && (
                <div className="flex items-baseline gap-1">
                  <IndianRupee size={20} className="text-ink-900" />
                  <span className="text-[26px] font-extrabold text-ink-900">{advocate.consultation_fee}</span>
                  <span className="text-[13px] text-ink-400">/ 30 min</span>
                </div>
              )}
              {advocate.experience_years && <div className="mt-1 text-[13px] text-ink-500">{advocate.experience_years} years of experience</div>}

              {(advocate.consultation_modes || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {advocate.consultation_modes.map((m) => {
                    const meta = MODE_META[m];
                    if (!meta) return null;
                    return (
                      <div key={m} className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-700">
                        <meta.icon size={15} className="text-brand-500" /> {meta.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {(advocate.languages || []).length > 0 && (
                <div className="mt-4 text-[13px] text-ink-500">Consults in {advocate.languages.join(', ')}</div>
              )}

              <Button className="mt-6 w-full" size="lg" onClick={() => setRequestOpen(true)}>Check availability</Button>
              <p className="mt-2.5 text-center text-[11.5px] text-ink-400">Pick a real open time slot — no payment now.</p>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Mobile-only sticky booking bar — the fee + CTA would otherwise sit
          below the entire bio/experience/education stack on small screens. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-ink-100 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        {advocate.consultation_fee ? (
          <div className="flex items-baseline gap-0.5">
            <IndianRupee size={15} className="text-ink-900" />
            <span className="text-[17px] font-extrabold text-ink-900">{advocate.consultation_fee}</span>
            <span className="text-[11px] text-ink-400">/30min</span>
          </div>
        ) : <span />}
        <Button onClick={() => setRequestOpen(true)}>Check availability</Button>
      </div>
      <div className="h-20 lg:hidden" />

      <RequestModal advocate={advocate} open={requestOpen} onClose={() => setRequestOpen(false)} />
      <Footer />
    </div>
  );
}

const MODE_LABEL = { video: '🎥 Video call', phone: '📞 Phone call', inperson: '🤝 In person' };

function RequestModal({ advocate, open, onClose }) {
  const [step, setStep] = useState(1);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [slotsErr, setSlotsErr] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ client_name: '', phone: '', email: '', notes: '', mode: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const modes = (advocate.consultation_modes && advocate.consultation_modes.length) ? advocate.consultation_modes : ['video', 'phone', 'inperson'];

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedSlot(null);
    setForm({ client_name: '', phone: '', email: '', notes: '', mode: modes[0] });
    setMsg('');
    setSlotsErr('');
    setSlotsLoading(true);
    (async () => {
      try {
        const from = new Date().toISOString().slice(0, 10);
        const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const data = await listOpenSlotsPublic(advocate.id, from, to);
        setSlots(data);
      } catch {
        setSlotsErr("Couldn't load availability. Please try again in a moment.");
      } finally {
        setSlotsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickSlot(slot) {
    setSelectedSlot(slot);
    setMsg('');
    setStep(2);
  }

  async function handleSubmit() {
    if (!form.client_name.trim() || !form.phone.trim()) { setMsg('Name and phone are needed so the advocate can reach you.'); return; }
    if (!selectedSlot) { setMsg('Please go back and pick a time slot.'); return; }
    setBusy(true);
    setMsg('');
    requestAdvocateLead({
      advocate_id: advocate.id,
      client_name: form.client_name,
      phone: form.phone,
      email: form.email,
      matter: `${form.notes || 'Consultation request'} [${form.mode}]`,
    }).catch(() => {});
    try {
      await requestSlot(advocate.id, selectedSlot.slot_start, selectedSlot.slot_end, {
        mode: form.mode,
        client_name: form.client_name,
        client_email: form.email,
        client_phone: form.phone,
        client_notes: form.notes,
      });
      setStep(3);
    } catch (e) {
      setMsg(e.message || 'Something went wrong. Please try picking another slot.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Book a consultation — ${advocate.profiles?.full_name}`}>
      {step === 1 && (
        <>
          <p className="text-[13.5px] text-ink-500">Pick an open time in the next 14 days.</p>
          <div className="mt-3.5 max-h-80 space-y-2 overflow-y-auto">
            {slotsLoading ? (
              <Spinner className="py-8" />
            ) : slotsErr ? (
              <Toast text={slotsErr} kind="err" />
            ) : slots.length === 0 ? (
              <Toast text="This advocate has no open slots right now. Please check back soon." kind="err" />
            ) : (
              slots.map((s) => (
                <button
                  key={s.slot_start}
                  onClick={() => pickSlot(s)}
                  className="flex w-full items-center justify-between rounded-xl border border-ink-100 px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="text-[14px] font-bold text-ink-900">{formatSlot(s)}</span>
                  <span className="text-[12.5px] font-bold text-brand-600">Select</span>
                </button>
              ))
            )}
          </div>
          <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>Cancel</Button>
        </>
      )}

      {step === 2 && selectedSlot && (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <Avatar name={advocate.profiles?.full_name} size={36} />
            <div>
              <div className="text-[13.5px] font-bold text-ink-900">{advocate.profiles?.full_name}</div>
              <div className="text-[12.5px] text-ink-500">{formatSlot(selectedSlot)}</div>
            </div>
          </div>

          <Label required>Consultation mode</Label>
          <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            {modes.map((m) => <option key={m} value={m}>{MODE_LABEL[m] || m}</option>)}
          </Select>
          <Label required>Your name</Label>
          <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <Label required>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Label hint="(optional)">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label hint="(optional)">What's this about?</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="A brief description helps the advocate prepare." />
          <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
            By requesting this slot you consent to LegalConnects sharing these details with this advocate to arrange your consultation, as described in our <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
          <div className="mt-5 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={busy}>{busy ? 'Sending…' : 'Request this slot'}</Button>
          </div>
        </>
      )}

      {step === 3 && selectedSlot && (
        <>
          <Toast
            text={`${advocate.profiles?.full_name} has been notified of your request for ${formatSlot(selectedSlot)}. You'll hear back once they confirm.`}
            kind="ok"
          />
          <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
        </>
      )}
    </Modal>
  );
}
