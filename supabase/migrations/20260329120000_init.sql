-- DJ Requests: multi-tenant schema, RLS, PIN RPCs, storage, signup trigger

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user / DJ)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'DJ',
  slug text not null,
  logo_path text,
  start_image_path text,
  socials jsonb not null default '{}'::jsonb,
  pin_hash text,
  has_pin boolean not null default true,
  stripe_customer_id text,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  plan text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint profiles_slug_len check (char_length(slug) between 2 and 48)
);

create unique index profiles_slug_unique on public.profiles (slug);

-- ---------------------------------------------------------------------------
-- Libraries (one per DJ in v1)
-- ---------------------------------------------------------------------------
create table public.libraries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Mijn USB Bibliotheek',
  description text not null default '',
  tracks jsonb not null default '[]'::jsonb,
  playlists jsonb not null default '[]'::jsonb,
  playlist_tree jsonb,
  selected_playlist_ids text[],
  track_count integer not null default 0,
  playlist_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index libraries_owner_unique on public.libraries (owner_id);

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------
create type public.request_status as enum (
  'pending',
  'played',
  'declined'
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  title text not null,
  artist text not null,
  kind text not null default 'playable' check (kind in ('playable', 'wishlist')),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index requests_library_id_idx on public.requests (library_id);
create index requests_library_created_idx on public.requests (library_id, created_at desc);

-- Dedup: only one pending request per library for same title+artist (case-insensitive)
create unique index requests_pending_dedup_idx
  on public.requests (library_id, lower(title), lower(artist))
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger libraries_set_updated_at
  before update on public.libraries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signup: create profile + empty library
-- ---------------------------------------------------------------------------
create or replace function public.slugify(raw text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
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

  insert into public.profiles (id, display_name, slug, pin_hash, has_pin)
  values (
    new.id,
    display,
    final_slug,
    extensions.crypt('1234', extensions.gen_salt('bf')),
    true
  );

  insert into public.libraries (owner_id, name, description)
  values (
    new.id,
    display || ' USB',
    'Upload je Rekordbox XML om te starten.'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- PIN helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.set_my_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;
  if p_pin is null or length(trim(p_pin)) < 4 then
    raise exception 'PIN moet minimaal 4 tekens zijn';
  end if;
  update public.profiles
  set pin_hash = extensions.crypt(trim(p_pin), extensions.gen_salt('bf')),
      has_pin = true
  where id = auth.uid();
end;
$$;

create or replace function public.verify_library_pin(p_slug text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored_hash text;
begin
  select pin_hash into stored_hash
  from public.profiles
  where slug = lower(trim(p_slug));

  if stored_hash is null then
    return false;
  end if;

  return stored_hash = extensions.crypt(trim(p_pin), stored_hash);
end;
$$;

create or replace function public.owner_id_for_library(p_library_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id from public.libraries where id = p_library_id;
$$;

create or replace function public.update_request_with_pin(
  p_request_id uuid,
  p_status public.request_status,
  p_slug text,
  p_pin text
)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.requests;
  lib_id uuid;
begin
  if not public.verify_library_pin(p_slug, p_pin) then
    raise exception 'Ongeldige PIN';
  end if;

  select l.id into lib_id
  from public.libraries l
  join public.profiles p on p.id = l.owner_id
  where p.slug = lower(trim(p_slug));

  update public.requests r
  set status = p_status
  where r.id = p_request_id and r.library_id = lib_id
  returning * into result;

  if result.id is null then
    raise exception 'Verzoek niet gevonden';
  end if;

  return result;
end;
$$;

create or replace function public.delete_request_with_pin(
  p_request_id uuid,
  p_slug text,
  p_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  lib_id uuid;
  deleted int;
begin
  if not public.verify_library_pin(p_slug, p_pin) then
    raise exception 'Ongeldige PIN';
  end if;

  select l.id into lib_id
  from public.libraries l
  join public.profiles p on p.id = l.owner_id
  where p.slug = lower(trim(p_slug));

  delete from public.requests
  where id = p_request_id and library_id = lib_id;

  get diagnostics deleted = row_count;
  if deleted = 0 then
    raise exception 'Verzoek niet gevonden';
  end if;
end;
$$;

create or replace function public.clear_requests_with_pin(
  p_slug text,
  p_pin text,
  p_request_ids uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  lib_id uuid;
begin
  if not public.verify_library_pin(p_slug, p_pin) then
    raise exception 'Ongeldige PIN';
  end if;

  select l.id into lib_id
  from public.libraries l
  join public.profiles p on p.id = l.owner_id
  where p.slug = lower(trim(p_slug));

  if p_request_ids is null then
    delete from public.requests where library_id = lib_id;
  else
    delete from public.requests
    where library_id = lib_id and id = any (p_request_ids);
  end if;
end;
$$;

create or replace function public.update_playlist_filter_with_pin(
  p_slug text,
  p_pin text,
  p_selected_playlist_ids text[]
)
returns public.libraries
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.libraries;
begin
  if not public.verify_library_pin(p_slug, p_pin) then
    raise exception 'Ongeldige PIN';
  end if;

  update public.libraries l
  set selected_playlist_ids = p_selected_playlist_ids
  from public.profiles p
  where p.id = l.owner_id
    and p.slug = lower(trim(p_slug))
  returning l.* into result;

  if result.id is null then
    raise exception 'Bibliotheek niet gevonden';
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public read helpers (hide pin_hash)
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles as
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.libraries enable row level security;
alter table public.requests enable row level security;

-- Profiles
create policy "Public profiles are readable"
  on public.profiles for select
  using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Libraries: public read (catalog for guests), owner write
create policy "Libraries are publicly readable"
  on public.libraries for select
  using (true);

create policy "Owners insert own library"
  on public.libraries for insert
  with check (auth.uid() = owner_id);

create policy "Owners update own library"
  on public.libraries for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners delete own library"
  on public.libraries for delete
  using (auth.uid() = owner_id);

-- Requests
create policy "Requests are publicly readable"
  on public.requests for select
  using (true);

create policy "Anyone can insert requests"
  on public.requests for insert
  with check (true);

create policy "Owners update requests"
  on public.requests for update
  using (auth.uid() = public.owner_id_for_library(library_id));

create policy "Owners delete requests"
  on public.requests for delete
  using (auth.uid() = public.owner_id_for_library(library_id));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.libraries;

-- ---------------------------------------------------------------------------
-- Storage: logos bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Logo images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Users can upload own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own logo"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own logo"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Column privileges: never expose pin_hash to clients
revoke all on table public.profiles from anon, authenticated, public;
grant select (
  id, display_name, slug, logo_path, start_image_path, socials, has_pin,
  stripe_customer_id, subscription_status, plan, current_period_end,
  created_at, updated_at
) on table public.profiles to anon, authenticated;
grant update (
  display_name, slug, logo_path, start_image_path, socials, updated_at
) on table public.profiles to authenticated;

grant select, insert, update, delete on table public.libraries to anon, authenticated;
grant select, insert, update, delete on table public.requests to anon, authenticated;

-- Grants for RPCs
grant execute on function public.set_my_pin(text) to authenticated;
grant execute on function public.verify_library_pin(text, text) to anon, authenticated;
grant execute on function public.update_request_with_pin(uuid, public.request_status, text, text) to anon, authenticated;
grant execute on function public.delete_request_with_pin(uuid, text, text) to anon, authenticated;
grant execute on function public.clear_requests_with_pin(text, text, uuid[]) to anon, authenticated;
grant execute on function public.update_playlist_filter_with_pin(text, text, text[]) to anon, authenticated;
