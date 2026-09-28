import type { Profile, SocialLinks, SubscriptionStatus } from '../types';
import { getLogoPublicUrl } from './supabase';
import type { Database } from './database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export const PROFILE_COLUMNS =
  'id, display_name, slug, logo_path, start_image_path, socials, stripe_customer_id, subscription_status, plan, current_period_end, created_at, updated_at';

export const PROFILE_PUBLIC_COLUMNS =
  'id, display_name, slug, logo_path, start_image_path, socials, subscription_status';

export function mapProfile(row: ProfileRow | Record<string, unknown>): Profile {
  const r = row as ProfileRow;
  return {
    id: r.id,
    displayName: r.display_name,
    slug: r.slug,
    logoPath: r.logo_path,
    logoUrl: getLogoPublicUrl(r.logo_path),
    startImagePath: r.start_image_path,
    startImageUrl: getLogoPublicUrl(r.start_image_path),
    socials: (r.socials || {}) as SocialLinks,
    subscriptionStatus: (r.subscription_status || 'none') as SubscriptionStatus,
    plan: r.plan,
    currentPeriodEnd: r.current_period_end,
    stripeCustomerId: r.stripe_customer_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
