import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Trash2, Users, IndianRupee } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import {
  listMyClients,
  addClient,
  updateClient,
  deleteClient,
  listClientCases,
  listClientUpdates,
  listMyInvoices,
  addInvoice,
  setInvoiceStatus,
} from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card, { CardHeading } from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import { Input, Label, Select } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/Misc';

export default function ClientsBilling() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedData, setExpandedData] = useState({ cases: [], updates: [] });

  const [cForm, setCForm] = useState({ full_name: '', phone: '', email: '' });
  const [iForm, setIForm] = useState({ client_id: '', description: '', amount: '' });

  async function load() {
    setLoading(true);
    const [cl, inv] = await Promise.all([listMyClients(user.id), listMyInvoices(user.id)]);
    setClients(cl);
    setInvoices(inv);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const [cases, updates] = await Promise.all([listClientCases(user.id, id), listClientUpdates(id)]);
    setExpandedData({ cases, updates });
  }

  async function handleAddClient() {
    if (!cForm.full_name.trim()) return;
    await addClient(user.id, cForm);
    setCForm({ full_name: '', phone: '', email: '' });
    load();
  }
  async function handleDeleteClient(id) {
    await deleteClient(id);
    load();
  }
  async function handleAddInvoice() {
    const amt = parseFloat(iForm.amount);
    if (!iForm.client_id || !iForm.description.trim() || !(amt > 0)) return;
    await addInvoice(user.id, { client_id: iForm.client_id, description: iForm.description, amount: amt, status: 'unpaid', issued_on: new Date().toISOString().slice(0, 10) });
    setIForm({ client_id: '', description: '', amount: '' });
    load();
  }
  async function markPaid(id) {
    await setInvoiceStatus(id, 'paid');
    load();
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const live = invoices.filter((i) => i.status !== 'cancelled');
  const paid = live.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const total = live.reduce((s, i) => s + Number(i.amount), 0);
  const due = total - paid;
  const clientDue = (cid) => invoices.filter((i) => i.client_id === cid && i.status === 'unpaid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Clients &amp; billing</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Your private client register, fee tracking, and update history.</p>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Clients" value={clients.length} icon={<Users size={16} />} accent="brand" />
        <StatTile label="Billed" value={`₹${total.toLocaleString('en-IN')}`} icon={<IndianRupee size={16} />} accent="sun" />
        <StatTile label="Received" value={`₹${paid.toLocaleString('en-IN')}`} icon={<IndianRupee size={16} />} accent="green" />
        <StatTile label="Outstanding" value={`₹${due.toLocaleString('en-IN')}`} icon={<IndianRupee size={16} />} accent="coral" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {clients.length === 0 && <EmptyState icon={<Users size={28} />} title="No clients yet" sub="Add your first client to start tracking cases and fees." />}
          {clients.map((c) => {
            const d = clientDue(c.id);
            return (
              <Card key={c.id} className="!p-0 overflow-hidden">
                <button onClick={() => toggleExpand(c.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <div>
                    <div className="text-[14.5px] font-bold text-ink-900">{c.full_name}</div>
                    <div className="text-[12.5px] text-ink-500">{c.phone} {c.email ? `· ${c.email}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {d > 0 && <Badge tone="amber">₹{d.toLocaleString('en-IN')} due</Badge>}
                    {expanded === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {expanded === c.id && (
                  <div className="border-t border-ink-100 bg-ink-50/50 p-4">
                    <div className="mb-3 text-[12px] font-bold uppercase text-ink-400">Linked cases</div>
                    {expandedData.cases.length === 0 && <div className="mb-3 text-[13px] text-ink-400">None linked yet.</div>}
                    {expandedData.cases.map((cs) => (
                      <div key={cs.id} className="mb-1.5 text-[13px] text-ink-700">{cs.case_title} {cs.stage && `· ${cs.stage}`}</div>
                    ))}
                    <div className="mb-2 mt-4 text-[12px] font-bold uppercase text-ink-400">Recent updates</div>
                    {expandedData.updates.length === 0 && <div className="text-[13px] text-ink-400">No updates sent yet.</div>}
                    {expandedData.updates.map((u) => (
                      <div key={u.id} className="mb-1.5 text-[12.5px] text-ink-600">{new Date(u.sent_at).toLocaleDateString('en-IN')} — {u.message}</div>
                    ))}
                    <button onClick={() => handleDeleteClient(c.id)} className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-coral-500">
                      <Trash2 size={13} /> Delete client
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeading title="Add a client" />
            <Label required>Full name</Label>
            <Input value={cForm.full_name} onChange={(e) => setCForm({ ...cForm, full_name: e.target.value })} />
            <Label>Phone</Label>
            <Input value={cForm.phone} onChange={(e) => setCForm({ ...cForm, phone: e.target.value })} />
            <Label>Email</Label>
            <Input value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })} />
            <Button size="sm" className="mt-3 w-full" onClick={handleAddClient}><Plus size={14} /> Add client</Button>
          </Card>

          <Card>
            <CardHeading title="Raise an invoice" />
            <Label required>Client</Label>
            <Select value={iForm.client_id} onChange={(e) => setIForm({ ...iForm, client_id: e.target.value })}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
            <Label required>Description</Label>
            <Input value={iForm.description} onChange={(e) => setIForm({ ...iForm, description: e.target.value })} placeholder="e.g. Consultation fee" />
            <Label required>Amount (₹)</Label>
            <Input type="number" min="1" value={iForm.amount} onChange={(e) => setIForm({ ...iForm, amount: e.target.value })} />
            <Button size="sm" className="mt-3 w-full" onClick={handleAddInvoice}>Raise invoice</Button>
          </Card>

          <Card>
            <CardHeading title="Invoices" />
            <div className="max-h-72 space-y-2 overflow-y-auto scrollbar-thin">
              {invoices.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[12.5px]">
                  <div>
                    <div className="font-semibold text-ink-800">{i.advocate_clients?.full_name}</div>
                    <div className="text-ink-500">{i.description} · ₹{Number(i.amount).toLocaleString('en-IN')}</div>
                  </div>
                  {i.status === 'unpaid' ? (
                    <button onClick={() => markPaid(i.id)} className="font-bold text-brand-600">Mark paid</button>
                  ) : (
                    <Badge tone={i.status === 'paid' ? 'green' : 'gray'}>{i.status}</Badge>
                  )}
                </div>
              ))}
              {invoices.length === 0 && <div className="text-[13px] text-ink-400">No invoices yet.</div>}
            </div>
          </Card>
        </div>
      </div>
    </AdvocateShell>
  );
}
