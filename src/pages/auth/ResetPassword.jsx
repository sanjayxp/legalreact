import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { setNewPassword } from '../../lib/auth';
import Logo from '../../components/brand/Logo';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Field';
import { Toast, Spinner } from '../../components/ui/Misc';

// Where the recovery link lands. Supabase puts the visitor in a temporary
// session first, so there is no old password to prove here — but that session
// only exists if they arrived through the emailed link.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // The link carries its tokens in the URL fragment; supabase-js reads them
    // and fires RECOVERY, so both a ready session and the event are accepted.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSave() {
    if (pass.length < 8) return setMsg('Use at least 8 characters.');
    if (pass !== confirm) return setMsg('The two passwords do not match.');
    setBusy(true);
    setMsg('');
    try {
      await setNewPassword(pass);
      setDone(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (e) {
      setMsg(e.message || 'Could not set your new password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center px-5 sm:px-8">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            {!ready ? (
              <Spinner />
            ) : done ? (
              <div className="py-4 text-center">
                <CheckCircle2 size={34} className="mx-auto text-emerald-600" />
                <h1 className="mt-3 text-[19px] font-extrabold text-ink-900">Password changed</h1>
                <p className="mt-1.5 text-[14px] text-ink-500">Taking you to the login page…</p>
              </div>
            ) : !hasSession ? (
              <div className="py-2">
                <h1 className="text-[19px] font-extrabold text-ink-900">This link has expired</h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                  Recovery links can only be used once, and they stop working after a while. Ask for a
                  fresh one and use the newest email.
                </p>
                <Link to="/login">
                  <Button className="mt-5 w-full">Back to login</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <KeyRound size={17} />
                  </span>
                  <h1 className="text-[19px] font-extrabold text-ink-900">Choose a new password</h1>
                </div>

                <div className="mt-5">
                  <Label htmlFor="rp-new" required>New password</Label>
                  <Input
                    id="rp-new"
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <Label htmlFor="rp-confirm" required>Confirm new password</Label>
                  <Input
                    id="rp-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoComplete="new-password"
                  />
                </div>

                {msg && <div className="mt-3"><Toast text={msg} kind="err" /></div>}

                <Button className="mt-5 w-full" onClick={handleSave} disabled={busy}>
                  {busy ? 'Saving…' : 'Save new password'}
                </Button>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
