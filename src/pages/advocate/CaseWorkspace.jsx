import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Upload, FileText, Send, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  getCase,
  listCaseEvents,
  addCaseEvent,
  deleteCaseEvent,
  setCaseLabels,
  listMyClients,
  linkCaseToClient,
  listCaseDocuments,
  uploadCaseDocument,
  caseDocumentUrl,
  deleteCaseDocument,
  logClientUpdate,
} from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import { Input, Textarea, Label, Select } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Misc';
import Button from '../../components/ui/Button';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

const EVENT_KINDS = [
  { value: 'hearing', label: 'Hearing' },
  { value: 'order', label: 'Order' },
  { value: 'filing', label: 'Filing' },
  { value: 'note', label: 'Note' },
];

export default function CaseWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseRow, setCaseRow] = useState(null);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [docs, setDocs] = useState([]);
  const [msg, setMsg] = useState('');

  const [ev, setEv] = useState({ event_date: new Date().toISOString().slice(0, 10), kind: 'hearing', title: '', detail: '' });
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState([]);
  const [linkedClient, setLinkedClient] = useState('');
  const [docFile, setDocFile] = useState(null);

  async function load() {
    setLoading(true);
    const c = await getCase(id);
    if (!c || c.advocate_id !== user.id) {
      navigate('/dashboard/advocate/cases');
      return;
    }
    setCaseRow(c);
    setLabels(c.labels || []);
    setLinkedClient(c.register_client_id || '');
    const [evs, cls, dcs] = await Promise.all([listCaseEvents(id), listMyClients(user.id), listCaseDocuments(id)]);
    setEvents(evs);
    setClients(cls);
    setDocs(dcs);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user, id]);

  async function handleAddEvent() {
    if (!ev.title.trim()) return;
    await addCaseEvent(id, user.id, ev);
    setEv({ ...ev, title: '', detail: '' });
    load();
  }
  async function handleDeleteEvent(eid) {
    await deleteCaseEvent(eid);
    load();
  }
  function addLabel() {
    const v = labelInput.trim().toLowerCase();
    if (!v) return;
    const next = Array.from(new Set([...labels, v]));
    setLabels(next);
    setLabelInput('');
    setCaseLabels(id, next);
  }
  function removeLabel(l) {
    const next = labels.filter((x) => x !== l);
    setLabels(next);
    setCaseLabels(id, next);
  }
  async function handleLinkClient(clientId) {
    setLinkedClient(clientId);
    await linkCaseToClient(id, clientId || null);
  }
  async function handleUploadDoc() {
    if (!docFile) return;
    if (docFile.size > 10 * 1024 * 1024) { setMsg('File too large — max 10MB.'); return; }
    await uploadCaseDocument(id, user.id, docFile);
    setDocFile(null);
    load();
  }
  async function handleOpenDoc(doc) {
    window.open(await caseDocumentUrl(doc.file_path), '_blank');
  }
  async function handleDeleteDoc(doc) {
    await deleteCaseDocument(doc);
    load();
  }
  async function sendLatestUpdate() {
    if (!linkedClient) { setMsg('Link a client first.'); return; }
    if (!events.length) { setMsg('Add a timeline entry first.'); return; }
    const latest = events[0];
    const client = clients.find((c) => c.id === linkedClient);
    const message = `Update on your case "${caseRow.case_title}": ${latest.title}. Next hearing: ${caseRow.next_hearing_date ? new Date(caseRow.next_hearing_date).toLocaleDateString('en-IN') : 'TBD'}. — via LegalConnects`;
    await logClientUpdate(user.id, linkedClient, id, message, 'whatsapp');
    if (client?.phone) {
      const phone = client.phone.replace(/\D/g, '');
      const withCC = phone.length === 10 ? `91${phone}` : phone;
      window.open(`https://wa.me/${withCC}?text=${encodeURIComponent(message)}`, '_blank');
    }
    setMsg('Update logged.');
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <Link to="/dashboard/advocate/cases" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft size={14} /> All cases
      </Link>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
        <h1 className="font-heading text-[24px] font-extrabold text-ink-900">{caseRow.case_title}</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">{[caseRow.case_number, caseRow.court_name].filter(Boolean).join(' · ')}</p>
      </motion.div>

      {msg && <div className="mt-3"><Toast text={msg} kind="ok" /></div>}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeading title="Add a timeline entry" />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={ev.event_date} onChange={(e) => setEv({ ...ev, event_date: e.target.value })} /></div>
              <div><Label>Kind</Label><Select value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })}>{EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</Select></div>
            </div>
            <Label>Title</Label>
            <Input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} placeholder="e.g. Next hearing scheduled" />
            <Label>Detail</Label>
            <Textarea rows={2} value={ev.detail} onChange={(e) => setEv({ ...ev, detail: e.target.value })} />
            <Button size="sm" className="mt-3" onClick={handleAddEvent}><Plus size={14} /> Add entry</Button>
          </Card>

          <Card>
            <CardHeading title="Timeline" />
            {events.length === 0 && <EmptyState title="No entries yet" />}
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 border-l-2 border-brand-200 pl-3.5">
                  <div>
                    <div className="text-[12px] font-bold uppercase text-brand-500">{e.kind} · {new Date(e.event_date).toLocaleDateString('en-IN')}</div>
                    <div className="text-[14px] font-semibold text-ink-900">{e.title}</div>
                    {e.detail && <div className="mt-0.5 text-[13px] text-ink-500">{e.detail}</div>}
                  </div>
                  <button onClick={() => handleDeleteEvent(e.id)} className="shrink-0 text-ink-300 hover:text-coral-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardHeading title="Documents" />
              <Link to="/dashboard/advocate/documents" className="mb-4 flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:underline">
                <FileText size={13} /> Generate a document
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" onChange={(e) => setDocFile(e.target.files[0])} className="flex-1 text-[13px]" />
              <Button size="sm" onClick={handleUploadDoc}><Upload size={14} /> Upload</Button>
            </div>
            <div className="mt-3 space-y-1.5">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
                  <span className="flex items-center gap-1.5 font-semibold text-ink-800"><FileText size={14} /> {d.file_name}</span>
                  <div className="flex gap-3">
                    <button onClick={() => handleOpenDoc(d)} className="text-brand-600 hover:underline">Open</button>
                    <button onClick={() => handleDeleteDoc(d)} className="text-ink-400 hover:text-coral-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {docs.length === 0 && <div className="text-[13px] text-ink-400">No documents uploaded.</div>}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeading title="Case facts" />
            <dl className="space-y-2 text-[13px]">
              <Fact label="Stage" value={caseRow.stage} />
              <Fact label="Filed" value={caseRow.filed_date ? new Date(caseRow.filed_date).toLocaleDateString('en-IN') : null} />
              <Fact label="Last order" value={caseRow.last_order} />
              <Fact label="Source" value={caseRow.source} />
            </dl>
          </Card>

          <Card>
            <CardHeading title="Labels" />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {labels.map((l) => (
                <Chip key={l} active onClick={() => removeLabel(l)}>{l} <X size={11} className="ml-1 inline" /></Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLabel()} placeholder="Add a label" />
              <Button size="sm" onClick={addLabel}>Add</Button>
            </div>
          </Card>

          <Card>
            <CardHeading title="Client" />
            <Select value={linkedClient} onChange={(e) => handleLinkClient(e.target.value)}>
              <option value="">Not linked</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
            <Button size="sm" variant="subtle" className="mt-3 w-full" onClick={sendLatestUpdate}>
              <Send size={14} /> Send latest update
            </Button>
          </Card>
        </div>
      </div>
    </AdvocateShell>
  );
}

function Fact({ label, value }) {
  return (
    <div className="flex justify-between border-b border-ink-50 pb-2">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-semibold text-ink-800">{value || '—'}</dd>
    </div>
  );
}
