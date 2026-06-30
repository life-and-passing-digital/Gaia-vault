# Gaia Vault — Data residency

Gaia Vault is architected so a user's data lives, and stays, in their chosen
region. v1 ships a **single AU region**; the region is **configuration, not
code**, so UK/EU/US can be added without refactoring feature code.

## Principle

> A user is bound to one region at signup. Everything about them — database
> rows, encrypted vault contents, uploaded documents, recipient grants — lives
> in that region's infrastructure. We never silently move it.

## Where residency is expressed

| Layer | Mechanism |
| --- | --- |
| Config | `lib/regions/config.ts` — `REGIONS` map; `activeRegion()`. AU `enabled: true`, others architected but `enabled: false`. |
| Env | `NEXT_PUBLIC_REGION` selects the region a deployment serves. |
| Hosting | `vercel.json` pins `regions: ["syd1"]` (Sydney). |
| Database | Supabase project provisioned in `ap-southeast-2`; `region` column on every table records residency on the row itself. |
| Storage | Supabase Storage lives in the same regional project (private buckets). |
| Code markers | `// RESIDENCY:` comments at every storage boundary (migrations, crypto, claim uploads, grants). |

## Adding a region (no feature-code change)

1. Set `enabled: true` for the region in `lib/regions/config.ts` (and add it if
   missing).
2. Provision a Supabase project + Vercel deployment in that locale.
3. Set that deployment's `NEXT_PUBLIC_REGION` and Supabase env.
4. Route users to the correct regional deployment (e.g. `au.vault.gaiaapp.net`,
   `uk.vault.gaiaapp.net`) at signup based on their chosen region.

No table, query, or feature module changes — they already read `region` from
config and persist it per row.

## What stays in region

- Profiles, vaults, sections, items (encrypted), nominees, funeral directors.
- Death claims and their uploaded documents (death certificate, proof of
  authority) — private buckets, in region.
- Release events, recipient grants, audit log.

## Cross-region

- v1 has **no** cross-region data movement. If a user relocates, region change
  is a deliberate, supported migration (future work), not an automatic action.
- The release flow operates entirely within the deceased user's region.

## Open items before multi-region production

- [ ] Region-aware routing at the edge (signup → correct regional host).
- [ ] Per-region KMS for the wrapping key (see `SECURITY.md` gate 5).
- [ ] Confirm Supabase Auth user pool strategy per region (separate projects).
- [ ] DPO review of each region's legal basis and sub-processors.
