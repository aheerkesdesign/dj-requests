-- Track field visibility prefs for DJ vs viewers (title/artist always shown in UI)

alter table public.libraries
  add column if not exists track_display_prefs jsonb not null default '{
    "dj": {"album": false, "bpm": false, "key": false},
    "viewers": {"album": false, "bpm": false, "key": false}
  }'::jsonb;
