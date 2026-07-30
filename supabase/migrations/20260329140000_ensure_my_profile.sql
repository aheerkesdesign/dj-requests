-- Allow authenticated users to repair missing profile/library after a failed signup trigger.

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public, extensions
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

  insert into public.profiles (id, display_name, slug, pin_hash, has_pin)
  values (
    uid,
    display,
    final_slug,
    extensions.crypt('1234', extensions.gen_salt('bf')),
    true
  );

  insert into public.libraries (owner_id, name, description)
  values (
    uid,
    display || ' USB',
    'Upload je Rekordbox XML om te starten.'
  );
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;
