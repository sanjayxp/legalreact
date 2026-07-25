import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BadgeCheck, IndianRupee, Video, Phone, Building2, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { getApprovedAdvocatePublic, incrementProfileView, requestAdvocateLead } from '../../lib/cms';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Label } from '../../components/ui/Field';
import { Avatar, EmptyState, Spinner, Toast } from '../../components/ui/Misc';

const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

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
          <div>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar src={advocate.photo_url} name={advocate.profiles?.full_name} size={88} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[26px] font-extrabold text-ink-900">{advocate.profiles?.full_name}</h1>
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

          <div>
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

              <Button className="mt-6 w-full" size="lg" onClick={() => setRequestOpen(true)}>Request a consultation</Button>
              <p className="mt-2.5 text-center text-[11.5px] text-ink-400">We'll pass your details to {advocate.profiles?.full_name?.split(' ')[0]} — no payment now.</p>
            </Card>
          </div>
        </motion.div>
      </div>

      <RequestModal advocate={advocate} open={requestOpen} onClose={() => setRequestOpen(false)} />
      <Footer />
    </div>
  );
}

function RequestModal({ advocate, open, onClose }) {
  const [form, setForm] = useState({ client_name: '', phone: '', email: '', matter: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { setForm({ client_name: '', phone: '', email: '', matter: '' }); setMsg(''); setDone(false); }, [open]);

  async function handleSubmit() {
    if (!form.client_name.trim() || !form.phone.trim()) { setMsg('Please share your name and phone number.'); return; }
    setBusy(true);
    setMsg('');
    try {
      await requestAdvocateLead({ advocate_id: advocate.id, ...form });
      setDone(true);
    } catch (e) {
      setMsg(e.message || 'Could not send your request — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request a consultation — ${advocate.profiles?.full_name}`}>
      {done ? (
        <Toast text="Request sent! The advocate's office will reach out to confirm timing." kind="ok" />
      ) : (
        <>
          <Label required>Your name</Label>
          <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <Label required>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Label hint="(optional)">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Label hint="(optional)">What's this about?</Label>
          <Textarea rows={3} value={form.matter} onChange={(e) => setForm({ ...form, matter: e.target.value })} placeholder="A brief description helps the advocate prepare." />
          {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button>
        </>
      )}
    </Modal>
  );
}
