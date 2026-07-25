import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  getAdvocateProfile,
  upsertAdvocateProfile,
  uploadPhoto,
  updateOwnName,
  uploadBarCertificate,
  getBarCertificateSignedUrl,
} from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import { Input, Textarea, Label, FormRow } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Misc';
import Button from '../../components/ui/Button';
import { Toast, Spinner } from '../../components/ui/Misc';
import { PRACTICE_AREAS as AREAS } from '../../lib/practiceAreas';

const MODES = [
  { key: 'video', label: '🎥 Video' },
  { key: 'phone', label: '📞 Phone' },
  { key: 'inperson', label: '🏛 In-person' },
];
const EXP_FIELDS = [
  { key: 'title', label: 'Role / title', placeholder: 'e.g. Independent Practice — Tax Law' },
  { key: 'org', label: 'Organisation / court', placeholder: 'e.g. Bombay High Court (Aurangabad Bench)' },
  { key: 'period', label: 'Period', placeholder: 'e.g. 2019 – Present' },
];
const EDU_FIELDS = [
  { key: 'degree', label: 'Degree / certificate', placeholder: 'e.g. LL.M., Taxation Law' },
  { key: 'institution', label: 'Institution', placeholder: 'e.g. Symbiosis Law School, Pune' },
  { key: 'period', label: 'Year', placeholder: 'e.g. 2014' },
];

const STATUS_BANNER = {
  none: { tone: 'amber', icon: Clock, title: 'Not submitted yet', body: 'Fill in your details and save to send your profile for verification.' },
  pending: { tone: 'amber', icon: Clock, title: 'Verification pending', body: 'Our team is reviewing your profile. It will go public once approved — usually within 2 working days.' },
  approved: { tone: 'green', icon: CheckCircle2, title: 'Verified & live', body: 'Your profile is public. Any changes you save now go live instantly — no re-review needed.' },
  rejected: { tone: 'red', icon: AlertCircle, title: 'Changes needed', body: "Your last submission wasn't approved. Update your details below and save to resubmit for review." },
};

const bannerTone = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  red: 'border-rose-200 bg-rose-50 text-rose-800',
};

function TimelineEditor({ label, hint, fields, rows, setRows }) {
  const addRow = () => setRows([...rows, {}]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, key, value) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  return (
    <Card className="mt-5">
      <CardHeading title={label} sub={hint} />
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="relative rounded-xl border border-ink-100 p-4">
            <button onClick={() => removeRow(i)} className="absolute right-3 top-3 text-ink-300 hover:text-coral-500">
              <X size={15} />
            </button>
            <FormRow cols={3}>
              {fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input placeholder={f.placeholder} value={row[f.key] || ''} onChange={(e) => updateRow(i, f.key, e.target.value)} />
                </div>
              ))}
            </FormRow>
          </div>
        ))}
        <button onClick={addRow} className="w-full rounded-xl border border-dashed border-ink-200 py-2.5 text-[13.5px] font-semibold text-ink-500 hover:border-brand-300 hover:text-brand-600">
          <Plus size={14} className="mr-1 inline" /> Add {label === 'Work experience' ? 'a role' : 'a qualification'}
        </button>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('err');

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [languages, setLanguages] = useState('');
  const [selectedAreas, setSelectedAreas] = useState(new Set());
  const [modes, setModes] = useState(new Set());
  const [barNumber, setBarNumber] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [certUrl, setCertUrl] = useState('');
  const [expYears, setExpYears] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [expRows, setExpRows] = useState([]);
  const [eduRows, setEduRows] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setName(profile?.full_name || '');
      const ex = await getAdvocateProfile(user.id);
      setExisting(ex);
      if (ex) {
        setHeadline(ex.headline || '');
        setCity(ex.city || '');
        setState(ex.state || '');
        setLanguages((ex.languages || []).join(', '));
        setSelectedAreas(new Set(ex.practice_areas || []));
        setModes(new Set(ex.consultation_modes || []));
        setBarNumber(ex.bar_number || '');
        setCertUrl(ex.bar_certificate_url || '');
        setExpYears(ex.experience_years ?? '');
        setFee(ex.consultation_fee ?? '');
        setBio(ex.bio || '');
        setPhotoPreview(ex.photo_url || '');
        setExpRows(ex.experience_timeline || []);
        setEduRows(ex.education_timeline || []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleArea(a) {
    const next = new Set(selectedAreas);
    next.has(a) ? next.delete(a) : next.add(a);
    setSelectedAreas(next);
  }
  function toggleMode(m) {
    const next = new Set(modes);
    next.has(m) ? next.delete(m) : next.add(m);
    setModes(next);
  }
  function onPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setMsg('Please choose an image under 3MB.');
      setMsgKind('err');
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }
  async function viewCert() {
    try {
      window.open(await getBarCertificateSignedUrl(certUrl), '_blank');
    } catch {
      setMsg('Could not open certificate — try again.');
    }
  }

  async function handleSave() {
    setMsg('');
    const barVal = barNumber.trim();
    if (!barVal) {
      setMsg('Your Bar Council enrolment number is required.');
      return;
    }
    const barCanon = barVal
      .toUpperCase()
      .replace(/[\s-]+/g, '/')
      .replace(/\/{2,}/g, '/')
      .replace(/^([A-Z]+)(\d)/, '$1/$2');
    const BAR_RE = /^[A-Z]{1,5}\/\d{1,6}\/(19[5-9]\d|20[0-4]\d)$/;
    if (!BAR_RE.test(barCanon)) {
      setMsg("That doesn't look like a valid enrolment number. Use the format on your certificate: state code / number / year — e.g. MAH/1234/2015 or D/456/2019.");
      return;
    }
    const thisYear = new Date().getFullYear();
    const barYear = parseInt(barCanon.split('/')[2], 10);
    if (barYear > thisYear) {
      setMsg("The enrolment year can't be in the future — check the year on your certificate.");
      return;
    }
    const hasCertOnFile = !!(existing && existing.bar_certificate_url);
    if (!certFile && !hasCertOnFile) {
      setMsg('Please upload a photo or PDF of your Bar Council certificate — it is required for verification.');
      return;
    }
    if (certFile && certFile.size > 10 * 1024 * 1024) {
      setMsg('Certificate file is too large — maximum 10 MB.');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = photoPreview.startsWith('blob:') ? '' : photoPreview;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        photoUrl = await uploadPhoto('advocate-photos', `${user.id}/photo.${ext}`, photoFile);
      }
      let certPath = existing?.bar_certificate_url || null;
      if (certFile) certPath = await uploadBarCertificate(user.id, certFile);

      const feeVal = parseFloat(fee);
      const fields = {
        headline: headline.trim(),
        city: city.trim(),
        state: state.trim(),
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        bar_number: barCanon,
        bar_certificate_url: certPath,
        experience_years: parseInt(expYears, 10) || null,
        consultation_fee: isNaN(feeVal) ? null : feeVal,
        consultation_modes: Array.from(modes),
        bio: bio.trim(),
        practice_areas: Array.from(selectedAreas),
        photo_url: photoUrl || null,
        experience_timeline: expRows.filter((r) => Object.values(r).some((v) => v)),
        education_timeline: eduRows.filter((r) => Object.values(r).some((v) => v)),
      };
      if (existing && existing.verification_status === 'rejected') fields.verification_status = 'pending';

      const nameVal = name.trim();
      if (nameVal) await updateOwnName(user.id, nameVal);
      await upsertAdvocateProfile(user.id, fields, !existing);
      await refreshProfile();
      const refreshed = await getAdvocateProfile(user.id);
      setExisting(refreshed);
      setCertUrl(refreshed.bar_certificate_url || '');
      setPhotoPreview(photoUrl || '');
      setMsg('Profile saved.');
      setMsgKind('ok');
    } catch (e) {
      setMsg(e.message || 'Could not save your profile.');
      setMsgKind('err');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const status = existing?.verification_status || 'none';
  const banner = STATUS_BANNER[status];

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Your profile</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">This is what clients see once your profile is approved.</p>
      </motion.div>

      <div className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${bannerTone[banner.tone]}`}>
        <banner.icon size={17} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-[13.5px] font-bold">{banner.title}</div>
          <div className="text-[13px]">{banner.body}</div>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeading title="Basics" sub="Photo, headline, and where you practice." />
        <Label>Profile photo</Label>
        <div className="mb-1 flex items-center gap-4">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-50" />
          )}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-100 px-3.5 py-2 text-[13.5px] font-semibold text-ink-600 hover:border-brand-300">
            <Upload size={14} /> Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </label>
          <span className="text-[12px] text-ink-400">JPG or PNG, under 3MB.</span>
        </div>

        <Label>Full name</Label>
        <Input placeholder="As on Bar Council records" value={name} onChange={(e) => setName(e.target.value)} />
        <Label>Headline</Label>
        <Input placeholder="e.g. Tax Law Specialist" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        <FormRow>
          <div><Label>City</Label><Input placeholder="e.g. Pune" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><Label>State</Label><Input placeholder="e.g. Maharashtra" value={state} onChange={(e) => setState(e.target.value)} /></div>
        </FormRow>
        <Label>Languages you consult in</Label>
        <Input placeholder="e.g. Hindi, Marathi, English (comma separated)" value={languages} onChange={(e) => setLanguages(e.target.value)} />
      </Card>

      <Card className="mt-5">
        <CardHeading title="Practice & consultation" sub="What you handle, how clients can reach you, and your fee." />
        <Label>Practice areas</Label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip key={a} active={selectedAreas.has(a)} onClick={() => toggleArea(a)}>{a}</Chip>
          ))}
        </div>

        <Label>Consultation modes</Label>
        <div className="flex gap-5">
          {MODES.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-ink-800">
              <input type="checkbox" className="accent-brand-500" checked={modes.has(m.key)} onChange={() => toggleMode(m.key)} />
              {m.label}
            </label>
          ))}
        </div>

        <FormRow>
          <div>
            <Label required>Bar Council enrolment number</Label>
            <Input placeholder="e.g. MAH/1234/2015" value={barNumber} onChange={(e) => setBarNumber(e.target.value)} />
            <div className="mt-1 text-[11.5px] text-ink-400">Format: state code / number / year — exactly as printed on your certificate.</div>
            <Label required>Bar Council certificate / COP</Label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setCertFile(e.target.files[0])} className="w-full text-[13px]" />
            <div className="mt-1.5 text-[12px] text-ink-400">
              {certUrl ? (
                <>✅ Certificate on file — <button onClick={viewCert} className="text-brand-600 underline">view</button>. Choose a file only if you need to replace it.</>
              ) : (
                'Required — a clear photo or PDF of your enrolment certificate. Seen only by our verification team.'
              )}
            </div>
          </div>
          <div>
            <Label>Years of experience</Label>
            <Input type="number" min="0" placeholder="e.g. 6" value={expYears} onChange={(e) => setExpYears(e.target.value)} />
          </div>
        </FormRow>

        <Label>Consultation fee (₹, per 30 min)</Label>
        <Input type="number" min="0" placeholder="e.g. 1500" value={fee} onChange={(e) => setFee(e.target.value)} />
        <Label>About you</Label>
        <Textarea placeholder="A short professional bio clients will see on your profile." value={bio} onChange={(e) => setBio(e.target.value)} />
      </Card>

      <TimelineEditor label="Work experience" hint="Add your current and past roles, most recent first." fields={EXP_FIELDS} rows={expRows} setRows={setExpRows} />
      <TimelineEditor label="Education" hint="Degrees and certifications." fields={EDU_FIELDS} rows={eduRows} setRows={setEduRows} />

      {msg && <div className="mt-4"><Toast text={msg} kind={msgKind} /></div>}
      <div className="mt-5 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </AdvocateShell>
  );
}
