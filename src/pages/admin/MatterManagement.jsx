import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, Trash2, Briefcase } from 'lucide-react';
import { listAllMatters, updateLead, deleteLead, adminConvertLead } from '../../lib/cms';
import { useLiveRefresh } from '../../lib/realtime';
import { MATTER_TYPES, findMatterType } from '../../lib/matterTypes';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import { Spinner, Toast } from '../../components/ui/Misc';

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', converted: 'Completed', dropped: 'Declined' };

// Tile styling per status filter — all classes are static so Tailwind compiles them.
const TILES = [
  { key: '', label: 'Total', valueClass: 'text-ink-900', activeClass: 'border-brand-300 bg-brand-50' },
  { key: 'new', label: 'New', valueClass: 'text-amber-600', activeClass: 'border-amber-300 bg-amber-50' },
  { key: 'contacted', label: 'Contacted', valueClass: 'text-brand-600', activeClass: 'border-brand-300 bg-brand-50' },
  { key: 'converted', label: 'Completed', valueClass: 'text-emerald-600', activeClass: 'border-emerald-300 bg-emerald-50' },
  { key: 'dropped', label: 'Declined', valueClass: 'text-ink-400', activeClass: 'border-ink-300 bg-ink-50' },
];

export default function MatterManagement() {
  const [loading, setLoading] = useState(true);
  const [matters, setMatters] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Doesn't reset `loading` on every call — this also runs on live updates
  // (e.g. an advocate accepting/declining a matter, or another admin tab),
  // and flashing the whole list to a spinner mid-session would be jarring.
  async function load() {
    try {
      setMatters(await listAllMatters());
    } catch (e) {
      console.error(e);
      setMsg(e.message || 'Could not load matters.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  useLiveRefresh('admin-matters-live', [{ table: 'leads' }], load);

  // Derived from the same list the table shows, so tiles never drift
  // out of sync after Done / Decline / Delete.
  const stats = useMemo(() => ({
    total: matters.length,
    new: matters.filter((m) => m.status === 'new').length,
    contacted: matters.filter((m) => m.status === 'contacted').length,
    converted: matters.filter((m) => m.status === 'converted').length,
    dropped: matters.filter((m) => m.status === 'dropped').length,
  }), [matters]);

  const filtered = useMemo(() => {
    return matters.filter((m) => {
      if (typeFilter && m.matter_type !== typeFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [m.client_name, m.matter, m.city].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [matters, typeFilter, statusFilter, search]);

  async function handleAction(matterId, status) {
    try {
      await updateLead(matterId, { status });
      setMatters((ms) => ms.map((m) => (m.id === matterId ? { ...m, status } : m)));
      setMsg(`Matter marked as ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (e) {
      setMsg(e.message || 'Action failed.');
    }
  }

  // "Done" has to create the same advocate_clients link a real advocate
  // accept does, or the matter shows completed while the client exists
  // nowhere in that advocate's register — so this goes through the RPC
  // instead of a plain status update.
  async function handleDone(matter) {
    try {
      const updated = await adminConvertLead(matter.id);
      setMatters((ms) => ms.map((m) => (m.id === matter.id ? { ...m, ...updated } : m)));
      setMsg('Matter marked completed and added to the advocate\'s client register.');
    } catch (e) {
      setMsg(e.message || 'Could not mark this matter completed.');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLead(deleteTarget.id);
      setMatters((ms) => ms.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMsg('Matter deleted.');
    } catch (e) {
      setMsg(e.message || 'Could not delete matter.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Matter Management</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">All cases posted by clients — click a tile to filter, click a matter to see the full request.</p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('failed') || msg.includes('Could not') ? 'err' : 'ok'} /></div>}

      {/* Status tiles double as filters; counts always match the data below. */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {TILES.map((t) => {
          const active = statusFilter === t.key || (t.key === '' && !statusFilter);
          const count = t.key === '' ? stats.total : stats[t.key];
          return (
            <button
              key={t.label}
              onClick={() => setStatusFilter(t.key)}
              className={`rounded-2xl border p-3 text-center transition-all ${
                active
                  ? `${t.activeClass} shadow-[var(--shadow-card-hover)]`
                  : 'border-ink-100 bg-white hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]'
              }`}
            >
              <div className="text-[11px] font-semibold text-ink-500">{t.label}</div>
              <div className={`mt-1 text-[24px] font-bold ${t.valueClass}`}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Filters & list */}
      <Card className="mt-6">
        <CardHeading title="Matters" sub={statusFilter ? `Showing ${STATUS_LABELS[statusFilter].toLowerCase()} matters.` : 'Showing all matters.'} />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search by client, matter, or city…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-44">
            <option value="">All types</option>
            {MATTER_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Completed</option>
            <option value="dropped">Declined</option>
          </Select>
        </div>

        <div className="space-y-3 border-t border-ink-100 pt-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => setViewing(m)}
              className="cursor-pointer rounded-lg border border-ink-100 p-4 transition-all hover:border-brand-300 hover:bg-brand-50/50"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="gray">{findMatterType(m.matter_type)?.label || 'General enquiry'}</Badge>
                    <Badge tone={m.status === 'new' ? 'amber' : m.status === 'converted' ? 'green' : m.status === 'dropped' ? 'red' : 'blue'}>
                      {STATUS_LABELS[m.status] || m.status}
                    </Badge>
                    {m.advocate_name ? (
                      <Badge tone="blue">Assigned · {m.advocate_name}</Badge>
                    ) : (
                      <Badge tone="gray">Unclaimed</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-ink-900">{m.matter}</div>
                    <div className="mt-0.5 text-[12px] text-ink-500">
                      {m.client_name} · {m.city} · {new Date(m.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </div>
                    {m.description && (
                      <div className="mt-1.5 line-clamp-2 text-[13px] text-ink-600">{m.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-2 sm:shrink-0">
                  {m.status !== 'converted' && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!m.advocate_id}
                      title={!m.advocate_id ? 'Assign this matter to an advocate first' : undefined}
                      onClick={(e) => { e.stopPropagation(); handleDone(m); }}
                    >
                      <Check size={14} /> Done
                    </Button>
                  )}
                  {m.status !== 'dropped' && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAction(m.id, 'dropped'); }}>
                      <X size={14} /> Decline
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewing(m); }}>
                    <Eye size={14} /> View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <Briefcase size={28} className="mx-auto text-ink-300" />
              <div className="mt-3 text-[14px] font-semibold text-ink-900">No matters found</div>
              <div className="mt-1 text-[12.5px] text-ink-500">
                {matters.length === 0 ? 'Matters appear here when clients post cases.' : 'Try clearing the filters or search.'}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Details modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Matter details" width="max-w-2xl">
        {viewing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Matter</h3>
              <p className="mt-1 text-[15px] font-bold text-ink-900">{viewing.matter}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Posted by</h3>
                <p className="mt-1 text-[14px] text-ink-900">{viewing.client_name || '—'}</p>
              </div>
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Contact</h3>
                <p className="mt-1 text-[14px] text-ink-900">{[viewing.phone, viewing.email].filter(Boolean).join(' · ') || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Type</h3>
                <p className="mt-1 text-[14px] text-ink-900">{findMatterType(viewing.matter_type)?.label || 'General enquiry'}</p>
              </div>
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Status</h3>
                <div className="mt-1">
                  <Badge tone={viewing.status === 'converted' ? 'green' : viewing.status === 'dropped' ? 'red' : 'amber'}>
                    {STATUS_LABELS[viewing.status] || viewing.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Advocate</h3>
              <p className="mt-1 text-[14px] text-ink-900">
                {viewing.advocate_name ? `Assigned to ${viewing.advocate_name}` : 'Unclaimed — no advocate assigned yet'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">City</h3>
                <p className="mt-1 text-[14px] text-ink-900">{viewing.city || '—'}</p>
              </div>
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Posted</h3>
                <p className="mt-1 text-[14px] text-ink-900">{new Date(viewing.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              </div>
            </div>
            {viewing.description && (
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Description &amp; requirements</h3>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">{viewing.description}</p>
              </div>
            )}
            <div className="flex gap-2 border-t border-ink-100 pt-4">
              {viewing.status !== 'converted' && (
                <Button
                  size="sm"
                  disabled={!viewing.advocate_id}
                  title={!viewing.advocate_id ? 'Assign this matter to an advocate first' : undefined}
                  onClick={() => { handleDone(viewing); setViewing(null); }}
                >
                  <Check size={14} /> Mark completed
                </Button>
              )}
              {viewing.status !== 'dropped' && (
                <Button size="sm" variant="ghost" onClick={() => { handleAction(viewing.id, 'dropped'); setViewing(null); }}>
                  <X size={14} /> Decline
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this matter?"
        message={`This will permanently delete "${deleteTarget?.matter}". This can't be undone.`}
      />
    </AdminShell>
  );
}
