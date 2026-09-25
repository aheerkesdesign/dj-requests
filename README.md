# trackdrop

Multi-tenant Rekordbox song-request app powered by **Vite + React + Supabase**.

Each DJ creates an account, uploads a Rekordbox XML library, and gets a public page at `/d/:slug` where the audience can browse tracks and submit requests. Live updates use Supabase Realtime.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the migration in [`supabase/migrations/20260329120000_init.sql`](supabase/migrations/20260329120000_init.sql)
   - Or use the Supabase CLI: `supabase db push`
3. Under **Authentication → Providers**, enable Email
4. (Optional) Disable email confirmation for local testing under Auth settings

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
| `/signup` / `/login` | DJ accounts (Supabase Auth) |
| `/dashboard` | Authenticated DJ control (profile, XML, requests) |
| `/d/:slug` | Public audience page + optional booth PIN unlock |

Default booth PIN after signup: `1234` (change in settings).

## Deploy

1. Build: `npm run build` → static `dist/`
2. Host on Vercel, Netlify, Cloudflare Pages, etc.
3. Set the same `VITE_SUPABASE_*` env vars in the host
4. Add your production URL to Supabase Auth redirect URLs

## Stripe (later)

`profiles` already includes:

- `stripe_customer_id`
- `subscription_status` (`none` | `trialing` | `active` | `past_due` | `canceled`)
- `plan`
- `current_period_end`

Wire Checkout + webhooks via Supabase Edge Functions when you monetize. Do not put Stripe secret keys in the Vite client.

## Tech notes

- Catalog stored as jsonb on `libraries` (matches Rekordbox XML upload)
- Guests insert requests anonymously (RLS); DJ mutations use auth or PIN RPCs
- Express / Google AI Studio Gemini scaffolding has been removed
