import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Gavel } from 'lucide-react';
import { getCurrentProfile, useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Toast } from '../../components/ui/Misc';
import Logo from '../../components/brand/Logo';

export default function RoleSelector() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [role, setRole] = useState('client');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    // Check if user already has a role set (not 'client' default)
    (async () => {
      const profile = await getCurrentProfile();
      if (profile && profile.role !== 'client') {
        // Already chose a role, send to home
        if (profile.role === 'advocate') {
          navigate('/dashboard/advocate/profile?welcome=1');
        } else if (profile.role === 'client') {
          navigate('/dashboard/client');
        }
      }
    })();
  }, [session, navigate]);

  async function handleConfirm() {
    if (!role) return setMsg('Please select a role.');
    setBusy(true);
    try {
      const profile = await getCurrentProfile();
      if (!profile) throw new Error('Profile not found');

      if (role !== 'client') {
        await supabase.from('profiles').update({ role }).eq('id', profile.id);
      }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-center text-[28px] font-bold text-ink-900 mb-2">What brings you here?</h1>
        <p className="text-center text-[14px] text-ink-500 mb-8">Choose your role to get started</p>

        <div className="space-y-4 mb-8">
          {/* Client Option */}
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

          {/* Advocate Option */}
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

        <Button className="w-full mb-4" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Setting up...' : 'Continue'}
        </Button>

        <p className="text-center text-[12px] text-ink-500">
          You can change this later in your settings.
        </p>
      </div>
    </div>
  );
}
