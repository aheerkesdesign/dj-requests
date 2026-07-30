-- Add kind column to distinguish live requests (playable) from wishlist entries (wishlist)

alter table public.requests
  add column kind text not null default 'playable'
    check (kind in ('playable', 'wishlist'));
