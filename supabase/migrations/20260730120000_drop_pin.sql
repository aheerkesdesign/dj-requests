-- Remove unused PIN admin surface (UI no longer uses PIN; default PIN was a security hole).

-- ---------------------------------------------------------------------------
-- Drop PIN RPCs
-- ---------------------------------------------------------------------------
drop function if exists public.update_request_with_pin(uuid, public.request_status, text, text);
drop function if exists public.delete_request_with_pin(uuid, text, text);
drop function if exists public.clear_requests_with_pin(text, text, uuid[]);
drop function if exists public.update_playlist_filter_with_pin(text, text, text[]);
drop function if exists public.verify_library_pin(text, text);
drop function if exists public.set_my_pin(text);

-- ---------------------------------------------------------------------------
-- Recreate signup helpers without pin_hash / has_pin
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  display text;
  suffix int := 0;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1),
    'dj'
  );
  base_slug := public.slugify(coalesce(nullif(trim(new.raw_user_meta_data->>'slug'), ''), display));
  if base_slug is null or base_slug = '' then
    base_slug := 'dj';
  end if;
  if char_length(base_slug) < 2 then
    base_slug := base_slug || 'dj';
  end if;
  final_slug := left(base_slug, 40);

  while exists (select 1 from public.profiles where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := left(base_slug, 40) || '-' || suffix::text;
  end loop;

  insert into public.profiles (id, display_name, slug)
  values (new.id, display, final_slug);

  insert into public.libraries (owner_id, name, description)
  values (
    new.id,
    display || ' USB',
    'Upload je Rekordbox XML om te starten.'
  );

  return new;
end;
$$;

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  u_email text;
  meta jsonb;
  display text;
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  if uid is null then
    raise exception 'Niet ingelogd';
  end if;

  if exists (select 1 from public.profiles where id = uid) then
    if not exists (select 1 from public.libraries where owner_id = uid) then
      insert into public.libraries (owner_id, name, description)
      select uid, display_name || ' USB', 'Upload je Rekordbox XML om te starten.'
      from public.profiles where id = uid;
    end if;
    return;
  end if;

  select email, raw_user_meta_data into u_email, meta
  from auth.users
  where id = uid;

  display := coalesce(
    nullif(trim(meta->>'display_name'), ''),
    split_part(coalesce(u_email, 'dj'), '@', 1),
    'DJ'
  );
  base_slug := public.slugify(coalesce(nullif(trim(meta->>'slug'), ''), display));
  if base_slug is null or base_slug = '' then
    base_slug := 'dj';
  end if;
  if char_length(base_slug) < 2 then
    base_slug := base_slug || 'dj';
  end if;
  final_slug := left(base_slug, 40);

  while exists (select 1 from public.profiles where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := left(base_slug, 40) || '-' || suffix::text;
  end loop;

  insert into public.profiles (id, display_name, slug)
  values (uid, display, final_slug);

  insert into public.libraries (owner_id, name, description)
  values (
    uid,
    display || ' USB',
    'Upload je Rekordbox XML om te starten.'
  );
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Drop PIN columns + refresh public view / grants
-- ---------------------------------------------------------------------------
drop view if exists public.public_profiles;

alter table public.profiles
  drop column if exists pin_hash,
  drop column if exists has_pin;

create view public.public_profiles as
select
  id,
  display_name,
  slug,
  logo_path,
  start_image_path,
  socials,
  subscription_status,
  created_at,
  updated_at
from public.profiles;

revoke all on table public.profiles from anon, authenticated, public;
grant select (
  id, display_name, slug, logo_path, start_image_path, socials,
  stripe_customer_id, subscription_status, plan, current_period_end,
  created_at, updated_at
) on table public.profiles to anon, authenticated;
grant update (
  display_name, slug, logo_path, start_image_path, socials, updated_at
) on table public.profiles to authenticated;
grant select on public.public_profiles to anon, authenticated;
