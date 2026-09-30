-- Tighten request↔catalog matching (keep in sync with src/utils/library.ts).
-- Fixes false positives like "Baby Shark" matching library track "Baby"
-- via substring includes when no artist is provided.

create or replace function public.track_title_is_version_of(p_longer text, p_shorter text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(p_shorter, '') <> ''
    and lower(p_longer) like lower(p_shorter) || '%'
    and (
      length(p_longer) = length(p_shorter)
      or substring(lower(p_longer) from length(p_shorter) + 1) ~ '^\s*[\(\[\-–—]'
    );
$$;

create or replace function public.track_title_contains_phrase(p_haystack text, p_needle text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(p_needle, '') <> ''
    and char_length(p_needle) >= 3
    and (
      lower(p_haystack) = lower(p_needle)
      or lower(p_haystack) ~
        (
          '(^|[^[:alnum:]])'
          || regexp_replace(lower(p_needle), '([\\.^$|()*+?\[\]{}])', '\\\1', 'g')
          || '([^[:alnum:]]|$)'
        )
    );
$$;

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
    and btrim(coalesce(p_name, '')) <> ''
    and (
      (
        (
          lower(btrim(p_name)) = lower(btrim(p_title))
          or public.track_title_is_version_of(lower(btrim(p_name)), lower(btrim(p_title)))
          or public.track_title_is_version_of(lower(btrim(p_title)), lower(btrim(p_name)))
        )
        and (
          btrim(coalesce(p_req_artist, '')) = ''
          or btrim(coalesce(p_artist, '')) = ''
          or position(lower(btrim(p_req_artist)) in lower(btrim(p_artist))) > 0
          or position(lower(btrim(p_artist)) in lower(btrim(p_req_artist))) > 0
        )
      )
      or (
        -- Incomplete request title inside library title; artist required.
        -- Do not match longer request titles against shorter library titles
        -- (e.g. "Baby Shark" must not hit "Baby").
        btrim(coalesce(p_req_artist, '')) <> ''
        and btrim(coalesce(p_artist, '')) <> ''
        and (
          position(lower(btrim(p_req_artist)) in lower(btrim(p_artist))) > 0
          or position(lower(btrim(p_artist)) in lower(btrim(p_req_artist))) > 0
        )
        and public.track_title_contains_phrase(lower(btrim(p_name)), lower(btrim(p_title)))
        and lower(btrim(p_name)) <> lower(btrim(p_title))
        and not public.track_title_is_version_of(lower(btrim(p_name)), lower(btrim(p_title)))
        and not public.track_title_is_version_of(lower(btrim(p_title)), lower(btrim(p_name)))
      )
    );
$$;

revoke all on function public.track_title_is_version_of(text, text) from public;
revoke all on function public.track_title_contains_phrase(text, text) from public;
revoke all on function public.track_title_artist_matches(text, text, text, text) from public;

grant execute on function public.track_title_is_version_of(text, text) to anon, authenticated;
grant execute on function public.track_title_contains_phrase(text, text) to anon, authenticated;
grant execute on function public.track_title_artist_matches(text, text, text, text) to anon, authenticated;
