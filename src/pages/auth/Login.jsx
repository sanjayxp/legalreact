import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Gavel, ArrowRight, BadgeCheck } from 'lucide-react';
import {
  loginUser,
  registerUser,
  oauthLogin,
  getCurrentProfile,
  hasAdvocateProfileRow,
  roleHomePath,
  useAuth,
} from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Field';
import { Toast } from '../../components/ui/Misc';
import Logo from '../../components/brand/Logo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // Carried over from the public "Post your matter" flow — never in the
  // URL, just router state, so no PII ends up in the address bar or history.
  const prefill = location.state?.prefill;

  const [mode, setMode] = useState(location.hash === '#register' || prefill ? 'reg' : 'login');
  const [role, setRole] = useState('client');
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('err');
  const [busy, setBusy] = useState(false);

  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [rgName, setRgName] = useState(prefill?.fullName || '');
  const [rgEmail, setRgEmail] = useState(prefill?.email || '');
  const [rgPhone, setRgPhone] = useState(prefill?.phone || '');
  const [rgPass, setRgPass] = useState('');
  const [consent, setConsent] = useState(false);

  const say = (text, kind = 'err') => {
    setMsg(text);
    setMsgKind(kind);
  };

  async function goToRoleHome() {
    const profile = await getCurrentProfile();
    if (!profile) return navigate('/login');
    // Admins land in the admin console. Never sign them out here — this page
    // reacts to any session change (including ones started in another tab, via
    // onAuthStateChange), and supabase.auth.signOut() defaults to global scope,
    // so doing that killed the session the admin console had just created.
    if (profile.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (profile.role === 'advocate') {
      const hasProfile = await hasAdvocateProfileRow(profile.id);
      navigate(roleHomePath(profile, hasProfile));
      return;
    }
    navigate(roleHomePath(profile, false));
  }

  // Returning session (normal revisit or OAuth redirect back)
  useEffect(() => {
    if (!session) return;
    (async () => {
      const intent = localStorage.getItem('lc_role_intent');
      localStorage.removeItem('lc_role_intent');
      if (intent === 'advocate') {
        const profile = await getCurrentProfile();
        if (profile && profile.role === 'client') {
          await supabase.from('profiles').update({ role: 'advocate' }).eq('id', profile.id);
        }
      }
      goToRoleHome();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleLogin() {
    if (!liEmail.trim() || !liPass) return say('Enter your email and password.');
    setBusy(true);
    try {
      await loginUser({ email: liEmail.trim(), password: liPass });
      await goToRoleHome();
    } catch (err) {
      say(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    if (!rgName.trim() || !rgEmail.trim()) return say('Please fill in your name and email.');
    if (rgPass.length < 8) return say('Password needs at least 8 characters.');
    if (!consent) return say('Please accept the terms to continue.');
    setBusy(true);
    try {
      const data = await registerUser({ fullName: rgName.trim(), email: rgEmail.trim(), password: rgPass, role, phone: rgPhone.trim() });
      if (data.session) {
        await goToRoleHome();
      } else {
        say('Account created! Check your email for a confirmation link, then log in.', 'ok');
      }
    } catch (err) {
      say(err.message?.includes('already registered') ? 'This email is already registered — use the Log in tab instead.' : err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider, fromRegister) {
    try {
      await oauthLogin(provider, fromRegister ? role : null);
    } catch (err) {
      say(err.message?.includes('not enabled') ? 'This sign-in method is not enabled yet — use email and password for now.' : err.message || 'Could not start social sign-in.');
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Height, width, padding and logo size all match PublicNav, so the mark
          sits in the same place here as on every other page. */}
      <header className="border-b border-ink-100">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center px-5 sm:px-8">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:py-16">
        {/* Left — hero */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="hidden lg:block">
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-50 via-white to-brand-50 p-10">
            <h1 className="font-heading text-[39px] font-extrabold leading-[1.1] text-ink-900">
              Legal Help
              <br />
              <span className="text-brand-500">Beyond Borders</span>
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-500">
              Connect with Bar Council-verified advocates across India. Ask questions, book consultations, and track your case — all in one place.
            </p>

            <div className="relative mt-10 h-80">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="gradient-coral blob-shape absolute left-0 top-6 h-56 w-48 overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=400&q=80"
                  alt="Advocate at work"
                  className="h-full w-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 6 }}
                animate={{ opacity: 1, scale: 1, rotate: 6 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="gradient-sun blob-shape-2 absolute bottom-0 right-2 h-64 w-52 overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80"
                  alt="Client consultation"
                  className="h-full w-full object-cover"
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute left-24 top-40 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-lg"
              >
                <BadgeCheck size={16} className="text-brand-500" />
                <span className="text-[12.5px] font-bold text-ink-800">Bar Council Verified</span>
              </motion.div>
            </div>

            <div className="mt-8 flex items-center gap-8">
              <div>
                <div className="font-heading text-[22px] font-extrabold text-ink-900">Free</div>
                <div className="text-[12px] text-ink-400">To ask a question</div>
              </div>
              <div>
                <div className="font-heading text-[22px] font-extrabold text-ink-900">Verified</div>
                <div className="text-[12px] text-ink-400">Bar Council checked</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right — form card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-ink-100 bg-white p-7 shadow-[var(--shadow-card)]">
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1">
              <button
                onClick={() => { setMode('login'); setMsg(''); }}
                className={`rounded-lg py-2.5 text-[14px] font-bold transition-colors ${mode === 'login' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}
              >
                Log in
              </button>
              <button
                onClick={() => { setMode('reg'); setMsg(''); }}
                className={`rounded-lg py-2.5 text-[14px] font-bold transition-colors ${mode === 'reg' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400'}`}
              >
                Create account
              </button>
            </div>

            <div>
              {mode === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                  <h2 className="text-[18px] font-bold text-ink-900">Welcome back</h2>
                  <p className="mt-0.5 text-[13.5px] text-ink-500">Log in to your LegalConnects account.</p>

                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" value={liEmail} onChange={(e) => setLiEmail(e.target.value)} />
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={liPass}
                    onChange={(e) => setLiPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <Button className="mt-5 w-full" onClick={handleLogin} disabled={busy}>
                    {busy ? 'Please wait…' : 'Log in'} <ArrowRight size={16} />
                  </Button>

                  <Divider text="or continue with" />
                  <OAuthButtons onGoogle={() => handleOAuth('google')} onLinkedIn={() => handleOAuth('linkedin_oidc')} />

                  <p className="mt-4 text-center text-[13px] text-ink-500">
                    New to LegalConnects?{' '}
                    <button className="font-bold text-brand-600" onClick={() => setMode('reg')}>
                      Create an account
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="reg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                  <h2 className="text-[18px] font-bold text-ink-900">Create your account</h2>
                  <p className="mt-0.5 text-[13.5px] text-ink-500">Free to join. No credit card required.</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <RoleTab active={role === 'client'} onClick={() => setRole('client')} icon={<Briefcase size={18} />} label="I need legal help" />
                    <RoleTab active={role === 'advocate'} onClick={() => setRole('advocate')} icon={<Gavel size={18} />} label="I'm an advocate" />
                  </div>

                  <Label>Full name</Label>
                  <Input placeholder="As on Bar Council / Aadhaar" autoComplete="name" value={rgName} onChange={(e) => setRgName(e.target.value)} />
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" autoComplete="email" value={rgEmail} onChange={(e) => setRgEmail(e.target.value)} />
                  <Label hint="(optional)">Mobile</Label>
                  <Input type="tel" placeholder="+91" autoComplete="tel" value={rgPhone} onChange={(e) => setRgPhone(e.target.value)} />
                  <Label>Password</Label>
                  <Input type="password" placeholder="Minimum 8 characters" autoComplete="new-password" value={rgPass} onChange={(e) => setRgPass(e.target.value)} />

                  <label className="mt-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-500">
                    <input type="checkbox" className="mt-0.5 accent-brand-500" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    I agree to the Terms of Service and Privacy Policy, and consent to my data being processed to provide this service (DPDP Act 2023).
                  </label>

                  <Button className="mt-5 w-full" onClick={handleRegister} disabled={busy}>
                    {busy ? 'Please wait…' : 'Create Account'}
                  </Button>

                  <Divider text="or sign up with" />
                  <OAuthButtons onGoogle={() => handleOAuth('google', true)} onLinkedIn={() => handleOAuth('linkedin_oidc', true)} />
                  <p className="mt-2 text-center text-[11.5px] text-ink-400">
                    Signing up as: <b className="text-ink-700">{role}</b> — pick your role above first.
                  </p>

                  <p className="mt-4 text-center text-[13px] text-ink-500">
                    Already have an account?{' '}
                    <button className="font-bold text-brand-600" onClick={() => setMode('login')}>
                      Log in
                    </button>
                  </p>
                </motion.div>
              )}
            </div>

            {msg && <div className="mt-4"><Toast text={msg} kind={msgKind} /></div>}
            <p className="mt-4 text-center text-[11.5px] text-ink-300">Advocate profiles go live after Bar Council verification.</p>
          </div>
          <p className="mt-4 text-center text-[12.5px] text-ink-400">
            Admin?{' '}
            <Link to="/admin/login" className="font-semibold text-ink-600 underline">
              Sign in at the admin console
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function RoleTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-1.5 px-2 py-3 text-center text-[12.5px] font-semibold transition-colors ${
        active ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500'
      }`}
      style={{ borderWidth: 1.5 }}
    >
      {icon}
      {label}
    </button>
  );
}

function Divider({ text }) {
  return (
    <div className="my-4 flex items-center gap-3 text-[11.5px] text-ink-300">
      <div className="h-px flex-1 bg-ink-100" />
      {text}
      <div className="h-px flex-1 bg-ink-100" />
    </div>
  );
}

function OAuthButtons({ onGoogle, onLinkedIn }) {
  return (
    <div className="space-y-2">
      <button onClick={onGoogle} className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink-100 bg-white py-2.5 text-[14px] font-semibold text-ink-800 hover:border-brand-300 hover:bg-brand-50">
        <span className="font-extrabold" style={{ background: 'conic-gradient(from -45deg,#ea4335 110deg,#4285f4 90deg 180deg,#34a853 180deg 270deg,#fbbc05 270deg)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>G</span>
        Google
      </button>
      <button onClick={onLinkedIn} className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink-100 bg-white py-2.5 text-[14px] font-semibold text-ink-800 hover:border-brand-300 hover:bg-brand-50">
        <span className="grid h-5 w-5 place-items-center rounded bg-[#0a66c2] text-[11px] font-extrabold text-white">in</span>
        LinkedIn
      </button>
    </div>
  );
}
