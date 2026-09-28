-- DELETE realtime events only include the primary key by default, so a
-- library_id=eq.* filter never matches and other clients never see clears.
-- FULL replica identity includes library_id (and the rest of the row) on DELETE.
alter table public.requests replica identity full;
