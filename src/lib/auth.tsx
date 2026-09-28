import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from '../types';
import { mapProfile, PROFILE_COLUMNS } from './profile';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfileRow(userId: string) {
  return supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
}

async function resolveProfile(userId: string): Promise<Profile | null> {
  let { data, error } = await fetchProfileRow(userId);

  if (error) {
    console.error('Kon profiel niet laden:', error);
    return null;
  }

  if (!data) {
    const { error: ensureError } = await supabase.rpc('ensure_my_profile');
    if (ensureError) {
      console.error('Kon profiel niet aanmaken:', ensureError);
      return null;
    }
    ({ data, error } = await fetchProfileRow(userId));
    if (error || !data) {
      console.error('Profiel nog steeds niet beschikbaar:', error);
      return null;
    }
  }

  return mapProfile(data);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfile(await resolveProfile(userId));
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    const userId = session?.user?.id;

    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    void resolveProfile(userId)
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, session?.user?.id]);

  const loading = !authReady || profileLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
