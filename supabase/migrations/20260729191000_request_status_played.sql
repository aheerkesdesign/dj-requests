-- Replace request statuses: drop downloaded, rename added_to_usb -> played
-- Drop the partial index first: its WHERE status = 'pending' blocks the enum cast.

alter table public.requests
  alter column status drop default;

drop index if exists public.requests_pending_dedup_idx;

drop function if exists public.update_request_with_pin(uuid, public.request_status, text, text);

drop type if exists public.request_status_new;

create type public.request_status_new as enum (
  'pending',
  'played',
  'declined'
);

alter table public.requests
  alter column status type public.request_status_new
  using (
    case status::text
      when 'added_to_usb' then 'played'
      when 'downloaded' then 'played'
      when 'played' then 'played'
      when 'pending' then 'pending'
      when 'declined' then 'declined'
      else 'pending'
    end
  )::public.request_status_new;

drop type public.request_status;

alter type public.request_status_new rename to request_status;

alter table public.requests
  alter column status set default 'pending'::public.request_status;

create unique index requests_pending_dedup_idx
  on public.requests (library_id, lower(title), lower(artist))
  where status = 'pending';

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

grant execute on function public.update_request_with_pin(uuid, public.request_status, text, text) to anon, authenticated;
