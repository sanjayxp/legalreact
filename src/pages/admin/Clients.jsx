import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Pencil, Trash2, Users, Mail, Phone, Calendar } from 'lucide-react';
import { listClients, adminDeleteUserAccount } from '../../lib/cms';
import { useLiveRefresh } from '../../lib/realtime';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Label } from '../../components/ui/Field';
import { Avatar, EmptyState, Spinner, Toast } from '../../components/ui/Misc';

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');

  // Doesn't toggle `loading` back to true on its own — this also runs on
  // every live update, and flashing the whole table to a spinner mid-session
  // (e.g. right after another tab deletes someone) would be jarring.
  async function load() {
    setClients(await listClients());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useLiveRefresh('admin-clients-live', [{ table: 'profiles' }], load);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) => [c.full_name, c.email, c.phone].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [clients, search]);

  async function handleSaveEdit(fields) {
    await supabase.from('profiles').update(fields).eq('id', editing.id);
    setEditing(null);
    load();
  }
  async function handleDelete() {
    setDeleting(true);
    try {
      await adminDeleteUserAccount(deleteTarget.id);
      setDeleteTarget(null);
      setViewing(null);
      load();
    } catch (e) {
      setErr(e.message || 'Could not delete that account.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Clients</h1>
        <p className="mt-1 text-[14px] text-ink-500">All registered client accounts.</p>
      </motion.div>

      {err && <div className="mt-4"><Toast text={err} kind="err" /></div>}

      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <Input className="pl-9" placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="mt-4 overflow-x-auto !p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No clients found" />
        ) : (
          <table className="w-full min-w-[700px] text-[13px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11.5px] font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Signed up</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-ink-50/60" onClick={() => setViewing(c)}>
                  <td className="px-4 py-3 font-bold text-ink-900">{c.full_name || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{c.email}</td>
                  <td className="px-4 py-3 text-ink-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEditing(c)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Client details">
        {viewing && (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={viewing.full_name || viewing.email} size={56} />
              <div>
                <div className="text-[16px] font-extrabold text-ink-900">{viewing.full_name || '—'}</div>
                <div className="text-[13px] text-ink-500">Client since {new Date(viewing.created_at).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            <div className="mt-5 space-y-3 rounded-xl bg-ink-50 p-4">
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Mail size={15} className="text-ink-400" /> {viewing.email || '—'}</div>
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Phone size={15} className="text-ink-400" /> {viewing.phone || '—'}</div>
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Calendar size={15} className="text-ink-400" /> Joined {new Date(viewing.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setEditing(viewing); setViewing(null); }}><Pencil size={14} /> Edit</Button>
              <Button variant="danger" onClick={() => setDeleteTarget(viewing)}><Trash2 size={14} /> Delete</Button>
            </div>
          </>
        )}
      </Modal>

      <ClientEditModal client={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this client?"
        message={`This removes ${deleteTarget?.full_name || deleteTarget?.email}'s login along with their profile, questions and bookings. They will not be able to sign in again. This can't be undone.`}
      />
    </>
  );
}

function ClientEditModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({ full_name: '', phone: '' });
  useEffect(() => { setForm({ full_name: client?.full_name || '', phone: client?.phone || '' }); }, [client]);
  if (!client) return null;

  return (
    <Modal open={!!client} onClose={onClose} title={`Edit — ${client.full_name || client.email}`}>
      <Label>Full name</Label>
      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <Label>Phone</Label>
      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save changes</Button>
      </div>
    </Modal>
  );
}
