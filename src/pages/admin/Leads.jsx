import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, StickyNote, Clock, AlertTriangle } from 'lucide-react';
import { listLeads, listApprovedAdvocatesForAssignment, updateLead, deleteLead } from '../../lib/cms';
import { useLiveRefresh } from '../../lib/realtime';
import AdminShell from '../../components/layout/AdminShell';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import Card from '../../components/ui/Card';
import { Spinner, Toast } from '../../components/ui/Misc';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const STATUSES = ['new', 'contacted', 'converted', 'dropped'];
const SOURCES = ['booking', 'post_case', 'case_tracker', 'other'];
const OVERDUE_HOURS = 24;

// A lead is "awaiting the advocate" once assigned but not yet accepted
// (converted) or declined (dropped) — this is the dull/pending state.
function isPending(l) {
  return !!l.advocate_id && (l.status === 'new' || l.status === 'contacted');
}
function isOverdue(l) {
  if (!isPending(l) || !l.assigned_at) return false;
  return Date.now() - new Date(l.assigned_at).getTime() > OVERDUE_HOURS * 3600 * 1000;
}

export default function Leads() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Called on mount (when `loading` already starts true) and again on every
  // live update / reassignment — deliberately doesn't toggle `loading` back
  // to true itself, or the whole table would flash to a spinner mid-session.
  async function load() {
    const [l, a] = await Promise.all([listLeads(), listApprovedAdvocatesForAssignment()]);
    setLeads(l);
    setAdvocates(a);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useLiveRefresh('admin-leads-live', [{ table: 'leads' }], load);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (sourceFilter && l.source !== sourceFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [l.client_name, l.phone, l.matter, l.city, l.email].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, search]);

  async function handleStatus(id, status) {
    setErrorMsg('');
    try {
      await updateLead(id, { status });
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      // The <select> already shows the picked value — resync from the
      // server so it doesn't keep displaying a change that never saved.
      setErrorMsg("Couldn't update that lead's status. Please try again.");
      load();
    }
  }
  async function handleAssign(id, advocateId) {
    setErrorMsg('');
    try {
      await updateLead(id, { advocate_id: advocateId || null });
    } catch {
      setErrorMsg("Couldn't reassign that lead. Please try again.");
    } finally {
      // Reassignment can reset status/assigned_at server-side (via trigger) —
      // reload rather than patch local state, so the pending/overdue state
      // shown here always matches what actually happened (success or not).
      load();
    }
  }
  async function handleNote(l) {
    const note = window.prompt('Note for this lead:', l.admin_notes || '');
    if (note === null) return;
    setErrorMsg('');
    try {
      await updateLead(l.id, { admin_notes: note });
      setLeads((ls) => ls.map((x) => (x.id === l.id ? { ...x, admin_notes: note } : x)));
    } catch {
      setErrorMsg("Couldn't save that note. Please try again.");
    }
  }
  async function handleDelete() {
    setDeleting(true);
    await deleteLead(deleteTarget.id);
    setLeads((ls) => ls.filter((l) => l.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  const counts = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Leads</h1>
        <p className="mt-1 text-[14px] text-ink-500">Every enquiry captured from the public site.</p>
      </motion.div>

      {errorMsg && <div className="mt-4"><Toast text={errorMsg} kind="err" /></div>}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total" value={counts.total} accent="brand" />
        <StatTile label="New" value={counts.new} accent="coral" />
        <StatTile label="Contacted" value={counts.contacted} accent="sun" />
        <StatTile label="Converted" value={counts.converted} accent="green" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Select className="!w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select className="!w-44" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input className="max-w-xs flex-1" placeholder="Search name, phone, matter…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="mt-4 overflow-x-auto !p-0">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[11.5px] font-bold uppercase text-ink-400">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Matter</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assign to</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const pending = isPending(l);
              const overdue = isOverdue(l);
              return (
                <tr key={l.id} className={`border-b border-ink-50 last:border-0 ${pending ? 'bg-ink-50/50 text-ink-400' : ''}`}>
                  <td className="px-4 py-3">
                    <div className={`font-bold ${pending ? 'text-ink-500' : 'text-ink-900'}`}>{l.client_name || '—'}</div>
                    <div className="text-ink-400">{l.phone} {l.email ? `· ${l.email}` : ''}</div>
                    {pending && (
                      <Badge tone={overdue ? 'amber' : 'gray'} className="mt-1">
                        {overdue ? <><AlertTriangle size={11} /> Overdue — no response in 24h</> : <><Clock size={11} /> Awaiting advocate response</>}
                      </Badge>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${pending ? '' : 'text-ink-600'}`}>{l.matter || '—'}{l.city ? ` · ${l.city}` : ''}</td>
                  <td className={`px-4 py-3 ${pending ? '' : 'text-ink-500'}`}>{l.source}</td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => handleStatus(l.id, e.target.value)} className="rounded-md border border-ink-100 bg-white px-2 py-1 text-[12.5px] text-ink-800">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={l.advocate_id || ''} onChange={(e) => handleAssign(l.id, e.target.value)} className="rounded-md border border-ink-100 bg-white px-2 py-1 text-[12.5px] text-ink-800">
                      <option value="">Unassigned</option>
                      {advocates.map((a) => <option key={a.id} value={a.id}>{a.profiles?.full_name || a.id}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleNote(l)} aria-label="Edit note" className="text-ink-400 hover:text-brand-600"><StickyNote size={15} /></button>
                      <button onClick={() => setDeleteTarget(l)} aria-label="Delete lead" className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-[13.5px] text-ink-400">No leads match your filters.</div>}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this lead?"
        message={`This will permanently delete the lead from ${deleteTarget?.client_name || 'this client'}. This can't be undone.`}
      />
    </AdminShell>
  );
}
