import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Filter, Check, X } from 'lucide-react';
import { listAllMatters, getMatterStats, updateLead } from '../../lib/cms';
import { MATTER_TYPES, findMatterType } from '../../lib/matterTypes';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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
      setMsg(`Matter ${status}.`);
    } catch (e) {
      setMsg(e.message || 'Action failed.');
    }
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Matter Management</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">All cases posted by clients — view, assign, and track.</p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('failed') ? 'err' : 'ok'} /></div>}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-5 gap-3">
        <Card className="p-3 text-center">
          <div className="text-[11px] text-ink-500">Total</div>
          <div className="mt-1 text-[24px] font-bold">{stats.total || 0}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[11px] text-ink-500">New</div>
          <div className="mt-1 text-[24px] font-bold text-sun-600">{stats.byStatus?.new || 0}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[11px] text-ink-500">Contacted</div>
          <div className="mt-1 text-[24px] font-bold text-brand-600">{stats.byStatus?.contacted || 0}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[11px] text-ink-500">Converted</div>
          <div className="mt-1 text-[24px] font-bold text-emerald-600">{stats.byStatus?.converted || 0}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[11px] text-ink-500">Dropped</div>
          <div className="mt-1 text-[24px] font-bold text-ink-400">{stats.byStatus?.dropped || 0}</div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="mt-6">
        <CardHeading title="Matters" sub="Filter by type and status." />

        <div className="mb-4 flex flex-wrap gap-3">
          <Input placeholder="Search by client, matter, or city…" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[200px] flex-1" />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40">
            <option value="">All types</option>
            {MATTER_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="dropped">Dropped</option>
          </Select>
        </div>

        <div className="space-y-2 border-t border-ink-100 pt-4">
          {filtered.map((m) => (
            <div key={m.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone="gray">{findMatterType(m.matter_type)?.label || 'General enquiry'}</Badge>
                  <Badge tone={m.status === 'new' ? 'amber' : m.status === 'converted' ? 'green' : 'gray'}>
                    {m.status}
                  </Badge>
                </div>
                <div className="mt-1">
                  <div className="font-semibold text-ink-900">{m.matter}</div>
                  <div className="text-[12px] text-ink-500">
                    {m.client_name} · {m.city} · {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex gap-2">
                {m.status !== 'converted' && (
                  <Button size="sm" variant="primary" onClick={() => handleAction(m.id, 'converted')}>
                    <Check size={14} /> Mark Done
                  </Button>
                )}
                {m.status !== 'dropped' && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(m.id, 'dropped')}>
                    <X size={14} /> Decline
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-[13px] text-ink-400">No matters found.</div>}
        </div>
      </Card>
    </AdminShell>
  );
}
