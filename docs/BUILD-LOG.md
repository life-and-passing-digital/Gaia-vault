# Gaia Vault — Build log

Staged build per the master spec. Each entry records what shipped and what
remains. Newest stage at the bottom.

---

## Stage 1 — Repo scaffold, design system, component library ✅

**Built**

- Next.js (App Router) + React 19 + TypeScript **strict** scaffold
  (`tsconfig.json` with `noUncheckedIndexedAccess`, `noUnusedLocals`, etc.).
- Tailwind CSS v4 with a CSS-first **design system** matched to the Gaia
  family — sage & forest greens, warm "flame" accent, serif display
  (Fraunces) + clean sans (Inter), soft `rounded-card`, gentle shadows,
  generous whitespace (`app/globals.css`).
- Accessibility baked into the base layer: visible `:focus-visible` rings,
  global `prefers-reduced-motion` handling, `.sr-only`.
- **Component library** (`components/ui`): `Button`, `Card`, `Section`/`Eyebrow`,
  `ProgressRing` (accessible progressbar), `SecureBadge` (honest, no
  zero-knowledge overclaim), `TierTag` (driven by `lib/vault/tiers`),
  `EmptyState`, `Field`/`Input`/`Textarea`; plus `brand/Logo` (leaf-and-flame).
  Documented in `components/README.md`.
- Release-tier domain model (`lib/vault/tiers.ts`) as the single source of
  truth shared by DB enum + UI copy.
- Marketing landing page selling to the **living** (warm tone, "For families"
  CTA, honest security footer).
- Config: `next.config.ts` (security headers), `vercel.json` (`syd1` region for
  AU residency + nudge cron), PWA `manifest.webmanifest`, ESLint/Prettier.
- Env documentation (`.env.example`) including feature flags for every GATED
  capability, and a one-shot `scripts/setup.sh`.
- `README.md` with the read-first safety constraints up top.

**Remains**

- Stages 3–12 as per the master spec.

> Note: dependency install / `next build` not run in this environment; code is
> written to compile under the pinned versions. Run `bash scripts/setup.sh`.

---

## Stage 2 — Supabase schema, migrations, RLS, lib/db adapter ✅

**Built**

- SQL migrations (`supabase/migrations`):
  - `0001_foundation` — extensions, enums (region, plan, section, **release_tier**,
    claim_status…), and SECURITY DEFINER helpers (`current_uid`, `is_admin`).
  - `0002_core_tables` — `profiles`, `vaults`, `vault_sections`, `vault_items`
    (envelope columns: `ciphertext`, `dek_wrapped_user`, `dek_wrapped_escrow`
    with a CHECK that **personal items are never escrowed and release items
    always are**), `nominees`, `funeral_directors`, `item_recipients`,
    `posthumous_messages`, and GATED `credentials` (scaffold only).
  - `0003_claims_releases_audit` — `death_claims` (with manual `corroboration`
    JSON + `authority_confirmed`), append-only `release_events` and `audit_log`,
    `append_audit()`, and the signup trigger that provisions profile + vault +
    seeded sections.
  - `0004_rls_policies` — **RLS enabled on every table**. Owner-only access to
    the vault; **no recipient SELECT** (release is out-of-band); admins reach
    claims only via the review workflow; `credentials` has **no INSERT policy**
    (gated); `release_events`/`audit_log` have **no UPDATE/DELETE** (append-only).
  - `0005_storage` — private `claim-documents` (admin-read only) and
    `vault-attachments` (owner-prefixed) buckets.
- **`lib/db` adapter boundary** — storage-agnostic domain types + `DatabaseAdapter`
  interface; Supabase implementation behind it; `getDb()` (RLS) / `getServiceDb()`
  (service role) the only entry points. No feature code imports `@supabase/*`.
- Supabase client factories (`server`, `client`, `admin`) with a `server-only`
  guard on the service-role client.
- `lib/regions/config.ts` — residency as config (AU live; UK/EU/US architected).

**Remains**

- Stage 3: Auth + MFA + profiles UI + regions wiring.
- Stages 5–12.

---

## Stage 4 — Encryption layer + threat model ✅ (built ahead of Stage 3)

**Built**

- `lib/crypto` — envelope encryption on WebCrypto (portable Node + Deno):
  AES-256-GCM content encryption, HKDF-SHA-256 per-user key derivation,
  AES-GCM key wrapping. Two key paths: personal (`dekWrappedUser`) and release
  escrow (`dekWrappedEscrow`). High-level `sealItem` / `openItemPersonal` /
  `openItemViaEscrow`.
- **Tests (`tests/crypto.test.ts`) — 6 passing**: personal round-trip, cross-user
  rejection, release escrow round-trip, refusal to escrow-open a personal item,
  GCM tamper detection, per-user key distinctness + raw wrap/unwrap.
- **`docs/SECURITY.md`** — honest threat model: exactly what the company CAN and
  CANNOT decrypt and under what conditions; why neither path is zero-knowledge;
  the production KMS/Vault hardening checklist; the "no automated release" rule.
- Toolchain verified in-environment: `npm install`, `tsc --noEmit` (strict)
  **clean**, `vitest` **green**. Next pinned to a non-vulnerable `15.5.19`.

**Remains**

- Stages 3, 5–12.

---

## Stage 3 — Auth, MFA, sessions ✅

**Built**

- `middleware.ts` — refreshes the Supabase session every request and gate-keeps
  protected routes (`/dashboard`, `/vault`, `/people`, `/account`, `/admin`).
- `lib/auth` — `getUser` / `requireUser` / `requireAdmin` (admin checked against
  `admin_users` in the DB, not a client claim) and server actions for
  sign-in / sign-up / sign-out / **MFA challenge** (TOTP, aal2).
- Auth UI — warm login / signup / MFA-verify screens; signup captures the
  **region** (fixed for residency); `/auth/callback` exchanges email codes.
- `components/account/MfaSetup` — optional TOTP enrolment straight to Supabase
  from the browser (secret/QR never touch our server).

## Stage 5 — Vault CRUD, sections, tiers, recipients ✅

**Built**

- `lib/vault/sections` — section metadata + onboarding order + completeness score.
- `lib/vault/actions` — server actions that **wire crypto + db + audit**:
  `createItem` seals plaintext before storage; `listSectionItems` decrypts via
  the personal path; reads/writes/deletes are **audited as actions, never
  payloads**.
- App shell (`(app)/layout` + `AppNav`), dashboard with the **ProgressRing**
  peace-of-mind score, vault overview, per-section editor with the
  **plain-language tier selector** (who gets this, and when), account page with
  MFA + billing entry.
- Typecheck **clean** after each stage.

## Stage 9 — Death-claim intake + admin review + release + audit ✅

See commit "Stages 9 & 10". Public claim intake (service role, sees no vault
data); admin review queue with signed-URL document viewer, GATED manual
corroboration, authority confirmation, approve&release / reject with mandatory
immutable notes; release engine enforcing tier rules with 3 passing tests.

## Stage 10 — Recipient experience + posthumous messages ✅

Token-gated `/access` page (re-encrypted grants, time-limited, audited).
`posthumous_messages` table modelled opt-in/recipient-bound; release delivers a
secure link, never content.

## Stage 6 — Living journeys (people, partner sharing) ✅

Nominees + funeral director + prominent partner sharing (re-encryption shares).

## Stage 7 — Anti-rot nudges ✅

`app/api/cron/nudges` (CRON_SECRET-protected, daily via vercel.json) + Deno
`nudge-scheduler` Edge Function; `markSectionReviewed` action + "last reviewed".

## Stage 8 — Stripe billing ✅

`lib/stripe`, checkout + customer portal actions, signature-verified webhook
mapping subscription status → `profiles.plan`, billing page with consumer-law
auto-renew disclosure copy. Free tier vs A$99/yr.

## Stage 11 — Marketing + Gaia integration hand-off ✅

Marketing landing (Stage 1) + `/security`; `docs/GAIA-INTEGRATION.md` with the
Products-dropdown snippet, shared brand tokens, and the gated CRM-sync path.

## Stage 12 — Docs ✅

`SECURITY.md`, `LEGAL-GATES.md`, `DATA-RESIDENCY.md`, `ADMIN-RUNBOOK.md`,
`GAIA-INTEGRATION.md`, `README.md`, this build log.

## Gated capabilities (visibly disabled, never faked) ✅

`lib/flags.ts`; credentials page renders "pending security review" (no fake
form; no DB insert policy); `lib/integrations/crm.ts` throws while
`FEATURE_CRM_SYNC=false`; corroboration panel is manual-only.

## Edge Functions (production isolation) ✅

`supabase/functions/release` and `nudge-scheduler` (Deno mirrors) + shared Deno
crypto, with KMS hardening notes.

---

### Verification status

- `tsc --noEmit` (strict) **clean**; `vitest` **9/9 green** (crypto + release).
- Not run in this environment: `next build` and a live Supabase deploy (no
  project/secrets here). Run `bash scripts/setup.sh` + `supabase db push`.

### Known follow-ups before production

- Production KMS/Vault for keys (SECURITY.md gate 5); complete the
  `LEGAL-GATES.md` sign-offs; wire the admin approval to invoke the release
  **Edge Function** instead of the in-process server action once KMS is in place;
  partner-share "accept" UX + a "Shared with me" page; posthumous-message
  composer UI; RLS integration tests against a live database.
