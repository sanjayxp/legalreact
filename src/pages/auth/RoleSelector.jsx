import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Gavel } from 'lucide-react';
import { getCurrentProfile, roleHomePath, hasAdvocateProfileRow, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Toast } from '../../components/ui/Misc';
import Logo from '../../components/brand/Logo';

// Shown to OAuth signups (Google / LinkedIn) who haven't picked a role yet.
// Anyone whose role is already confirmed is sent straight to their dashboard.
export default function RoleSelector() {
  const navigate = useNavigate();
  const { session, loading, refreshProfile, signOut } = useAuth();
  const [role, setRole] = useState('client');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate('/login');
      return;
    }
    (async () => {
      const profile = await getCurrentProfile();
      if (profile?.role_confirmed) {
        // Already chose (or is an email signup / admin) — nothing to ask.
        if (profile.role === 'advocate') {
          const hasProfile = await hasAdvocateProfileRow(profile.id);
          navigate(roleHomePath(profile, hasProfile));
        } else {
          navigate(roleHomePath(profile, false));
        }
        return;
      }
      setChecking(false);
    })();
  }, [session, loading, navigate]);

  // The session created by OAuth is only a real account once a role is
  // chosen — leaving this page any other way should mean walking away with
  // nothing, not staying half-signed-in. Without this, browser back just
  // bounces to /login, which immediately re-forwards here (Login.jsx redirects
  // any unconfirmed session straight back to /choose-role), trapping the user.
  async function handleNotNow() {
    setBusy(true);
    await signOut();
    navigate('/');
  }

  async function handleConfirm() {
    if (!role) return setMsg('Please select a role.');
    setBusy(true);
    try {
      const profile = await getCurrentProfile();
      if (!profile) throw new Error('Your profile could not be found. Please sign in again.');

      const { error } = await supabase
        .from('profiles')
        .update({ role, role_confirmed: true })
        .eq('id', profile.id);
      if (error) throw error;

      // RequireRole reads profile from AuthContext, not from this component's
      // local state — without this, it still sees the pre-choice snapshot
      // (role: 'client', role_confirmed: false) and bounces the navigate below
      // straight back out to the client dashboard.
      await refreshProfile();

      if (role === 'advocate') {
        navigate('/dashboard/advocate/profile?welcome=1');
      } else {
        navigate('/dashboard/client');
      }
    } catch (e) {
      setMsg(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (loading || checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-center text-[28px] font-bold text-ink-900 mb-2">What brings you here?</h1>
        <p className="text-center text-[14px] text-ink-500 mb-8">Choose how you want to use LegalConnects</p>

        <div className="space-y-4 mb-8">
          {/* Client option */}
          <button
            onClick={() => setRole('client')}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              role === 'client'
                ? 'border-brand-500 bg-brand-50'
                : 'border-ink-100 bg-white hover:border-brand-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <Briefcase size={24} className={role === 'client' ? 'text-brand-600' : 'text-ink-500'} />
              <div className="text-left">
                <h3 className="font-bold text-ink-900 mb-1">I need legal help</h3>
                <p className="text-[12px] text-ink-500">Post matters, get matched with verified advocates, book consultations</p>
              </div>
            </div>
          </button>

          {/* Advocate option */}
          <button
            onClick={() => setRole('advocate')}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              role === 'advocate'
                ? 'border-brand-500 bg-brand-50'
                : 'border-ink-100 bg-white hover:border-brand-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <Gavel size={24} className={role === 'advocate' ? 'text-brand-600' : 'text-ink-500'} />
              <div className="text-left">
                <h3 className="font-bold text-ink-900 mb-1">I'm a lawyer/advocate</h3>
                <p className="text-[12px] text-ink-500">Build your verified profile, accept cases, manage consultations</p>
              </div>
            </div>
          </button>
        </div>

        {msg && <Toast text={msg} kind="err" />}

        <Button className="w-full mb-3" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Setting up…' : 'Continue'}
        </Button>

        <button
          type="button"
          onClick={handleNotNow}
          disabled={busy}
          className="mx-auto block text-center text-[13px] font-semibold text-ink-500 hover:text-ink-700 disabled:opacity-50"
        >
          Not right now — sign out
        </button>

        <p className="mt-4 text-center text-[12px] text-ink-500">
          Advocate accounts go through Bar Council verification before going live.
        </p>
      </div>
    </div>
  );
}
