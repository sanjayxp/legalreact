import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Pencil, Trash2, Users } from 'lucide-react';
import { listClients } from '../../lib/cms';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setClients(await listClients());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) => [c.full_name, c.email, c.phone].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [clients, search]);

  async function handleEdit(c) {
    const name = window.prompt('Full name:', c.full_name || '');
    if (name === null) return;
    const phone = window.prompt('Phone:', c.phone || '');
    if (phone === null) return;
    await supabase.from('profiles').update({ full_name: name, phone }).eq('id', c.id);
    load();
  }
  async function handleDelete(c) {
    if (!window.confirm(`Delete ${c.full_name || c.email}? This removes their profile row (auth credential purged separately).`)) return;
    if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
    await supabase.from('profiles').delete().eq('id', c.id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[24px] font-extrabold text-ink-900">Clients</h1>
        <p className="mt-1 text-[14px] text-ink-500">All registered client accounts.</p>
      </motion.div>

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
                <tr key={c.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-bold text-ink-900">{c.full_name || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{c.email}</td>
                  <td className="px-4 py-3 text-ink-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(c)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(c)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
