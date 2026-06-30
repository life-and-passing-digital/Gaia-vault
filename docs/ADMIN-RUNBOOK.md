# Gaia Vault — Admin runbook

For the internal team operating the death-claim review and release console. This
is sensitive work: you are deciding when a deceased person's information is
shared. Move carefully, document everything, and when in doubt, **do not
release** — ask.

## Becoming an admin

Admin access is an explicit allowlist, set out-of-band — never self-service:

1. Add the user to the `admin_users` table (SQL / secure ops), e.g.:
   ```sql
   insert into public.admin_users (user_id, email, note)
   values ('<auth-user-uuid>', 'reviewer@gaiaapp.net', 'Bereavement team');
   ```
2. Also add their email to `ADMIN_ALLOWLIST` env (defence in depth).
3. They sign in normally; the **Admin** nav item appears.

Every admin action is written to the append-only `audit_log`. Assume your work
is reviewed.

## The review queue

`/admin/claims` lists every claim. Statuses: `submitted → under_review →
approved | rejected`.

### 1. Open a claim and start review

- Open the claim. Click **Start review** — this matches the deceased's email to
  their profile and moves the claim to `under_review` (audited).
- If no profile matches, the deceased may have used a different email. Confirm
  identity another way before proceeding; do not approve an unmatched claim.

### 2. Verify the documents

- Use the **Death certificate** / **Proof of authority** buttons. These mint a
  **5-minute signed URL** and the view is audit-logged.
- Confirm the certificate is genuine and matches the claimed person.

### 3. Corroborate (manual only)

- Record independent corroboration in the **Corroboration** panel (e.g.
  funeral-director phone confirmation, published notice).
- **There are no live death-database integrations.** Corroboration informs your
  judgement; it is never a trigger. (`LEGAL-GATE`.)

### 4. Authority for estate/financial items

- Funeral wishes can be released on approval.
- **Estate/financial items are held back** until you click **Confirm authority**
  with a note describing the legal authority sighted (grant of probate / letters
  of administration / letters testamentary).
- Until then, approving a claim releases funeral wishes only; estate items are
  skipped and reported as `estate_authority_not_confirmed`.

### 5. Decision

- **Notes are mandatory** for both approve and reject — they are recorded
  immutably.
- **Approve & release** runs the release engine:
  - decrypts releasable items via the escrow path,
  - re-encrypts each under a per-recipient token grant (14-day expiry),
  - writes immutable `release_events`,
  - emails each recipient a **secure link, never the content**.
- **Reject** closes the claim with your reason.

The result message tells you how many items released and how many grants were
created. Skipped items (no eligible recipient, or estate-without-authority) are
recorded in the audit log.

## After release

- Recipients use their emailed link (`/access?token=…`). Access is time-limited
  and logged; first access is stamped on the grant.
- To withdraw access, set `revoked = true` on the relevant `recipient_grants`
  row (audited via DB). A self-service revoke control is future work.

## If something looks wrong

- **Do not approve.** Reject or leave in review and escalate to the principals.
- Suspected fraudulent claim: reject with a clear note; preserve the documents
  (they remain in the private bucket) for follow-up.
- Release error after approval: the claim is approved but the audit log will
  show `release.failed` with the error. Investigate before re-running; do not
  repeatedly retry.

## Never

- Never share vault contents over email, chat, or phone. The system delivers via
  secure links only.
- Never release estate/financial items without confirmed authority.
- Never bypass the queue or edit data directly to "speed things up."
- Never disable MFA on your own admin account.
