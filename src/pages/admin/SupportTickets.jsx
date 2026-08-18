import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, MessageSquare, Trash2, User } from 'lucide-react';
import { listSupportTickets, updateTicket } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Spinner, Toast } from '../../components/ui/Misc';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const PRIORITIES = { low: 'blue', normal: 'gray', high: 'sun', urgent: 'coral' };
const CATEGORIES = { technical: 'Tech Issue', billing: 'Billing', verification: 'Verification', other: 'Other' };

export default function SupportTickets() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  async function load() {
    try {
      const data = await listSupportTickets({ status: statusFilter });
      setTickets(data);
    } catch (e) {
      setMsg(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [t.user_name, t.user_email, t.title, t.description].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [tickets, priorityFilter, search]);

  async function handleStatus(id, status) {
    try {
      await updateTicket(id, { status });
      setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
      setMsg('Ticket updated.');
    } catch (e) {
      setMsg(e.message || 'Failed to update ticket.');
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
  };

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Support Tickets</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">User-reported issues and support requests.</p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('Failed') ? 'err' : 'ok'} /></div>}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatTile label="Total tickets" value={stats.total} icon={<MessageSquare size={16} />} accent="brand" />
        <StatTile label="Open" value={stats.open} icon={<AlertTriangle size={16} />} accent="coral" />
        <StatTile label="Urgent" value={stats.urgent} icon={<Clock size={16} />} accent="sun" />
      </div>

      <Card className="mt-6">
        <CardHeading title="Tickets" sub="Filter by status and priority to find urgent issues." />

        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Input placeholder="Search by name, email, or title…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        </div>

        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone={PRIORITIES[t.priority]}>{t.priority}</Badge>
                  <Badge tone="gray">{CATEGORIES[t.category] || t.category}</Badge>
                  <span className="text-[13px] font-semibold text-ink-900">{t.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[12px] text-ink-500">
                  <User size={12} /> {t.user_name} ({t.user_email})
                </div>
                {t.resolution_notes && (
                  <div className="mt-1.5 text-[12px] text-ink-600">
                    <span className="font-semibold">Resolution:</span> {t.resolution_notes}
                  </div>
                )}
              </div>
              <div className="ml-4 flex items-center gap-2">
                <Select value={t.status} onChange={(e) => handleStatus(t.id, e.target.value)} className="text-[12px]">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
                <button onClick={() => setSelectedTicket(t)} className="text-ink-400 hover:text-ink-600">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-[13px] text-ink-400">No tickets found.</div>}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg rounded-2xl border border-ink-100 bg-white p-6 shadow-lg">
            <h2 className="font-heading text-[19px] font-bold text-ink-900">{selectedTicket.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={PRIORITIES[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
              <Badge tone="gray">{CATEGORIES[selectedTicket.category]}</Badge>
              <Badge tone={selectedTicket.status === 'resolved' ? 'green' : 'amber'}>{selectedTicket.status}</Badge>
            </div>
            <div className="mt-4 text-[13.5px] text-ink-700">{selectedTicket.description}</div>
            <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-[12px] text-ink-600">
              <div><strong>From:</strong> {selectedTicket.user_name} ({selectedTicket.user_email})</div>
              <div><strong>Category:</strong> {CATEGORIES[selectedTicket.category]}</div>
              <div><strong>Reported:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedTicket(null)}>Close</Button>
              <Button className="flex-1" onClick={() => handleStatus(selectedTicket.id, 'resolved')}>Mark Resolved</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminShell>
  );
}
