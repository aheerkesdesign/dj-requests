import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, SocialLinks, SubscriptionStatus } from '../types';
import { getLogoPublicUrl } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_COLUMNS =
  'id, display_name, slug, logo_path, start_image_path, socials, stripe_customer_id, subscription_status, plan, current_period_end, created_at, updated_at';

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    slug: row.slug,
    logoPath: row.logo_path,
    logoUrl: getLogoPublicUrl(row.logo_path),
    startImagePath: row.start_image_path,
    startImageUrl: getLogoPublicUrl(row.start_image_path),
    socials: (row.socials || {}) as SocialLinks,
    subscriptionStatus: (row.subscription_status || 'none') as SubscriptionStatus,
    plan: row.plan,
    currentPeriodEnd: row.current_period_end,
    stripeCustomerId: row.stripe_customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
