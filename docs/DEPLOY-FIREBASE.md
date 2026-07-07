# Deploying Gaia Vault on the main website's Firebase infrastructure

Goal: the Vault app runs at **`https://gaiaapp.net/vault-app`** — same domain,
same Firebase project (`gaia-website-bcc7c`) as the website. No subdomain, no
redirect off-site.

How it works: Firebase Hosting (the static site) rewrites `/vault-app/**` to a
**Cloud Run** service in the same project. The app is containerised
(`Dockerfile`) and built with `NEXT_PUBLIC_BASE_PATH=/vault-app`, so every
route, asset and link lives under that prefix. This repo's
`.github/workflows/deploy-cloudrun.yml` does the deploy.

Verified locally: `next build` with the base path + the standalone server
serves `/vault-app` and `/vault-app/dashboard` with zero broken assets.

## One-time setup (founder — ~5 minutes)

1. **Enable APIs** on `gaia-website-bcc7c` (needs billing enabled):
   [Cloud Run](https://console.cloud.google.com/apis/library/run.googleapis.com?project=gaia-website-bcc7c),
   [Cloud Build](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=gaia-website-bcc7c),
   [Artifact Registry](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=gaia-website-bcc7c).

2. **Create a deploy service account** (IAM → Service Accounts → Create):
   name `gaia-vault-deployer`, grant roles **Cloud Run Admin**,
   **Cloud Build Editor**, **Service Account User**, **Artifact Registry
   Writer**, **Storage Admin** (Cloud Build staging bucket). Create a JSON key.

3. **Add the key to this repo**: GitHub → Gaia-vault → Settings → Secrets →
   Actions → new secret **`GCP_SA_KEY`**, paste the JSON.

4. **Run the workflow**: Actions tab → "Deploy to Cloud Run" → Run workflow.
   First build takes ~5–8 min and prints the service URL.

## Wiring the website (Claude can do this once step 4 is green)

Add to `gaia-website-static/firebase.json` under `hosting`, **before** the
other rewrites:

```json
"rewrites": [
  {
    "source": "/vault-app{,/**}",
    "run": { "serviceId": "gaia-vault", "region": "australia-southeast1" }
  },
  ...existing rewrites...
]
```

Then replace the `/open-vault` and `/vault-login` redirect destinations with
`/vault-app/signup` and `/vault-app/login` (or link pages straight to those
paths) and push to `main`. Everything then serves from gaiaapp.net.

## Still demo mode until a database is connected

The image builds with `NEXT_PUBLIC_DEMO_MODE=true`: fully explorable, sample
data, nothing persisted. To go live with real accounts:

1. Restore/create a Supabase project (AU region), run `supabase/migrations`.
2. Rebuild with `--build-arg NEXT_PUBLIC_DEMO_MODE=false` and set the runtime
   env vars from `docs/DEPLOY-VERCEL.md` (Supabase URL/keys, vault pepper,
   release wrapping key, Stripe, Resend) on the Cloud Run service.
3. The daily nudges cron (`/api/cron/nudges`, previously a Vercel cron) needs a
   Cloud Scheduler job hitting that path once a day.

Longer term, `lib/db` is an adapter boundary: the backend can be swapped to
Firebase Auth + Firestore without touching feature code, if consolidating on
Firebase is preferred over Supabase. That is a separate, larger piece of work.

## Vercel

The Vercel project (`gaia-vault`, prod branch `claude/gaia-vault-master-spec-apa78j`)
keeps working unchanged — builds there have no `NEXT_PUBLIC_BASE_PATH`, so it
serves at `/` as before. Retire it once Cloud Run is wired in.
