# Gaia Vault

> Organise what matters, for the people you trust.

Gaia Vault is a production-grade B2C web app in the **Gaia** product family
(alongside Gaia CRM, Gaia App, Funerals Live and Moments by Gaia). It helps
people gently organise their wishes, important people, documents, assets and
messages — and release them, with care and human review, to the people they
trust after death.

It is a **standalone** app intended for `vault.gaiaapp.net`, deployed on Vercel.

---

## Read this first — safety, not features

This product holds the most sensitive data a person owns. Several capabilities
are **legally gated** and deliberately *not* built as live features in v1. See
**[`docs/LEGAL-GATES.md`](docs/LEGAL-GATES.md)** for the full list. The
non-negotiables:

1. **No automated death release.** Releasing data is a **human-reviewed**
   workflow. A database signal must never trigger release. Path: claim →
   death certificate + proof of authority → admin review → approval → release.
2. **Real encryption.** Vault contents are encrypted (AES-256-GCM). The
   "release set" uses a **separate key path** so authorised recipients can
   decrypt after death — it is **not** zero-knowledge, and the UI says so.
3. **Financial credentials / password-manager import:** scaffolded but
   **disabled** (`FEATURE_CREDENTIALS=false`).
4. **Death-database checks** (Australian Death Check, LADMF, Tell Us Once):
   **no live integrations** — admin-only manual corroboration panel only.
5. **Split releases by type.** Funeral wishes release fast; estate/financial
   data waits for proof of authority (probate / letters of administration).
6. **Data residency.** v1 is single-region **AU**; region is config, not code.

---

## Stack

| Concern    | Choice                                                            |
| ---------- | ----------------------------------------------------------------- |
| Framework  | Next.js (App Router), React 19, TypeScript **strict**             |
| Styling    | Tailwind CSS v4 (CSS-first `@theme` tokens)                       |
| Backend    | Supabase — Postgres, Auth, Storage, RLS, Edge Functions          |
| Payments   | Stripe (free tier + ~A$99/yr plan)                                |
| Hosting    | Vercel (`syd1` region for AU residency)                           |
| Email      | Resend (abstracted behind `lib/email`)                            |

All data access is behind a **`lib/db` adapter** so the backend can be swapped
(e.g. to Firebase) without touching feature code.

---

## Getting started

```bash
git clone <repo> && cd gaia-vault
bash scripts/setup.sh        # installs deps, makes .env.local, generates dev keys
# fill in the remaining secrets in .env.local
npm run dev                  # http://localhost:3000
```

Then, for the database:

```bash
supabase start               # local Postgres + Auth + Storage
supabase db push             # apply migrations in supabase/migrations
```

### Required environment

See [`.env.example`](.env.example) — every variable is documented there.
**All secrets live in env, never in code.**

---

## Project layout

```
app/                 Next.js App Router (marketing, auth, app, claim, admin)
components/ui/        Design-system primitives (see components/README.md)
components/brand/     Logo & brand marks
lib/
  db/                 Database adapter boundary (swap Supabase ↔ other)
  crypto/             Application-layer encryption (AES-256-GCM, envelope)
  email/              Transactional & nudge email abstraction
  supabase/           Supabase server/client/admin factories
  regions/            Data-residency region config (RESIDENCY)
  vault/              Domain: release tiers, sections
supabase/
  migrations/         SQL schema + RLS policies
  functions/          Edge Functions (release, nudge scheduler)
docs/                 SECURITY · LEGAL-GATES · DATA-RESIDENCY · ADMIN-RUNBOOK
scripts/              setup.sh and ops scripts
tests/                Crypto, RLS, release-workflow tests
```

---

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Local dev server                      |
| `npm run build`     | Production build                      |
| `npm run typecheck` | `tsc --noEmit` (strict)               |
| `npm run lint`      | ESLint                                |
| `npm test`          | Vitest (crypto, RLS, release)         |
| `npm run db:migrate`| `supabase db push`                    |

---

## Documentation

- [`docs/SECURITY.md`](docs/SECURITY.md) — encryption architecture & honest threat model
- [`docs/LEGAL-GATES.md`](docs/LEGAL-GATES.md) — every gated capability and sign-off needed
- [`docs/DATA-RESIDENCY.md`](docs/DATA-RESIDENCY.md) — regional storage design
- [`docs/ADMIN-RUNBOOK.md`](docs/ADMIN-RUNBOOK.md) — running the review & release console

## Build status

This repository is being built in the staged sequence from the master spec.
See [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) for what each stage delivered and
what remains.
