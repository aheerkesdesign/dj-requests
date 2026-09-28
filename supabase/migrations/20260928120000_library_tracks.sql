-- Catalog rows live in library_tracks so the client can search a page
-- instead of downloading libraries.tracks. Playlists stay on libraries.
-- If this backfill hits a statement timeout, re-upload the Rekordbox XML.

set local statement_timeout = '120s';

create extension if not exists pg_trgm with schema extensions;

create table public.library_tracks (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  track_key text not null,
  name text not null default '',
  artist text not null default '',
  playlist_ids text[] not null default '{}',
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (library_id, track_key)
);

-- Copy existing jsonb catalogs. Duplicate track keys keep one row.
insert into public.library_tracks (library_id, track_key, name, artist, playlist_ids, data)
select distinct on (src.library_id, src.track_key)
  src.library_id,
  src.track_key,
  src.name,
  src.artist,
  src.playlist_ids,
  src.data
from (
  select
    l.id as library_id,
    coalesce(nullif(t->>'trackId', ''), nullif(t->>'id', ''), md5(t::text)) as track_key,
    coalesce(t->>'name', '') as name,
    coalesce(t->>'artist', '') as artist,
    coalesce((
      select array_agg(distinct p->>'id')
      from jsonb_array_elements(coalesce(l.playlists, '[]'::jsonb)) as p
      where
        (coalesce(p->'trackIds', '[]'::jsonb) ? coalesce(t->>'trackId', ''))
        or exists (
          select 1
          from jsonb_array_elements_text(coalesce(t->'playlists', '[]'::jsonb)) as pn
          where pn = p->>'name'
        )
    ), '{}'::text[]) as playlist_ids,
    t as data
  from public.libraries as l
  cross join lateral jsonb_array_elements(coalesce(l.tracks, '[]'::jsonb)) as t
) as src
where src.track_key <> ''
order by src.library_id, src.track_key;

update public.libraries
set tracks = '[]'::jsonb
where tracks <> '[]'::jsonb;

create index library_tracks_library_id_idx on public.library_tracks (library_id);
create index library_tracks_name_trgm_idx on public.library_tracks using gin (name extensions.gin_trgm_ops);
create index library_tracks_artist_trgm_idx on public.library_tracks using gin (artist extensions.gin_trgm_ops);
create index library_tracks_playlist_ids_idx on public.library_tracks using gin (playlist_ids);

alter table public.library_tracks enable row level security;

create policy "Tracks are publicly readable"
  on public.library_tracks for select
  using (true);

create policy "Owners insert tracks"
  on public.library_tracks for insert
  with check (auth.uid() = public.owner_id_for_library(library_id));

create policy "Owners update tracks"
  on public.library_tracks for update
  using (auth.uid() = public.owner_id_for_library(library_id))
  with check (auth.uid() = public.owner_id_for_library(library_id));

create policy "Owners delete tracks"
  on public.library_tracks for delete
  using (auth.uid() = public.owner_id_for_library(library_id));

grant select on public.library_tracks to anon, authenticated;
grant insert, update, delete on public.library_tracks to authenticated;

-- Same matching rules as src/utils/library.ts isTrackInLibrary.
create or replace function public.track_title_artist_matches(
  p_name text,
  p_artist text,
  p_title text,
  p_req_artist text
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    btrim(coalesce(p_title, '')) <> ''
    and (
      (
        lower(btrim(p_name)) = lower(btrim(p_title))
        and (
          btrim(coalesce(p_req_artist, '')) = ''
          or btrim(coalesce(p_artist, '')) = ''
          or position(lower(btrim(p_req_artist)) in lower(btrim(p_artist))) > 0
          or position(lower(btrim(p_artist)) in lower(btrim(p_req_artist))) > 0
        )
      )
      or (
        lower(btrim(p_name)) <> lower(btrim(p_title))
        and (
          position(lower(btrim(p_title)) in lower(btrim(p_name))) > 0
          or (
            btrim(p_name) <> ''
            and position(lower(btrim(p_name)) in lower(btrim(p_title))) > 0
          )
        )
        and (
          (
            btrim(coalesce(p_req_artist, '')) <> ''
            and btrim(coalesce(p_artist, '')) <> ''
            and (
              position(lower(btrim(p_req_artist)) in lower(btrim(p_artist))) > 0
              or position(lower(btrim(p_artist)) in lower(btrim(p_req_artist))) > 0
            )
          )
          or btrim(coalesce(p_req_artist, '')) = ''
          or btrim(coalesce(p_artist, '')) = ''
        )
      )
    );
$$;

create or replace function public.library_has_track(
  p_library_id uuid,
  p_title text,
  p_artist text
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.library_tracks as t
    where t.library_id = p_library_id
      and public.track_title_artist_matches(t.name, t.artist, p_title, p_artist)
  );
$$;

create or replace function public.match_request_tracks(
  p_library_id uuid,
  p_requests jsonb
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  item jsonb;
  found jsonb;
  acc jsonb := '[]'::jsonb;
  seen text[] := '{}';
  track_id text;
begin
  if p_requests is null or jsonb_typeof(p_requests) <> 'array' then
    return '[]'::jsonb;
  end if;

  for item in select value from jsonb_array_elements(p_requests)
  loop
    select t.data into found
    from public.library_tracks as t
    where t.library_id = p_library_id
      and public.track_title_artist_matches(
        t.name,
        t.artist,
        item->>'title',
        coalesce(item->>'artist', '')
      )
    limit 1;

    if found is not null then
      track_id := coalesce(found->>'id', found->>'trackId', '');
      if track_id = '' or not (track_id = any(seen)) then
        if track_id <> '' then
          seen := array_append(seen, track_id);
        end if;
        acc := acc || jsonb_build_array(found);
      end if;
    end if;
  end loop;

  return acc;
end;
$$;

create or replace function public.search_library_tracks(
  p_library_id uuid,
  p_query text default '',
  p_playlist_ids text[] default null,
  p_sort text default 'name',
  p_order text default 'asc',
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_query text;
  v_limit integer;
  v_offset integer;
  v_sort text;
  v_desc boolean;
  result jsonb;
begin
  v_query := btrim(coalesce(p_query, ''));
  v_query := replace(v_query, '\', '\\');
  v_query := replace(v_query, '%', '\%');
  v_query := replace(v_query, '_', '\_');
  v_limit := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset := greatest(coalesce(p_offset, 0), 0);
  v_sort := case when p_sort = 'artist' then 'artist' else 'name' end;
  v_desc := lower(coalesce(p_order, 'asc')) = 'desc';

  with filtered as (
    select data, name, artist, track_key
    from public.library_tracks
    where library_id = p_library_id
      and (
        v_query = ''
        or name ilike '%' || v_query || '%' escape '\'
        or artist ilike '%' || v_query || '%' escape '\'
      )
      and (
        p_playlist_ids is null
        or playlist_ids && p_playlist_ids
      )
  ),
  ranked as (
    select
      data,
      row_number() over (
        order by
          case when v_sort = 'artist' and v_desc then lower(artist) end desc nulls last,
          case when v_sort = 'artist' and not v_desc then lower(artist) end asc nulls last,
          case when v_sort = 'name' and v_desc then lower(name) end desc nulls last,
          case when v_sort = 'name' and not v_desc then lower(name) end asc nulls last,
          track_key
      ) as ord
    from filtered
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'tracks', coalesce((
      select jsonb_agg(page.data order by page.ord)
      from (
        select data, ord
        from ranked
        where ord > v_offset
          and ord <= v_offset + v_limit
      ) as page
    ), '[]'::jsonb)
  )
  into result;

  return coalesce(result, '{"tracks":[],"total":0}'::jsonb);
end;
$$;

revoke all on function public.track_title_artist_matches(text, text, text, text) from public;
revoke all on function public.library_has_track(uuid, text, text) from public;
revoke all on function public.match_request_tracks(uuid, jsonb) from public;
revoke all on function public.search_library_tracks(uuid, text, text[], text, text, integer, integer) from public;

grant execute on function public.track_title_artist_matches(text, text, text, text) to anon, authenticated;
grant execute on function public.library_has_track(uuid, text, text) to anon, authenticated;
grant execute on function public.match_request_tracks(uuid, jsonb) to anon, authenticated;
grant execute on function public.search_library_tracks(uuid, text, text[], text, text, integer, integer) to anon, authenticated;
