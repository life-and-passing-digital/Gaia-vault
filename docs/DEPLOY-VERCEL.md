# Deploying Gaia Vault to Vercel

## The 500 `MIDDLEWARE_INVOCATION_FAILED` error

If a fresh deploy shows **`500: INTERNAL_SERVER_ERROR · MIDDLEWARE_INVOCATION_FAILED`**
on every page, it means **required environment variables are not set** in the
Vercel project. The middleware runs on every route, so a missing Supabase config
used to crash the whole site.

This is now hardened: with no Supabase env, the middleware no longer throws — the
marketing pages render and protected pages redirect to `/login`. But the app
still needs the variables below to actually function (sign-in, vault, billing).

## Set environment variables in Vercel

Project → **Settings → Environment Variables**. Add these for **Production**
(and Preview if you use preview deploys):

### Required for the app to work
| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — never exposed to the browser |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://vault.gaiaapp.net` |
| `NEXT_PUBLIC_REGION` | `au` |
| `RELEASE_WRAPPING_KEY` | 32 bytes base64 (`openssl rand -base64 32`) — see SECURITY.md gate 5 |
| `VAULT_KEY_DERIVATION_PEPPER` | 32 bytes base64 |

### Required for billing
| Variable |
| --- |
| `STRIPE_SECRET_KEY` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| `STRIPE_WEBHOOK_SECRET` |
| `STRIPE_PRICE_ID_ANNUAL` |

### Required for email + nudges + admin
| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | Omit in dev → emails are captured in-memory instead of sent |
| `EMAIL_FROM` | e.g. `Gaia Vault <care@vault.gaiaapp.net>` |
| `ADMIN_ALLOWLIST` | Comma-separated admin emails |
| `CRON_SECRET` | Protects `/api/cron/nudges`; set it as the cron's `Authorization: Bearer` |

### Feature flags (keep these off — see LEGAL-GATES.md)
`FEATURE_CREDENTIALS=false`, `FEATURE_CRM_SYNC=false`, `FEATURE_DEATH_DB_CHECKS=false`

After adding variables, **redeploy** (env changes don't apply to existing
builds). Then run the database migrations against your Supabase project
(`supabase db push`) so the schema, RLS and triggers exist.

## Quick checklist

1. Create the Supabase project (region `ap-southeast-2` for AU residency).
2. `supabase link` + `supabase db push` to apply `supabase/migrations`.
3. Add all env vars above in Vercel.
4. Redeploy.
5. Point the Stripe webhook at `https://<your-domain>/api/stripe/webhook`.
6. Add at least one row to `admin_users` to access the review console.
