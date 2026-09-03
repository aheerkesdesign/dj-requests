-- Library-level settings (request controls, guest experience, language default)

alter table public.libraries
  add column if not exists library_settings jsonb not null default '{
    "enableDownloadRequests": true,
    "skipStartScreen": false,
    "hidePlayedDeclinedFromGuests": false,
    "pageDefaultLocale": "auto"
  }'::jsonb;
