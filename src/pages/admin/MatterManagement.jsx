import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Check, X, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listAllMatters, getMatterStats, updateLead, deleteLead } from '../../lib/cms';
import { MATTER_TYPES, findMatterType } from '../../lib/matterTypes';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import { Spinner, Toast } from '../../components/ui/Misc';

export default function MatterManagement() {
  const [loading, setLoading] = useState(true);
  const [matters, setMatters] = useState([]);
  const [stats, setStats] = useState({});
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const [m, s] = await Promise.all([
        listAllMatters(),
        getMatterStats(),
      ]);
      setMatters(m);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      setMsg(`Matter marked as ${status}.`);
    } catch (e) {
      setMsg(e.message || 'Action failed.');
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
        <p className="mt-1 text-[14.5px] text-ink-500">All cases posted by clients — view, assign, and track.</p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('failed') || msg.includes('Could not') ? 'err' : 'ok'} /></div>}

      {/* Stats - Clickable */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Link to="/admin/matters">
          <Card className="cursor-pointer p-3 text-center transition-all hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]">
            <div className="text-[11px] text-ink-500">Total</div>
            <div className="mt-1 text-[24px] font-bold">{stats.total || 0}</div>
          </Card>
        </Link>
        <Link to="/admin/matters?status=new">
          <Card className="cursor-pointer p-3 text-center transition-all hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]">
            <div className="text-[11px] text-ink-500">New</div>
            <div className="mt-1 text-[24px] font-bold text-sun-600">{stats.byStatus?.new || 0}</div>
          </Card>
        </Link>
        <Link to="/admin/matters?status=contacted">
          <Card className="cursor-pointer p-3 text-center transition-all hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]">
            <div className="text-[11px] text-ink-500">Contacted</div>
            <div className="mt-1 text-[24px] font-bold text-brand-600">{stats.byStatus?.contacted || 0}</div>
          </Card>
        </Link>
        <Link to="/admin/matters?status=converted">
          <Card className="cursor-pointer p-3 text-center transition-all hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]">
            <div className="text-[11px] text-ink-500">Completed</div>
            <div className="mt-1 text-[24px] font-bold text-emerald-600">{stats.byStatus?.converted || 0}</div>
          </Card>
        </Link>
        <Link to="/admin/matters?status=dropped">
          <Card className="cursor-pointer p-3 text-center transition-all hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]">
            <div className="text-[11px] text-ink-500">Declined</div>
            <div className="mt-1 text-[24px] font-bold text-ink-400">{stats.byStatus?.dropped || 0}</div>
          </Card>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card className="mt-6">
        <CardHeading title="Matters" sub="View all cases posted by clients." />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input placeholder="Search by client, matter, or city…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-40">
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
              className="cursor-pointer rounded-lg border border-ink-100 p-4 transition-all hover:border-brand-300 hover:bg-brand-50"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="gray">{findMatterType(m.matter_type)?.label || 'General enquiry'}</Badge>
                    <Badge
                      tone={
                        m.status === 'new' ? 'amber'
                          : m.status === 'converted' ? 'green'
                            : m.status === 'dropped' ? 'red'
                              : 'blue'
                      }
                    >
                      {m.status === 'converted' ? 'Completed' : m.status === 'dropped' ? 'Declined' : m.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-ink-900">{m.matter}</div>
                    <div className="mt-0.5 text-[12px] text-ink-500">
                      {m.client_name} · {m.city} · {new Date(m.created_at).toLocaleDateString()}
                    </div>
                    {m.description && (
                      <div className="mt-1.5 text-[13px] text-ink-600 line-clamp-2">{m.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:flex-nowrap sm:justify-end">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewing(m); }}>
                    <Eye size={14} /> View
                  </Button>
                  {m.status !== 'converted' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(m.id, 'converted');
                      }}
                    >
                      <Check size={14} /> Done
                    </Button>
                  )}
                  {m.status !== 'dropped' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(m.id, 'dropped');
                      }}
                    >
                      <X size={14} /> Decline
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(m);
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-[13px] text-ink-400">No matters found.</div>}
        </div>
      </Card>

      {/* Details Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Matter Details" width="max-w-2xl">
        {viewing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Matter</h3>
              <p className="mt-1 text-[15px] font-bold text-ink-900">{viewing.matter}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Posted by</h3>
                <p className="mt-1 text-[14px] text-ink-900">{viewing.client_name}</p>
              </div>
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Contact</h3>
                <p className="mt-1 text-[14px] text-ink-900">{viewing.phone || viewing.email || 'N/A'}</p>
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
                    {viewing.status === 'converted' ? 'Completed' : viewing.status === 'dropped' ? 'Declined' : viewing.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">City</h3>
                <p className="mt-1 text-[14px] text-ink-900">{viewing.city}</p>
              </div>
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Posted</h3>
                <p className="mt-1 text-[14px] text-ink-900">{new Date(viewing.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {viewing.description && (
              <div>
                <h3 className="text-[12px] uppercase tracking-wide text-ink-400">Description & Requirements</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{viewing.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
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
