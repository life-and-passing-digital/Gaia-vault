# Gaia Vault — Security & encryption architecture

This document describes, honestly, how Gaia Vault protects data and — just as
importantly — **what it cannot protect against and under what conditions the
company can decrypt data**. We do not overclaim. The product UI is written to
match this document; if you change one, change the other.

> One-line summary: vault contents are encrypted with AES-256-GCM using
> envelope encryption. The personal path is server-recoverable (not
> zero-knowledge). The "release set" is **deliberately** recoverable by an
> approved, human-reviewed release process — that is its entire purpose — and is
> therefore **not zero-knowledge**. We never claim end-to-end-zero-knowledge.

---

## 1. Cryptographic design

### Primitives

- **Content encryption:** AES-256-GCM (96-bit random nonce, 128-bit tag).
- **Key derivation:** HKDF-SHA-256.
- **Key wrapping:** AES-256-GCM (a DEK encrypted under a key-encryption-key).
- Implemented once in `lib/crypto/index.ts` on WebCrypto so the identical
  scheme runs in Node (server actions) and Deno (Edge Functions).

### Envelope scheme

Every vault item is encrypted under its own random **data key (DEK)**:

```
plaintext ──AES-256-GCM(DEK)──▶ ciphertext         (stored)
DEK ──wrap(userKey)──▶ dekWrappedUser               (stored, always)
DEK ──wrap(wrappingKey)──▶ dekWrappedEscrow         (stored, release tiers only)
```

- `userKey = HKDF-SHA256(ikm = server pepper, salt = userId)` — see §3.
- `wrappingKey = RELEASE_WRAPPING_KEY` — the company escrow key, see §4.

A database CHECK constraint enforces the core invariant:

> **Personal items are never escrowed; release-tier items always are.**
> (`vault_items.escrow_matches_tier` in migration `0002`.)

This is the structural line between "can be released" and "can never be
released." It is enforced by the database, not just the app.

---

## 2. The two key paths

| | **Personal path** | **Release path** |
|---|---|---|
| Tiers | `personal` | `funeral_wishes`, `estate_authority` |
| Wrapped to | user key only | user key **and** escrow wrapping key |
| Decryptable by | owner via the app; server with pepper | owner while alive; the approved release process after death |
| On death | never released | released after human review (see §6) |
| Zero-knowledge? | No (server-recoverable) | No (by design) |

---

## 3. The personal path — and why it is not zero-knowledge

`userKey` is derived from a **server-held pepper** (`VAULT_KEY_DERIVATION_PEPPER`)
and the user id. In normal operation only the authenticated user reaches their
decrypted data, because:

- Row Level Security limits every query to the owner's own vault, and
- decryption happens only in server code acting on the authenticated session.

**However**, a party holding both the database and the pepper *can* derive
`userKey` and decrypt personal items. We are explicit about this:

- We **do not** claim end-to-end or zero-knowledge encryption anywhere in the
  product.
- The `SecureBadge` component defaults to the modest label "Encrypted," never
  "zero-knowledge."

**Why not zero-knowledge?** True zero-knowledge would derive the key from a
secret only the user holds (e.g. their password, client-side). That is
incompatible with v1's requirements — notably account recovery and the release
mechanism — and is noted as a future option in §8. Choosing server-side
derivation is a deliberate, disclosed trade-off, not an accident.

---

## 4. The release path & escrow

Release-tier items additionally wrap their DEK under the company
`RELEASE_WRAPPING_KEY`. This escrow is what allows an **approved** release to
recover the data for the right recipient after death.

- The wrapping key is used **only** inside the approved release context
  (`openItemViaEscrow`, called by the release Edge Function / trusted server
  action) and only after an admin has approved a death claim.
- `openItemViaEscrow` throws on personal items — they carry no escrow key, so
  they are cryptographically un-releasable even if the release code is invoked
  on them by mistake.

### What the company CAN decrypt

- **Release-set items**, given the database + the wrapping key. This is
  intentional and disclosed; it is the only way to deliver wishes/estate data
  to recipients after death.
- **Personal items**, given the database + the pepper (see §3).

### What the company CANNOT do

- Release anything **without** a human-reviewed, approved death claim. There is
  no database signal, cron, or automated path that releases data (see §6). The
  cryptography makes release *possible*; the workflow makes it *lawful and
  reviewed*.
- Distinguish, weaken, or bypass GCM authentication — tampered ciphertext fails
  to decrypt (tested in `tests/crypto.test.ts`).

---

## 5. Production hardening (TODO before real customer data)

v1 holds the wrapping key and pepper in environment variables. **This is not
acceptable for production with real customer data.** Before go-live:

- [ ] Move `RELEASE_WRAPPING_KEY` into a **KMS / HSM** (e.g. AWS KMS, GCP KMS)
      or **Supabase Vault**, so the raw key is never present in app env. The
      release function should call the KMS to unwrap, never hold the key.
- [ ] Move `VAULT_KEY_DERIVATION_PEPPER` into the same managed secret store.
- [ ] Scope KMS decrypt permission so it is usable **only** by the release
      function's identity, with full CloudTrail/audit on every unwrap.
- [ ] Add key rotation: `enc_version` already exists on every encrypted row to
      support envelope re-wrapping under a new key generation.
- [ ] Independent security review and penetration test (see
      `docs/LEGAL-GATES.md`).

These are flagged in code with `PRODUCTION HARDENING TODO` next to
`releaseWrappingKey()`.

---

## 6. No automated death release (the most important rule)

Releasing data is a **human-reviewed workflow**, never automation:

```
bereaved party submits a claim
  → uploads death certificate + proof of authority
  → admin reviews in the internal queue (with corroboration, §7)
  → admin approves (mandatory notes)
  → release function decrypts the appropriate tier and delivers to recipients
  → immutable release_events + audit_log written
```

- **Funeral wishes** may release quickly to an authorised funeral director on
  approval.
- **Estate/financial** items require `authority_confirmed` (proof of legal
  authority — grant of probate / letters of administration / letters
  testamentary) logged by the admin before release.

There is no code path that releases data from a database flag, timer, or
third-party "death signal."

---

## 7. Corroboration is not a trigger (GATED)

The admin console includes a corroboration panel for recording external checks
(e.g. Australian Death Check, LADMF, Tell Us Once). In v1 these are **manual
entry only** — there are **no live integrations**. Corroboration informs the
human reviewer; it never triggers release. See `docs/LEGAL-GATES.md`.

---

## 8. Other controls

- **Transport:** TLS everywhere; HSTS preload header.
- **At rest:** application-layer AES-256-GCM *plus* the provider's at-rest
  encryption.
- **Authentication:** Supabase Auth; **MFA (TOTP) available** and surfaced in
  account settings.
- **Authorization:** Row Level Security on every table; service-role key is
  `server-only` and never shipped to the browser.
- **Audit:** append-only `audit_log` and immutable `release_events`. We log
  **actions, never payloads or secrets**.
- **Headers:** strict CSP-adjacent headers (`X-Frame-Options: DENY`,
  `nosniff`, restrictive `Permissions-Policy`) in `next.config.ts`.

## 9. Threats explicitly out of scope for v1

- A fully compromised production host holding both the database and the live
  KMS-decrypt identity. (KMS audit + least privilege reduces, not eliminates,
  this. Disclosed, not hidden.)
- Client-device compromise of a logged-in user.
- Future zero-knowledge personal path (would require client-derived keys and a
  separate recovery story) — a candidate for v2, not a v1 claim.

---

_Last reviewed: keep this stamp current. This document must be signed off by a
security reviewer before Gaia Vault handles real customer data — see
`docs/LEGAL-GATES.md`._
