-- Fix signup trigger: pgcrypto lives in `extensions` on Supabase
-- Run this in the Supabase SQL Editor

create extension if not exists pgcrypto with schema extensions;

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
