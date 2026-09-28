import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    let { data, error } = await fetchProfileRow(userId);

    if (error) {
      console.error('Kon profiel niet laden:', error);
      setProfile(null);
      return;
    }

    if (!data) {
      const { error: ensureError } = await supabase.rpc('ensure_my_profile');
      if (ensureError) {
        console.error('Kon profiel niet aanmaken:', ensureError);
        setProfile(null);
        return;
      }
      ({ data, error } = await fetchProfileRow(userId));
      if (error || !data) {
        console.error('Profiel nog steeds niet beschikbaar:', error);
        setProfile(null);
        return;
      }
    }

    setProfile(mapProfile(data));
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    await loadProfile(session.user.id);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
