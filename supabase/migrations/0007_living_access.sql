-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0007 Living access (share with a partner while alive)
--
-- A key value/retention driver: invite a spouse/partner to co-view designated
-- items NOW. Because vault items are encrypted under the owner's key, sharing
-- works by re-encrypting the chosen item under the PARTNER's user key into
-- `living_shares` — the partner can decrypt their own shares, the owner can
-- manage them, and nobody else sees anything. This is the same envelope idea as
-- release, but between two living users.
-- RESIDENCY: shares live in the owner's region.
-- ════════════════════════════════════════════════════════════════════════════

create type living_access_status as enum ('invited', 'accepted', 'revoked');

-- An invitation to a partner (who may or may not have an account yet).
create table public.living_access_invites (
  id            uuid primary key default gen_random_uuid(),
  vault_id      uuid not null references public.vaults (id) on delete cascade,
  partner_email text not null,
  partner_id    uuid references public.profiles (id) on delete set null,
  status        living_access_status not null default 'invited',
  region        region not null default 'au',
  created_at    timestamptz not null default now(),
  unique (vault_id, partner_email)
);
create index living_invites_partner_idx on public.living_access_invites (partner_id);

-- A single item re-encrypted for one partner to read while the owner is alive.
create table public.living_shares (
  id            uuid primary key default gen_random_uuid(),
  vault_id      uuid not null references public.vaults (id) on delete cascade,
  partner_id    uuid not null references public.profiles (id) on delete cascade,
  vault_item_id uuid not null references public.vault_items (id) on delete cascade,
  enc_version   smallint not null default 1,
  iv            text not null,
  ciphertext    text not null, -- re-encrypted under the partner's user key
  created_at    timestamptz not null default now(),
  unique (vault_item_id, partner_id)
);
create index living_shares_partner_idx on public.living_shares (partner_id);

alter table public.living_access_invites enable row level security;
alter table public.living_shares enable row level security;

-- Owner manages invites for their own vault; an invited partner can see invites
-- addressed to them (to accept).
create policy invites_owner_all on public.living_access_invites
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));
create policy invites_partner_read on public.living_access_invites
  for select using (partner_id = auth.uid());

-- Owner manages shares for their vault; the partner may READ shares addressed to
-- them (and decrypt with their own key). Partners cannot write.
create policy shares_owner_all on public.living_shares
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));
create policy shares_partner_read on public.living_shares
  for select using (partner_id = auth.uid());
