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

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfile(user.id);
}

export async function oauthLogin(provider, intendedRole) {
  localStorage.setItem('lc_role_intent', intendedRole);
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
