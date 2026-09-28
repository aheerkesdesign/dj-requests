# trackdrop

Multi-tenant Rekordbox song-request app powered by **Vite + React + Supabase**.

Each DJ creates an account, uploads a Rekordbox XML library, and gets a public page at `/d/:slug` where the audience can browse tracks and submit requests. Live updates use Supabase Realtime.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Apply the SQL migrations in [`supabase/migrations`](supabase/migrations) (SQL Editor, in filename order, or `supabase db push` if the CLI is linked). That includes `library_tracks`, which holds the catalog.
3. Under **Authentication → Providers**, enable Email
4. Under **Authentication → URL configuration**, add these redirect URLs (plus your production origin):
   - `http://localhost:3000/reset-password`
   - `https://your-production-host/reset-password`
5. (Optional) Disable email confirmation for local testing under Auth settings

### 2. Local app

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Description |
|------|-------------|
| `/` | Marketing landing |
| `/signup` / `/login` | DJ accounts (Supabase Auth). Login includes “wachtwoord vergeten”. |
| `/reset-password` | Set a new password after the email link |
| `/dashboard` | Authenticated DJ control (profile, XML, requests) |
| `/d/:slug` | Public audience page |

## Deploy

1. Build: `npm run build` → static `dist/`
2. Host on Vercel, Netlify, Cloudflare Pages, etc.
3. Set the same `VITE_SUPABASE_*` env vars in the host
4. Add your production URL and `/reset-password` to Supabase Auth redirect URLs

## Stripe (later)

`profiles` already includes:

- `stripe_customer_id`
- `subscription_status` (`none` | `trialing` | `active` | `past_due` | `canceled`)
- `plan`
- `current_period_end`

Wire Checkout + webhooks via Supabase Edge Functions when you monetize. Do not put Stripe secret keys in the Vite client.

## Tech notes

- Catalog rows live in `library_tracks`. The public page calls `search_library_tracks` and loads one page at a time. Playlists stay on `libraries`. After this migration, re-upload a large Rekordbox XML if the jsonb backfill times out.
- Guests insert requests anonymously (RLS); DJ mutations use the authenticated session
- Express / Google AI Studio Gemini scaffolding has been removed
