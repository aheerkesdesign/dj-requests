# Stripe schema notes (implement billing later)

## Already in `profiles`

| Column | Purpose |
|--------|---------|
| `stripe_customer_id` | Stripe Customer id after first Checkout |
| `subscription_status` | `none` \| `trialing` \| `active` \| `past_due` \| `canceled` |
| `plan` | e.g. `starter`, `pro` |
| `current_period_end` | Period end timestamp |

## Recommended next steps

1. Create Stripe products/prices in Stripe Dashboard
2. Add Supabase Edge Functions:
   - `create-checkout-session` (auth required)
   - `create-portal-session`
   - `stripe-webhook` (verify signature, update `profiles`)
3. Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only in Edge Function secrets
4. Gate product features in the app (and optionally RLS) when `subscription_status` is not `active`/`trialing`

Do not put Stripe secret keys in Vite/`VITE_*` env vars.
