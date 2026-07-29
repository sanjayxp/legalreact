import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, ArrowRight, Gavel } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { listMyCases, createCase, deleteCase, lookupCaseByCNR } from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import { Input, Textarea, Label } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

export default function Cases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('err');

  const [cnr, setCnr] = useState('');
  const [cnrBusy, setCnrBusy] = useState(false);
  const [cnrPreview, setCnrPreview] = useState(null);

  const [form, setForm] = useState({ case_title: '', case_number: '', court_name: '', case_type: '', stage: '', next_hearing_date: '' });
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setCases(await listMyCases(user.id));
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function handleCnrLookup() {
    if (!cnr.trim()) return;
    setCnrBusy(true);
    setMsg('');
    setCnrPreview(null);
    try {
      const data = await lookupCaseByCNR(cnr.trim().toUpperCase());
      setCnrPreview(data);
    } catch (e) {
      setMsg(e.message);
      setMsgKind('err');
    } finally {
      setCnrBusy(false);
    }
  }
  async function saveCnrPreview() {
    await createCase(user.id, { ...cnrPreview, source: 'ecourts_api' });
    setCnrPreview(null);
    setCnr('');
    load();
  }

  async function handleAdd() {
    if (!form.case_title.trim()) {
      setMsg('Case title is required.');
      setMsgKind('err');
      return;
    }
    setAdding(true);
    try {
      await createCase(user.id, {
        ...form,
        next_hearing_date: form.next_hearing_date ? new Date(form.next_hearing_date).toISOString() : null,
      });
      setForm({ case_title: '', case_number: '', court_name: '', case_type: '', stage: '', next_hearing_date: '' });
      load();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    await deleteCase(id);
    load();
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">My cases</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Track hearings, orders, and filings across your active matters.</p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          {cases.length === 0 && <EmptyState icon={<Gavel size={28} />} title="No cases yet" sub="Add one manually or look it up by CNR." />}
          {cases.map((c) => {
            const d = c.next_hearing_date ? new Date(c.next_hearing_date) : null;
            return (
              <Card key={c.id} className="flex items-center gap-4 !p-4" hover>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-center leading-tight text-brand-700">
                  {d ? (
                    <div>
                      <div className="text-[10px] font-bold uppercase">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
                      <div className="text-[16px] font-extrabold">{d.getDate()}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-ink-400">No date</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold text-ink-900">{c.case_title}</div>
                  <div className="truncate text-[12.5px] text-ink-500">
                    {[c.case_number, c.court_name, c.case_type, c.stage].filter(Boolean).join(' · ') || 'No details added'}
                  </div>
                </div>
                <Link to={`/dashboard/advocate/cases/${c.id}`}>
                  <Button size="sm" variant="ghost">Open workspace <ArrowRight size={14} /></Button>
                </Link>
                <button onClick={() => handleDelete(c.id)} className="text-ink-300 hover:text-coral-500"><Trash2 size={16} /></button>
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeading title="Look up by CNR" sub="Pulls details from the eCourts network." />
            <div className="flex gap-2">
              <Input placeholder="e.g. DLHC010001232024" value={cnr} onChange={(e) => setCnr(e.target.value.toUpperCase())} />
              <Button size="sm" onClick={handleCnrLookup} disabled={cnrBusy}><Search size={14} /></Button>
            </div>
            {cnrPreview && (
              <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-[12.5px]">
                <div className="font-bold text-ink-900">{cnrPreview.case_title}</div>
                <div className="mt-1 text-ink-600">{[cnrPreview.case_number, cnrPreview.court_name, cnrPreview.case_type].filter(Boolean).join(' · ')}</div>
                {cnrPreview.next_hearing_date && <div className="mt-1 text-ink-600">Next hearing: {new Date(cnrPreview.next_hearing_date).toLocaleDateString('en-IN')}</div>}
                {cnrPreview.stage && <div className="text-ink-600">Stage: {cnrPreview.stage}</div>}
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" onClick={saveCnrPreview}>Save to My Cases</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCnrPreview(null)}>Discard</Button>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeading title="Add a case manually" />
            <Label required>Case title</Label>
            <Input value={form.case_title} onChange={(e) => setForm({ ...form, case_title: e.target.value })} placeholder="Petitioner vs Respondent" />
            <Label>Case / CNR number</Label>
            <Input value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })} />
            <Label>Court</Label>
            <Input value={form.court_name} onChange={(e) => setForm({ ...form, court_name: e.target.value })} />
            <Label>Type</Label>
            <Input value={form.case_type} onChange={(e) => setForm({ ...form, case_type: e.target.value })} placeholder="e.g. Civil suit" />
            <Label>Stage</Label>
            <Input value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} placeholder="e.g. Arguments" />
            <Label>Next hearing date</Label>
            <Input type="date" value={form.next_hearing_date} onChange={(e) => setForm({ ...form, next_hearing_date: e.target.value })} />
            <Button className="mt-4 w-full" onClick={handleAdd} disabled={adding}><Plus size={14} /> Add case</Button>
          </Card>
        </div>
      </div>
    </AdvocateShell>
  );
}
