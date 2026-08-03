import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Upload, FileText, Send, X, Scale, Search, Bookmark, ExternalLink, AlertTriangle, DownloadCloud } from 'lucide-react';
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
  importCaseHistory,
  researchPrecedents,
  listCasePrecedents,
  savePrecedent,
  deletePrecedent,
} from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import { Input, Textarea, Label, Select } from '../../components/ui/Field';
import { Chip } from '../../components/ui/Misc';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
  const [msgKind, setMsgKind] = useState('ok');

  const [ev, setEv] = useState({ event_date: new Date().toISOString().slice(0, 10), kind: 'hearing', title: '', detail: '' });
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState([]);
  const [linkedClient, setLinkedClient] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind: 'event' | 'doc', item }
  const [deleting, setDeleting] = useState(false);

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
    if (!ev.title.trim()) { setMsg('Give the entry a title.'); setMsgKind('err'); return; }
    try {
      await addCaseEvent(id, user.id, ev);
      setEv({ ...ev, title: '', detail: '' });
      setMsg('');
      await load();
    } catch (e) {
      setMsg(e.message || 'Could not add that entry.');
      setMsgKind('err');
    }
  }
  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'event') await deleteCaseEvent(deleteTarget.item.id);
      else await deleteCaseDocument(deleteTarget.item);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setMsg(e.message || 'Could not delete that.');
      setMsgKind('err');
    } finally {
      setDeleting(false);
    }
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
    const prev = linkedClient;
    setLinkedClient(clientId);
    try {
      await linkCaseToClient(id, clientId || null);
    } catch (e) {
      setLinkedClient(prev);
      setMsg(e.message || 'Could not link that client.');
      setMsgKind('err');
    }
  }
  // Pressing Upload with nothing chosen used to return in silence, and any
  // failure after that was an unhandled rejection — so the button looked dead
  // either way. Every path now says what happened.
  async function handleUploadDoc() {
    if (!docFile) { setMsg('Choose a file first.'); setMsgKind('err'); return; }
    if (docFile.size > 10 * 1024 * 1024) { setMsg('File too large — max 10MB.'); setMsgKind('err'); return; }
    setUploading(true);
    try {
      await uploadCaseDocument(id, user.id, docFile);
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMsg(`Uploaded ${docFile.name}.`);
      setMsgKind('ok');
      await load();
    } catch (e) {
      setMsg(e.message || 'Could not upload that document.');
      setMsgKind('err');
    } finally {
      setUploading(false);
    }
  }
  // The court already knows every date this matter was listed on. Typing that
  // history in by hand is work the API can do.
  async function handleImportHistory() {
    setImporting(true);
    try {
      const { added, skipped } = await importCaseHistory(id, user.id, caseRow.crn);
      setMsg(
        added === 0
          ? `Nothing new — all ${skipped} entries from eCourts are already on the timeline.`
          : `Added ${added} entr${added === 1 ? 'y' : 'ies'} from eCourts${skipped ? `, skipped ${skipped} already here` : ''}.`,
      );
      setMsgKind('ok');
      await load();
    } catch (e) {
      setMsg(e.message || 'Could not pull the history for this case.');
      setMsgKind('err');
    } finally {
      setImporting(false);
    }
  }
  async function handleOpenDoc(doc) {
    try {
      window.open(await caseDocumentUrl(doc.file_path), '_blank');
    } catch (e) {
      setMsg(e.message || 'Could not open that document.');
      setMsgKind('err');
    }
  }
  async function sendLatestUpdate() {
    if (!linkedClient) { setMsg('Link a client first.'); setMsgKind('err'); return; }
    if (!events.length) { setMsg('Add a timeline entry first.'); setMsgKind('err'); return; }
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
    setMsgKind('ok');
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <Link to="/dashboard/advocate/cases" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft size={14} /> All cases
      </Link>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">{caseRow.case_title}</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">{[caseRow.crn, caseRow.court_name].filter(Boolean).join(' · ')}</p>
      </motion.div>

      {msg && <div className="mt-3"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
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
            <div className="flex items-start justify-between gap-3">
              <CardHeading title="Timeline" />
              {caseRow.crn && (
                <Button size="sm" variant="ghost" onClick={handleImportHistory} disabled={importing}>
                  <DownloadCloud size={14} /> {importing ? 'Pulling…' : 'Pull from eCourts'}
                </Button>
              )}
            </div>
            {events.length === 0 && (
              <EmptyState
                title="No entries yet"
                sub={caseRow.crn ? 'Pull the hearing history from eCourts, or add an entry above.' : undefined}
              />
            )}
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 border-l-2 border-brand-200 pl-3.5">
                  <div>
                    <div className="text-[12px] font-bold uppercase text-brand-500">{e.kind} · {new Date(e.event_date).toLocaleDateString('en-IN')}</div>
                    <div className="text-[14px] font-semibold text-ink-900">{e.title}</div>
                    {e.detail && <div className="mt-0.5 text-[13px] text-ink-500">{e.detail}</div>}
                  </div>
                  <button onClick={() => setDeleteTarget({ kind: 'event', item: e })} className="shrink-0 text-ink-300 hover:text-coral-500"><Trash2 size={14} /></button>
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
              {/* The browser's own control gives no hint that picking a file is
                  step one, so it is styled to read as a button. Upload stays
                  enabled and says what is missing rather than sitting greyed
                  out with no explanation. */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setDocFile(e.target.files[0] || null)}
                className="min-w-0 flex-1 text-[13px] text-ink-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-bold file:text-brand-700 hover:file:bg-brand-100"
              />
              <Button size="sm" onClick={handleUploadDoc} disabled={uploading}>
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
            <div className="mt-3 space-y-1.5">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
                  <span className="flex items-center gap-1.5 font-semibold text-ink-800"><FileText size={14} /> {d.file_name}</span>
                  <div className="flex gap-3">
                    <button onClick={() => handleOpenDoc(d)} className="text-brand-600 hover:underline">Open</button>
                    <button onClick={() => setDeleteTarget({ kind: 'doc', item: d })} className="text-ink-400 hover:text-coral-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {docs.length === 0 && <div className="text-[13px] text-ink-400">No documents uploaded.</div>}
            </div>
          </Card>

          <PrecedentPanel caseRow={caseRow} userId={user.id} />
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        busy={deleting}
        title={deleteTarget?.kind === 'event' ? 'Delete this timeline entry?' : 'Delete this document?'}
        message={
          deleteTarget?.kind === 'event'
            ? `This will permanently delete "${deleteTarget?.item?.title}" from the case timeline. This can't be undone.`
            : `This will permanently delete "${deleteTarget?.item?.file_name}". This can't be undone.`
        }
      />
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

// Precedent research. The list is whatever the eCourts search returned for this
// matter — every row carries a real CNR, so an advocate can open the official
// record before relying on it. The one-line relevance note is model-written and
// labelled as such; it explains a retrieved record and never supplies a citation.
function PrecedentPanel({ caseRow, userId }) {
  const [matter, setMatter] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [run, setRun] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    listCasePrecedents(caseRow.id).then(setSaved).catch(() => {});
  }, [caseRow.id]);

  const savedCnrs = new Set(saved.map((s) => s.cnr));

  async function handleSearch() {
    setErr('');
    setBusy(true);
    try {
      setRun(await researchPrecedents({ matter, acts: caseRow.labels || [] }));
    } catch (e) {
      setErr(e.message || 'Precedent search failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(r) {
    try {
      await savePrecedent(userId, caseRow.id, r);
      setSaved(await listCasePrecedents(caseRow.id));
    } catch (e) {
      setErr(e.message || 'Could not save that precedent.');
    }
  }

  async function handleRemove(id) {
    try {
      await deletePrecedent(id);
      setSaved(await listCasePrecedents(caseRow.id));
    } catch (e) {
      setErr(e.message || 'Could not remove that precedent.');
    }
  }

  return (
    <Card>
      <CardHeading title="Find precedents" sub="Searches the eCourts record of decided matters. Verify anything you intend to cite." />

      {err && <div className="mb-3"><Toast text={err} kind="err" /></div>}

      <Textarea
        rows={3}
        value={matter}
        onChange={(e) => setMatter(e.target.value)}
        placeholder="Describe the legal question in a sentence or two — e.g. cheque dishonoured because the drawer's signature did not match the specimen; is the complaint maintainable?"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[12px] text-ink-400">
          {(caseRow.labels || []).length > 0 && `Using labels: ${(caseRow.labels || []).join(', ')}`}
        </span>
        <Button size="sm" onClick={handleSearch} disabled={busy || matter.trim().length < 15}>
          <Search size={14} /> {busy ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {saved.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-400">Saved to this case</div>
          <div className="space-y-1.5">
            {saved.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-brand-50/60 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-ink-900">{s.case_title || s.cnr}</div>
                  <div className="truncate text-[12px] text-ink-500">
                    {s.court_name || '—'}{s.decision_date ? ` · decided ${new Date(s.decision_date).toLocaleDateString('en-IN')}` : ''} · {s.cnr}
                  </div>
                </div>
                <button onClick={() => handleRemove(s.id)} className="shrink-0 text-ink-400 hover:text-coral-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {run && (
        <div className="mt-5">
          {run.queries?.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-400">
              <span className="font-semibold">Searched for:</span>
              {run.queries.map((q) => (
                <span key={q} className="rounded-full bg-ink-50 px-2 py-0.5 text-ink-600">{q}</span>
              ))}
            </div>
          )}

          {run.ai_status === 'off' && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-gold-50 px-3 py-2 text-[12.5px] text-gold-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Searching on your words directly. Add an ANTHROPIC_API_KEY to turn on query building and relevance notes.</span>
            </div>
          )}
          {run.ai_status === 'failed' && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-coral-500/10 px-3 py-2 text-[12.5px] text-coral-500">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                <b>The key is set but the AI call was refused,</b> so these are plain keyword results.
                {run.ai_error ? ` The API said: “${run.ai_error}”` : ''}
              </span>
            </div>
          )}

          {run.results.length === 0 ? (
            <div className="text-[13px] text-ink-400">Nothing matched. Try naming the statute and section.</div>
          ) : (
            <div className="space-y-2.5">
              {run.results.map((r) => (
                <div key={r.cnr} className="rounded-xl border border-ink-100 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-ink-900">{r.case_title}</div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {r.court_name || '—'}
                        {r.decision_date && ` · decided ${new Date(r.decision_date).toLocaleDateString('en-IN')}`}
                        {r.judgment_count > 0 && ' · judgment on file'}
                      </div>
                      <div className="mt-0.5 font-mono text-[11.5px] text-ink-400">{r.cnr}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savedCnrs.has(r.cnr)}
                      onClick={() => handleSave(r)}
                    >
                      <Bookmark size={13} /> {savedCnrs.has(r.cnr) ? 'Saved' : 'Save'}
                    </Button>
                  </div>

                  {r.relevance && (
                    <p className="mt-2 rounded-lg bg-brand-50/70 px-2.5 py-1.5 text-[12.5px] text-ink-700">
                      <span className="font-bold text-brand-700">Why this may help — </span>{r.relevance}
                    </p>
                  )}

                  {r.topics?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.topics.map((t) => (
                        <span key={t} className="rounded-full bg-ink-50 px-2 py-0.5 text-[11.5px] text-ink-600">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* The eCourts portal has no public deep link for a CNR — it
                      is a form behind a captcha — so this opens the record
                      through the lookup we already pay for. */}
                  <Link
                    to={`/track-case?cnr=${r.cnr}`}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:underline"
                  >
                    Open the full case record <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-[12px] text-ink-400">
            <Scale size={13} className="mt-0.5 shrink-0" />
            Results come from the eCourts case record. Read the judgment and check the citation against the official
            reporter before relying on it in any filing.
          </p>
        </div>
      )}
    </Card>
  );
}
