-- Remove unused voting columns (vote UI was never wired)

alter table public.requests
  drop column if exists votes,
  drop column if exists voted_by;
