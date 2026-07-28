import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { listAdmins, findProfileByEmail, promoteToAdmin } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import { Avatar, Spinner, Toast } from '../../components/ui/Misc';

export default function Admins() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [found, setFound] = useState(null);
  const [msg, setMsg] = useState('');
  const [searching, setSearching] = useState(false);
  const [viewing, setViewing] = useState(null);

  async function load() {
    setLoading(true);
    setAdmins(await listAdmins());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleFind() {
    if (!email.trim()) return;
    setSearching(true);
    setMsg('');
    setFound(null);
    try {
      const p = await findProfileByEmail(email);
      if (!p) setMsg('No account found with that email.');
      else setFound(p);
    } finally {
      setSearching(false);
    }
  }
  async function handlePromote(id) {
    if (!window.confirm('Promote this account to admin? This cannot be undone from here.')) return;
    await promoteToAdmin(id);
    setFound(null);
    setEmail('');
    load();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Admins</h1>
        <p className="mt-1 text-[14px] text-ink-500">Manage admin accounts.</p>
      </motion.div>

      <Card className="mt-5">
        <h2 className="mb-3 text-[14px] font-bold text-ink-900">Promote an account</h2>
        <div className="flex gap-2">
          <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleFind()} />
          <Button onClick={handleFind} disabled={searching}><Search size={14} /> Find</Button>
        </div>
        {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}
        {found && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-ink-100 p-3.5">
            <div>
              <div className="font-bold text-ink-900">{found.full_name || found.email}</div>
              <div className="text-[12.5px] text-ink-500">{found.email} · registered {new Date(found.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            {found.role === 'admin' ? (
              <Badge tone="blue">Already admin</Badge>
            ) : (
              <Button size="sm" onClick={() => handlePromote(found.id)}><ShieldCheck size={14} /> Promote to admin</Button>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-5">
        <h2 className="mb-3 text-[14px] font-bold text-ink-900">Current admins</h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <button
              key={a.id}
              onClick={() => setViewing(a)}
              className="flex w-full items-center justify-between rounded-lg bg-ink-50 px-3.5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-brand-50"
            >
              <div className="font-semibold text-ink-800">
                {a.full_name || a.email} {a.id === user?.id && <span className="text-ink-400">(you)</span>}
              </div>
              <div className="text-ink-400">joined {new Date(a.created_at).toLocaleDateString('en-IN')}</div>
            </button>
          ))}
        </div>
      </Card>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Admin details">
        {viewing && (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={viewing.full_name || viewing.email} size={56} />
              <div>
                <div className="text-[16px] font-extrabold text-ink-900">
                  {viewing.full_name || '—'} {viewing.id === user?.id && <span className="text-ink-400">(you)</span>}
                </div>
                <Badge tone="blue">Admin</Badge>
              </div>
            </div>
            <div className="mt-5 space-y-3 rounded-xl bg-ink-50 p-4">
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Mail size={15} className="text-ink-400" /> {viewing.email || '—'}</div>
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Phone size={15} className="text-ink-400" /> {viewing.phone || '—'}</div>
              <div className="flex items-center gap-2.5 text-[13.5px] text-ink-800"><Calendar size={15} className="text-ink-400" /> Joined {new Date(viewing.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
