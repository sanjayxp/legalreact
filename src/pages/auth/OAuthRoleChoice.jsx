import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Gavel } from 'lucide-react';
import { oauthLogin } from '../../lib/auth';
import Button from '../../components/ui/Button';
import { Toast } from '../../components/ui/Misc';
import Logo from '../../components/brand/Logo';

const PROVIDER_LABEL = { google: 'Google', linkedin_oidc: 'LinkedIn' };

// Reached by clicking "Continue with Google/LinkedIn" on /login — asks for
// a role BEFORE the OAuth redirect fires, so the account is created with
// the role already decided instead of arriving as an unconfirmed placeholder.
export default function OAuthRoleChoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const provider = location.state?.provider;
  const [role, setRole] = useState('client');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Only reachable by clicking through from /login (provider travels via
  // router state, not the URL) — a direct visit or refresh has nothing to
  // continue with, so send them back rather than showing a broken picker.
  if (!provider) {
    navigate('/login', { replace: true });
    return null;
  }

  async function handleContinue() {
    setBusy(true);
    try {
      await oauthLogin(provider, role);
    } catch (e) {
      setMsg(e.message || 'Could not start sign-in. Please try again.');
      setBusy(false);
    }
  }

  const providerLabel = PROVIDER_LABEL[provider] || 'your account';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-center text-[28px] font-bold text-ink-900 mb-2">What brings you here?</h1>
        <p className="text-center text-[14px] text-ink-500 mb-8">
          Choose how you'll use LegalConnects, then continue with {providerLabel}.
        </p>

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

        <Button className="w-full mb-3" onClick={handleContinue} disabled={busy}>
          {busy ? 'Redirecting…' : `Continue with ${providerLabel}`}
        </Button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          disabled={busy}
          className="mx-auto block text-center text-[13px] font-semibold text-ink-500 hover:text-ink-700 disabled:opacity-50"
        >
          Back
        </button>

        <p className="mt-4 text-center text-[12px] text-ink-500">
          Advocate accounts go through Bar Council verification before going live.
        </p>
      </div>
    </div>
  );
}
