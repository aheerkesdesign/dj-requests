-- Start page hero image (separate from header logo)

alter table public.profiles
  add column if not exists start_image_path text;

-- Recreate view (CREATE OR REPLACE cannot insert columns mid-list by position)
drop view if exists public.public_profiles;

create view public.public_profiles as
select
  id,
  display_name,
  slug,
  logo_path,
  start_image_path,
  socials,
  subscription_status,
  has_pin,
  created_at,
  updated_at
from public.profiles;

revoke all on table public.profiles from anon, authenticated, public;
grant select (
  id, display_name, slug, logo_path, start_image_path, socials, has_pin,
  stripe_customer_id, subscription_status, plan, current_period_end,
  created_at, updated_at
) on table public.profiles to anon, authenticated;
grant update (
  display_name, slug, logo_path, start_image_path, socials, updated_at
) on table public.profiles to authenticated;
