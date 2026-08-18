import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, User, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import { listAuditLog } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/Misc';

const ACTION_ICONS = {
  approve_advocate: CheckCircle2,
  reject_advocate: XCircle,
  assign_lead: Edit3,
  update_lead: Edit3,
};

const ACTION_TONES = {
  approve_advocate: 'green',
  reject_advocate: 'coral',
  assign_lead: 'brand',
  update_lead: 'brand',
};

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  async function load() {
    try {
      const data = await listAuditLog(100);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return [l.admin_email, l.action, l.notes].filter(Boolean).join(' ').toLowerCase().includes(s);
  });

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Audit Log</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Track all admin actions and changes.</p>
      </motion.div>

      <Card className="mt-6">
        <CardHeading title="Activity Log" sub="Recent admin actions in chronological order." />

        <div className="mb-4">
          <Input placeholder="Search by admin email or action…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="space-y-1 border-t border-ink-100">
          {filtered.map((l) => {
            const ActionIcon = ACTION_ICONS[l.action] || History;
            const tone = ACTION_TONES[l.action] || 'gray';
            return (
              <div key={l.id} className="flex items-start gap-3 border-b border-ink-50 py-3 last:border-0">
                <ActionIcon size={16} className="mt-0.5 text-ink-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone}>{l.action.replace(/_/g, ' ')}</Badge>
                    <span className="text-[12px] font-semibold text-ink-700">{l.admin_email}</span>
                  </div>
                  {l.notes && <div className="mt-1 text-[12px] text-ink-600">{l.notes}</div>}
                  {l.changes && (
                    <div className="mt-1 text-[11px] font-mono text-ink-500">
                      Changed: {JSON.stringify(l.changes).slice(0, 100)}...
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-ink-400">
                    {new Date(l.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="py-6 text-center text-[13px] text-ink-400">No activities found.</div>}
        </div>
      </Card>
    </AdminShell>
  );
}
