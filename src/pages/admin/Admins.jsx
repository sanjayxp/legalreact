import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Mail, Phone, Calendar, UserMinus } from 'lucide-react';
import {
  listAdmins,
  findProfileByEmail,
  promoteToAdmin,
  listAdminPermissions,
  grantAdminSection,
  revokeAdminSection,
  demoteAdmin,
  ADMIN_SECTIONS,
} from '../../lib/cms';
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
  const [permissions, setPermissions] = useState([]); // all admin_permissions rows
  const [email, setEmail] = useState('');
  const [found, setFound] = useState(null);
  const [msg, setMsg] = useState('');
  const [searching, setSearching] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [busySection, setBusySection] = useState(null); // `${adminId}:${section}` while toggling

  async function load() {
    setLoading(true);
    const [a, p] = await Promise.all([listAdmins(), listAdminPermissions()]);
    setAdmins(a);
    setPermissions(p);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const sectionsFor = (adminId) => new Set(permissions.filter((p) => p.admin_id === adminId).map((p) => p.section));

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
    if (!window.confirm('Promote this account to admin? They will start with no section access — grant it below once promoted.')) return;
    await promoteToAdmin(id);
    setFound(null);
    setEmail('');
    load();
  }
  async function toggleSection(adminId, section, hasIt) {
    const key = `${adminId}:${section}`;
    setBusySection(key);
    try {
      if (hasIt) await revokeAdminSection(adminId, section);
      else await grantAdminSection(adminId, section, user.id);
      await load();
    } finally {
      setBusySection(null);
    }
  }
  async function handleDemote(id, name) {
    if (!window.confirm(`Remove admin access for ${name}? They'll drop back to a regular client account and lose every granted section immediately.`)) return;
    await demoteAdmin(id);
    setViewing(null);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Admins</h1>
        <p className="mt-1 text-[14px] text-ink-500">Manage admin accounts and what each one can access.</p>
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
        <h2 className="mb-1 text-[14px] font-bold text-ink-900">Current admins</h2>
        <p className="mb-3 text-[12.5px] text-ink-400">Super admins have full access to everything. Delegated admins only see the sections checked below — untick a box to withdraw that access instantly.</p>
        <div className="space-y-3">
          {admins.map((a) => {
            const mine = a.id === user?.id;
            const sections = sectionsFor(a.id);
            return (
              <div key={a.id} className="rounded-lg border border-ink-100 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button onClick={() => setViewing(a)} className="flex items-center gap-2.5 text-left">
                    <Avatar name={a.full_name || a.email} size={32} />
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink-800">
                        {a.full_name || a.email} {mine && <span className="text-ink-400">(you)</span>}
                      </div>
                      <div className="text-[11.5px] text-ink-400">joined {new Date(a.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </button>
                  {a.is_super_admin ? (
                    <Badge tone="blue">Super admin</Badge>
                  ) : (
                    <Badge tone="gray">Delegated</Badge>
                  )}
                </div>

                {!a.is_super_admin && (
                  <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-ink-50 pt-3">
                    {ADMIN_SECTIONS.map((s) => {
                      const has = sections.has(s.key);
                      const key = `${a.id}:${s.key}`;
                      return (
                        <label key={s.key} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-700">
                          <input
                            type="checkbox"
                            className="accent-brand-500"
                            checked={has}
                            disabled={busySection === key}
                            onChange={() => toggleSection(a.id, s.key, has)}
                          />
                          {s.label}
                        </label>
                      );
                    })}
                    {!mine && (
                      <button onClick={() => handleDemote(a.id, a.full_name || a.email)} className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-coral-500 hover:text-coral-600">
                        <UserMinus size={13} /> Remove admin access
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
                <Badge tone={viewing.is_super_admin ? 'blue' : 'gray'}>{viewing.is_super_admin ? 'Super admin' : 'Delegated admin'}</Badge>
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
