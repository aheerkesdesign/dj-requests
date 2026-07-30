-- Remove unused request metadata (never collected or displayed in UI)

alter table public.requests
  drop column if exists notes,
  drop column if exists requested_by;
