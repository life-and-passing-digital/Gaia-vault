# Gaia Vault — Legal gates

This is the master list of capabilities that are **deliberately disabled,
stubbed, or human-gated** in v1, and exactly what must happen before each can be
enabled for real customer data in production. Nothing on this list may be turned
on by an engineer alone — each requires the named sign-off.

Every gated capability in the codebase carries a `// LEGAL-GATE:` comment
pointing back here. Gated features are **visibly disabled, never faked**.

---

## How to read this

| Field | Meaning |
| --- | --- |
| **State** | How it ships in v1. |
| **Flag / control** | The switch that keeps it off. |
| **Before enabling** | The sign-offs and work required first. |

---

## 1. Automated death release — PERMANENTLY HUMAN-GATED

- **State:** Releasing data is a human-reviewed workflow. There is **no**
  automated path, timer, or database signal that releases data.
- **Control:** Architectural. The release engine (`lib/release/execute.ts`) is
  only reachable from the admin approval action (`approveAndRelease`), which is
  behind `requireAdmin`. `executeRelease` refuses any claim not in `approved`.
- **Before changing:** This one is not a "later we'll automate it" gate. Any
  proposal to reduce human review requires Legal + the company principals and a
  documented regulatory basis. Default answer is **no**.

## 2. Financial credentials / password-manager import — DISABLED

- **State:** Data model scaffolded (`credentials` table) but creation is
  impossible: `FEATURE_CREDENTIALS=false` in the app **and** there is **no RLS
  INSERT policy** on the table. UI shows "Coming soon, pending security review."
- **Control:** `FEATURE_CREDENTIALS` env flag + absent DB insert policy.
- **Before enabling:**
  - [ ] Legal opinion on **GLBA** (US) and equivalent obligations.
  - [ ] Legal opinion on **computer-misuse / unauthorised-access** exposure of
        holding and using third-party financial credentials.
  - [ ] Security review of credential storage + a separate threat model.
  - [ ] Add a scoped RLS INSERT policy and flip the flag.
  - **Sign-off:** Legal counsel + Security reviewer.

## 3. Automated death-database checks (Australian Death Check, LADMF, Tell Us Once) — NO LIVE INTEGRATIONS

- **State:** Admin-only **manual** corroboration panel. Free-text notes only.
  No outbound calls to any death database.
- **Control:** `FEATURE_DEATH_DB_CHECKS=false`. The corroboration field is plain
  JSON entered by a human and is **never** a release trigger.
- **Before enabling:**
  - [ ] Contracts / data-sharing agreements with each provider.
  - [ ] Legal review confirming any signal remains **corroboration, never a
        trigger** (the human review stays mandatory).
  - [ ] Privacy assessment for querying third parties about a named individual.
  - **Sign-off:** Legal counsel + Privacy/DPO.

## 4. Cross-product data sharing with Gaia CRM — STUBBED

- **State:** Integration interface defined; no live sync.
- **Control:** `FEATURE_CRM_SYNC=false`. See `lib/integrations/crm.ts`.
- **Before enabling:**
  - [ ] Explicit user **consent** flow for cross-product sharing.
  - [ ] **DPA** between products / entities.
  - [ ] Data-mapping + minimisation review (only what's necessary).
  - **Sign-off:** Legal counsel + Privacy/DPO.

## 5. Encryption key custody — PRODUCTION HARDENING REQUIRED

- **State:** v1 holds `RELEASE_WRAPPING_KEY` and `VAULT_KEY_DERIVATION_PEPPER`
  in env. Functional but **not acceptable for real customer data**.
- **Control:** `lib/crypto` reads them from env with a `PRODUCTION HARDENING
  TODO` marker.
- **Before handling real data:**
  - [ ] Move both into a **KMS/HSM or Supabase Vault**; raw key never in app env.
  - [ ] Scope KMS-decrypt to the release identity only, with audit on every use.
  - [ ] Key-rotation runbook (the `enc_version` column already supports it).
  - **Sign-off:** Security reviewer.

## 6. Release-set is not zero-knowledge — DISCLOSURE REQUIRED

- **State:** Personal and release paths are both server-recoverable. UI and
  `docs/SECURITY.md` say so plainly; no zero-knowledge claim appears anywhere.
- **Before launch:**
  - [ ] Legal/marketing review that **no public claim overstates** the
        encryption (no "end-to-end" / "zero-knowledge" language).
  - **Sign-off:** Legal counsel + Marketing.

## 7. Consumer billing copy — REVIEW REQUIRED

- **State:** Stripe subscription with auto-renew. Disclosure copy drafted.
- **Before launch:**
  - [ ] Review auto-renew + cancellation copy against **Australian Consumer
        Law** (and each region added later).
  - **Sign-off:** Legal counsel.

---

## Pre-production sign-off checklist (must all be complete)

- [ ] **Security reviewer:** crypto design, key custody (gate 5), RLS, pen-test.
- [ ] **Legal counsel:** gates 1, 2, 3, 4, 6, 7.
- [ ] **Privacy / DPO:** gates 3, 4; data-residency posture (`DATA-RESIDENCY.md`);
      nominee (living third-party) data handling.
- [ ] **Clinical/bereavement review** of the death-claim and recipient flows for
      tone and harm-minimisation.
- [ ] `docs/SECURITY.md` "Last reviewed" stamp updated and signed.

No real customer data may be onboarded until every box above is checked.
