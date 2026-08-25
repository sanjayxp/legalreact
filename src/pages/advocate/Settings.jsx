import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Phone, EyeOff, Trash2, ShieldAlert, Clock } from 'lucide-react';
import { useAuth, changePassword, signedInWithPassword } from '../../lib/auth';
import {
  getAdvocateProfile, getAvailability, listTimeOff,
  updateOwnPhone, setListingPaused, deleteOwnAccount,
} from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import AvailabilityEditor from '../../components/advocate/AvailabilityEditor';
import Card, { CardHeading } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, Label } from '../../components/ui/Field';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Spinner, Toast } from '../../components/ui/Misc';

// Everything about the account itself. What the public sees lives on Profile;
// nothing on this page is published.
export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [advProfile, setAdvProfile] = useState(null);
  const [availability, setAvailabilityState] = useState([]);
  const [timeOff, setTimeOff] = useState([]);

  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [pausing, setPausing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('ok');
  function say(text, kind = 'ok') { setMsg(text); setMsgKind(kind); }

  const hasPassword = signedInWithPassword(user);

  async function load() {
    // A throw here used to leave the page on its spinner forever, with no way
    // to tell a slow network from a broken one.
    try {
      const [ap, av, to] = await Promise.all([
        getAdvocateProfile(user.id),
        getAvailability(user.id),
        listTimeOff(user.id),
      ]);
      setAdvProfile(ap);
      setAvailabilityState(av);
      setTimeOff(to);
      setPhone(profile?.phone || '');
    } catch (e) {
      say(e.message || 'Could not load your settings. Please refresh.', 'err');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (user) load(); }, [user, profile?.phone]);

  async function handleSavePhone() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return say('Enter a 10-digit mobile number.', 'err');
    setSavingPhone(true);
    try {
      await updateOwnPhone(user.id, phone);
      await refreshProfile();
      say('Phone number updated.');
    } catch (e) {
      say(e.message || 'Could not save your phone number.', 'err');
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleChangePassword() {
    if (!pw.current) return say('Enter your current password.', 'err');
    if (pw.next.length < 8) return say('Your new password needs at least 8 characters.', 'err');
    if (pw.next !== pw.confirm) return say('The two new passwords do not match.', 'err');
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      say('Password changed.');
    } catch (e) {
      say(e.message || 'Could not change your password.', 'err');
    } finally {
      setSavingPw(false);
    }
  }

  async function handleTogglePause() {
    const next = !advProfile?.listing_paused;
    setPausing(true);
    try {
      await setListingPaused(user.id, next);
      setAdvProfile((p) => ({ ...p, listing_paused: next }));
      say(next
        ? 'Your listing is paused — clients can no longer find you in the directory.'
        : 'Your listing is live again.');
    } catch (e) {
      say(e.message || 'Could not update your listing.', 'err');
    } finally {
      setPausing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteOwnAccount(user.id);
      // The account is gone; the stale session has to go with it. Signing out
      // against a deleted user can fail server-side, and that must not read as
      // a failed deletion — clear what we can and leave regardless.
      try { await signOut(); } catch { /* session is dead either way */ }
      window.location.href = '/';
    } catch (e) {
      say(e.message || 'Could not delete your account.', 'err');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const paused = !!advProfile?.listing_paused;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Settings</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">
          Your account and availability. Nothing here appears on your public profile.
        </p>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---- contact ---- */}
        <Card>
          <CardHeading title="Phone number" sub="How clients and our team reach you. Not shown publicly." />
          <Label htmlFor="set-phone" required>Mobile number</Label>
          <Input
            id="set-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            inputMode="tel"
          />
          <div className="mt-1.5 text-[12px] text-ink-400">
            Signed in as {user?.email}. Changing your email address isn't available yet — contact
            support if you need it moved.
          </div>
          <Button size="sm" className="mt-3" onClick={handleSavePhone} disabled={savingPhone}>
            <Phone size={14} /> {savingPhone ? 'Saving…' : 'Save phone number'}
          </Button>
        </Card>

        {/* ---- password ---- */}
        <Card>
          <CardHeading title="Password" sub="Changing it signs you out of nothing else — other devices stay signed in." />
          {hasPassword ? (
            <>
              <Label htmlFor="pw-current" required>Current password</Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
              />
              <Label htmlFor="pw-next" required>New password</Label>
              <Input
                id="pw-next"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
              <Label htmlFor="pw-confirm" required>Confirm new password</Label>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
              <Button size="sm" className="mt-3" onClick={handleChangePassword} disabled={savingPw}>
                <KeyRound size={14} /> {savingPw ? 'Changing…' : 'Change password'}
              </Button>
            </>
          ) : (
            <div className="rounded-xl bg-ink-50 px-3.5 py-3 text-[13px] leading-relaxed text-ink-600">
              You sign in with Google or LinkedIn, so there's no password here to change. Manage it
              with that provider instead.
            </div>
          )}
        </Card>
      </div>

      {/* ---- listing ---- */}
      <Card className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardHeading title="Public listing" />
              <Badge tone={paused ? 'amber' : 'green'} className="mb-4">{paused ? 'Paused' : 'Live'}</Badge>
            </div>
            <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-500">
              {paused
                ? 'You are hidden from the advocate directory, so no new clients can find or book you. Existing cases, clients and bookings are untouched.'
                : 'Clients can find you in the directory and request consultations. Pause this while you are on leave or already at capacity — your verification is kept, so coming back needs no re-review.'}
            </p>
          </div>
          <Button size="sm" variant={paused ? 'primary' : 'ghost'} onClick={handleTogglePause} disabled={pausing}>
            <EyeOff size={14} /> {pausing ? 'Updating…' : paused ? 'Make me visible again' : 'Pause my listing'}
          </Button>
        </div>
      </Card>

      {/* ---- availability, moved off the bookings page ---- */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink-400">
          <Clock size={14} /> Working hours &amp; time off
        </div>
        <AvailabilityEditor
          advocateId={user.id}
          availability={availability}
          timeOff={timeOff}
          onSaved={load}
          setMsg={(t, kind = 'ok') => say(t, kind)}
        />
      </div>

      {/* ---- erasure ---- */}
      <Card className="mt-5 border-coral-400/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
              <ShieldAlert size={16} className="text-coral-500" /> Delete my account
            </div>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-500">
              Removes your login, profile, cases, clients, bookings and uploaded documents. This
              cannot be undone, and we cannot get any of it back for you afterwards.
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Delete account
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        busy={deleting}
        busyLabel="Deleting…"
        confirmLabel="Delete everything"
        title="Delete your account permanently?"
        message="Your profile, cases, clients, bookings and documents will be erased. You will be signed out immediately and this cannot be undone."
      />
    </AdvocateShell>
  );
}
