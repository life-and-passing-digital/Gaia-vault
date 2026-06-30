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
