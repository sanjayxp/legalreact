import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { loginUser, getCurrentProfile, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Label } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Toast } from '../../components/ui/Misc';
import Logo from '../../components/brand/Logo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const p = await getCurrentProfile();
      if (p?.role === 'admin') navigate('/admin');
    })();
  }, [session, navigate]);

  async function handleSubmit() {
    if (!email.trim() || !pass) return setMsg('Enter your email and password.');
    setBusy(true);
    setMsg('');
    try {
      await loginUser({ email: email.trim(), password: pass });
      const p = await getCurrentProfile();
      if (!p || p.role !== 'admin') {
        await supabase.auth.signOut();
        setMsg('This account does not have admin access.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setMsg(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo dark size="lg" />
          <h1 className="mt-4 font-heading text-[19px] font-semibold text-white">Admin console</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/50">
            <ShieldCheck size={13} /> Restricted area — admin accounts only
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <Label>
            <span className="text-white/70">Email</span>
          </Label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14.5px] text-white outline-none placeholder:text-white/30 focus:border-brand-400"
            placeholder="admin@legalconnects.in"
          />
          <div className="mt-3.5">
            <span className="mb-1.5 block text-[12.5px] font-bold text-white/70">Password</span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14.5px] text-white outline-none placeholder:text-white/30 focus:border-brand-400"
              placeholder="••••••••"
            />
          </div>
          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Admin'}
          </Button>
          {msg && <div className="mt-4"><Toast text={msg} kind="err" /></div>}
        </div>

        <div className="mt-5 flex justify-center gap-4 text-[12.5px] text-white/40">
          <Link to="/login" className="hover:text-white/70">← Normal login</Link>
          <span>·</span>
          <Link to="/" className="hover:text-white/70">Public site</Link>
        </div>
      </motion.div>
    </div>
  );
}
