import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    console.error('getCurrentProfile error', error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not checked yet
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (userId) => {
    const p = await fetchProfile(userId);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) await refreshProfile(session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        await refreshProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = {
    session,
    profile,
    loading,
    user: session?.user ?? null,
    refreshProfile: () => refreshProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Which admin sections the current user can access — super admins get
// everything, delegated admins get whatever's been explicitly granted.
// Loading is treated as "no access yet" so gated UI doesn't flash open.
export function useAdminAccess() {
  const { profile } = useAuth();
  const [sections, setSections] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const isSuper = !!profile?.is_super_admin;

  useEffect(() => {
    if (!profile || profile.role !== 'admin') { setLoading(false); return; }
    if (isSuper) { setSections(new Set(['leads', 'qa', 'jobs_learning', 'people'])); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    supabase.from('admin_permissions').select('section').eq('admin_id', profile.id).then(({ data }) => {
      if (!mounted) return;
      setSections(new Set((data || []).map((r) => r.section)));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [profile, isSuper]);

  return { sections, isSuper, loading, can: (section) => isSuper || sections.has(section) };
}

// ---- Auth actions (ported 1:1 from app/js/auth.js) ----

export async function registerUser({ fullName, email, password, role, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, phone: phone || null } },
  });
  if (error) throw error;
  return data;
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// scope:'local' ends the session in this browser only. The default is
// 'global', which revokes every refresh token for the user — that let a
// sign-out in one tab kill a session another tab had just created. Supabase
// still broadcasts SIGNED_OUT to other tabs, so this logs you out properly.
export async function signOut() {
  await supabase.auth.signOut({ scope: 'local' });
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfile(user.id);
}

// Supabase lets a signed-in user set a new password without proving the old
// one. Re-authenticating first means someone at an unattended laptop cannot
// change the password and lock the owner out of their own account.
export async function changePassword({ currentPassword, newPassword }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('You need to be signed in to change your password.');

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) throw new Error('Your current password is not correct.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Sends the recovery mail. The link lands on /reset-password, which must be on
// the redirect allow-list in the Supabase dashboard or the link is rejected.
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// Used only from the recovery link, where Supabase has already put the user in
// a temporary session — so there is no old password to prove here.
export async function setNewPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Someone who signed in with Google or LinkedIn has no password to change.
export function signedInWithPassword(user) {
  const providers = user?.app_metadata?.providers || [user?.app_metadata?.provider].filter(Boolean);
  return providers.includes('email');
}

// Where to send the user after they log in, when it shouldn't be their
// usual role home — e.g. back to the question they wanted to ask. Stored in
// localStorage (not router state) because OAuth does a full-page redirect.
export function setReturnTo(path) {
  localStorage.setItem('lc_return_to', path);
}
export function consumeReturnTo() {
  const path = localStorage.getItem('lc_return_to');
  localStorage.removeItem('lc_return_to');
  return path;
}

export async function oauthLogin(provider, intendedRole) {
  localStorage.setItem('lc_oauth_provider', provider);
  localStorage.setItem('lc_oauth_new_user', 'true');
  if (intendedRole) localStorage.setItem('lc_role_intent', intendedRole);
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + '/login' },
  });
}


// Returns the dashboard path a profile should land on.
export function roleHomePath(profile, hasAdvocateProfile) {
  if (!profile) return '/login';
  if (profile.role === 'admin') return '/admin';
  if (profile.role === 'advocate') {
    return hasAdvocateProfile ? '/dashboard/advocate' : '/dashboard/advocate/profile?welcome=1';
  }
  if (profile.role === 'client') return '/dashboard/client';
  return '/login';
}

export async function hasAdvocateProfileRow(userId) {
  const { data } = await supabase.from('advocate_profiles').select('id').eq('id', userId).maybeSingle();
  return !!data;
}
