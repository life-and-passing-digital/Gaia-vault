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

- Stage 2: Supabase schema, migrations, RLS on every table, `lib/db` adapter.
- Stages 3–12 as per the master spec.

> Note: dependency install / `next build` not run in this environment; code is
> written to compile under the pinned versions. Run `bash scripts/setup.sh`.
