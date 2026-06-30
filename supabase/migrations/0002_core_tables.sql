-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0002 Core tables (the living user's world)
--
-- Every table carries a `region` for residency and is protected by RLS (added
-- in 0004). Encrypted columns hold AES-256-GCM output produced by lib/crypto;
-- the database never sees plaintext vault contents. RESIDENCY markers note each
-- storage boundary.
-- ════════════════════════════════════════════════════════════════════════════

-- ── admin_users ─────────────────────────────────────────────────────────────
-- Tiny allowlist of internal reviewers. Membership is managed out-of-band
-- (migration / secure ops), never self-service.
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  added_at   timestamptz not null default now(),
  note       text
);

-- ── profiles ────────────────────────────────────────────────────────────────
-- RESIDENCY: a profile is bound to exactly one region for its lifetime.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  region        region not null default 'au',
  plan          plan_tier not null default 'free',
  plan_status   plan_status not null default 'none',
  mfa_enabled   boolean not null default false,
  stripe_customer_id text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── vaults ──────────────────────────────────────────────────────────────────
-- One vault per user, created automatically on signup (trigger in 0003).
create table public.vaults (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references public.profiles (id) on delete cascade,
  region      region not null default 'au', -- RESIDENCY: storage boundary
  created_at  timestamptz not null default now()
);

-- ── vault_sections ──────────────────────────────────────────────────────────
-- Per-section metadata (anti-rot review stamps live here). One row per section
-- type per vault, seeded on vault creation.
create table public.vault_sections (
  id                uuid primary key default gen_random_uuid(),
  vault_id          uuid not null references public.vaults (id) on delete cascade,
  section           section_type not null,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  unique (vault_id, section)
);

-- ── vault_items ─────────────────────────────────────────────────────────────
-- The encrypted heart of the product. Envelope encryption (see /docs/SECURITY):
--   ciphertext        = item plaintext encrypted under a per-item data key (DEK)
--   dek_wrapped_user  = the DEK wrapped to the user's key (personal path)
--   dek_wrapped_escrow= the DEK wrapped to the company wrapping key, present
--                       ONLY for release tiers so an approved release Edge
--                       Function can re-wrap it to a recipient. NULL for
--                       'personal' items — those are never escrowed.
-- RESIDENCY: ciphertext stored in-region. No plaintext, no titles in the clear.
create table public.vault_items (
  id                 uuid primary key default gen_random_uuid(),
  vault_id           uuid not null references public.vaults (id) on delete cascade,
  section            section_type not null,
  release_tier       release_tier not null default 'personal',
  enc_version        smallint not null default 1,
  iv                 text not null,             -- base64 GCM nonce
  ciphertext         text not null,             -- base64 GCM ciphertext+tag
  dek_wrapped_user   text not null,             -- base64 wrapped DEK (personal)
  dek_wrapped_escrow text,                      -- base64 wrapped DEK (release only)
  region             region not null default 'au',
  last_reviewed_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- A release-tier item MUST carry an escrow-wrapped DEK; a personal item
  -- MUST NOT. This invariant is the difference between "releasable" and "not".
  constraint escrow_matches_tier check (
    (release_tier = 'personal' and dek_wrapped_escrow is null)
    or (release_tier <> 'personal' and dek_wrapped_escrow is not null)
  )
);
create index vault_items_vault_idx on public.vault_items (vault_id);
create index vault_items_tier_idx on public.vault_items (vault_id, release_tier);

-- ── nominees ────────────────────────────────────────────────────────────────
-- People to notify / receive. Nominees are LIVING data subjects — their contact
-- details are protected by the same owner-only RLS as the rest of the vault.
create table public.nominees (
  id             uuid primary key default gen_random_uuid(),
  vault_id       uuid not null references public.vaults (id) on delete cascade,
  full_name      text not null,
  relationship   text,
  email          text,
  phone          text,
  -- The highest tier this nominee is entitled to receive on release.
  entitled_tier  release_tier not null default 'funeral_wishes',
  notify_on_release boolean not null default true,
  region         region not null default 'au', -- RESIDENCY
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index nominees_vault_idx on public.nominees (vault_id);

-- ── funeral_directors ───────────────────────────────────────────────────────
-- Authorised directors who may receive funeral wishes on approval.
create table public.funeral_directors (
  id            uuid primary key default gen_random_uuid(),
  vault_id      uuid not null references public.vaults (id) on delete cascade,
  business_name text not null,
  contact_name  text,
  email         text not null,
  phone         text,
  authorised    boolean not null default false,
  region        region not null default 'au', -- RESIDENCY
  created_at    timestamptz not null default now()
);
create index funeral_directors_vault_idx on public.funeral_directors (vault_id);

-- ── item_recipients ─────────────────────────────────────────────────────────
-- Binds a vault item to who should receive it on release. Both the item's tier
-- and the recipient's entitlement are checked at release time.
create table public.item_recipients (
  id             uuid primary key default gen_random_uuid(),
  vault_item_id  uuid not null references public.vault_items (id) on delete cascade,
  recipient_type recipient_type not null,
  nominee_id     uuid references public.nominees (id) on delete cascade,
  director_id    uuid references public.funeral_directors (id) on delete cascade,
  created_at     timestamptz not null default now(),
  constraint one_recipient check (
    (recipient_type = 'nominee' and nominee_id is not null and director_id is null)
    or (recipient_type = 'funeral_director' and director_id is not null and nominee_id is null)
  )
);
create index item_recipients_item_idx on public.item_recipients (vault_item_id);

-- ── posthumous_messages ─────────────────────────────────────────────────────
-- Opt-in, recipient-bound, gently delivered. The recipient is notified that
-- *something exists* and must log in to view it — never pushed into an inbox.
create table public.posthumous_messages (
  id                 uuid primary key default gen_random_uuid(),
  vault_id           uuid not null references public.vaults (id) on delete cascade,
  recipient_nominee_id uuid references public.nominees (id) on delete set null,
  recipient_name     text not null,
  recipient_email    text,
  enc_version        smallint not null default 1,
  iv                 text not null,
  ciphertext         text not null,
  dek_wrapped_escrow text not null, -- always escrowed: delivered after death
  deliver_gently     boolean not null default true,
  opt_in             boolean not null default true,
  region             region not null default 'au', -- RESIDENCY
  created_at         timestamptz not null default now()
);
create index posthumous_messages_vault_idx on public.posthumous_messages (vault_id);

-- ── credentials — GATED, scaffold only ──────────────────────────────────────
-- LEGAL-GATE: financial credentials require GLBA + computer-misuse legal
-- opinion before enabling. The table exists so the data model is complete, but
-- creation is disabled behind FEATURE_CREDENTIALS=false in the app AND denied
-- at the database layer (see 0004 RLS — no insert policy exists). Do NOT enable
-- without the sign-offs listed in /docs/LEGAL-GATES.md.
create table public.credentials (
  id            uuid primary key default gen_random_uuid(),
  vault_id      uuid not null references public.vaults (id) on delete cascade,
  label         text not null,
  enc_version   smallint not null default 1,
  iv            text not null,
  ciphertext    text not null,
  dek_wrapped_user text not null,
  region        region not null default 'au',
  created_at    timestamptz not null default now()
);
