-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0006 Recipient grants (the recipient experience)
--
-- After an approved release, the release function re-encrypts each released item
-- under a per-grant key and stores it here, addressed to a single recipient,
-- with a hashed access token and an expiry. The recipient exchanges the token
-- for time-limited access to EXACTLY what they're entitled to — nothing else.
--
-- Content here is re-encrypted (not plaintext): the grant key is derived from
-- the access token, so the row alone is not sufficient to read it.
-- RESIDENCY: grants live in the deceased user's region.
-- ════════════════════════════════════════════════════════════════════════════

create table public.recipient_grants (
  id              uuid primary key default gen_random_uuid(),
  claim_id        uuid not null references public.death_claims (id),
  release_event_id uuid references public.release_events (id),
  recipient_type  recipient_type not null,
  recipient_id    uuid,
  recipient_email text not null,
  -- Re-encrypted payload for this recipient (AES-256-GCM under the grant key).
  enc_version     smallint not null default 1,
  iv              text not null,
  ciphertext      text not null,
  -- SHA-256 of the access token we email; the raw token is never stored.
  token_hash      text not null,
  released_tier   release_tier not null,
  expires_at      timestamptz not null,
  revoked         boolean not null default false,
  accessed_at     timestamptz,
  region          region not null default 'au',
  created_at      timestamptz not null default now()
);
create index recipient_grants_token_idx on public.recipient_grants (token_hash);
create index recipient_grants_claim_idx on public.recipient_grants (claim_id);

alter table public.recipient_grants enable row level security;
-- No user/anon policies: grants are read ONLY by the recipient endpoint via the
-- service role after it validates the token + expiry. Admins may audit-read.
create policy recipient_grants_admin_read on public.recipient_grants
  for select using (public.is_admin());
