-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0004 Row Level Security
--
-- Defence in depth: even though the app uses a lib/db adapter with its own
-- checks, the database is the final authority. Principles:
--   • A user sees ONLY their own vault and everything hanging off it.
--   • Nominees / funeral directors see NOTHING here — release happens out-of-band
--     through the release Edge Function (service role), which mints time-limited
--     recipient access. There is deliberately no "recipient" SELECT policy.
--   • Admins reach death_claims ONLY through the review workflow; every touch is
--     audit-logged at the application layer.
--   • credentials are GATED: no INSERT policy exists at all.
--   • release_events & audit_log are append-only: no UPDATE/DELETE policy exists.
--
-- The service role bypasses RLS by design and is used only by trusted server
-- code (server actions, Edge Functions). It is never shipped to the browser.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.admin_users          enable row level security;
alter table public.profiles             enable row level security;
alter table public.vaults               enable row level security;
alter table public.vault_sections       enable row level security;
alter table public.vault_items          enable row level security;
alter table public.nominees             enable row level security;
alter table public.funeral_directors    enable row level security;
alter table public.item_recipients      enable row level security;
alter table public.posthumous_messages  enable row level security;
alter table public.credentials          enable row level security;
alter table public.death_claims         enable row level security;
alter table public.release_events       enable row level security;
alter table public.audit_log            enable row level security;

-- ── helper: does the caller own this vault? ─────────────────────────────────
create or replace function public.owns_vault(p_vault_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vaults v
    where v.id = p_vault_id and v.owner_id = auth.uid()
  )
$$;

-- ── admin_users: a user may read their own admin row (to know they're staff) ─
create policy admin_self_read on public.admin_users
  for select using (user_id = auth.uid());

-- ── profiles: owner read/update self; insert handled by trigger ─────────────
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── vaults: owner read only (creation is via trigger / service role) ────────
create policy vaults_owner_read on public.vaults
  for select using (owner_id = auth.uid());

-- ── vault_sections: owner full access ───────────────────────────────────────
create policy vault_sections_owner_all on public.vault_sections
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));

-- ── vault_items: owner full access (the personal path) ──────────────────────
create policy vault_items_owner_all on public.vault_items
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));

-- ── nominees: owner full access ─────────────────────────────────────────────
create policy nominees_owner_all on public.nominees
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));

-- ── funeral_directors: owner full access ────────────────────────────────────
create policy funeral_directors_owner_all on public.funeral_directors
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));

-- ── item_recipients: owner full access via the parent item's vault ──────────
create policy item_recipients_owner_all on public.item_recipients
  for all using (
    exists (
      select 1 from public.vault_items i
      where i.id = vault_item_id and public.owns_vault(i.vault_id)
    )
  ) with check (
    exists (
      select 1 from public.vault_items i
      where i.id = vault_item_id and public.owns_vault(i.vault_id)
    )
  );

-- ── posthumous_messages: owner full access while alive ──────────────────────
create policy posthumous_owner_all on public.posthumous_messages
  for all using (public.owns_vault(vault_id)) with check (public.owns_vault(vault_id));

-- ── credentials: GATED. Owner may READ scaffolded rows, but there is NO insert,
--     update or delete policy — creation is impossible until the gate is lifted.
-- LEGAL-GATE: do not add an INSERT policy until GLBA + computer-misuse sign-off.
create policy credentials_owner_read on public.credentials
  for select using (public.owns_vault(vault_id));

-- ── death_claims: admins only (the review queue). Public submission happens via
--     a server endpoint using the service role, never anon SQL. No claimant
--     SELECT policy: claimants cannot read vault data or even browse claims.
create policy death_claims_admin_read on public.death_claims
  for select using (public.is_admin());
create policy death_claims_admin_update on public.death_claims
  for update using (public.is_admin()) with check (public.is_admin());

-- ── release_events: admins may read (audit visibility). No insert/update/delete
--     policy: writes happen only through the release Edge Function (service role).
create policy release_events_admin_read on public.release_events
  for select using (public.is_admin());

-- ── audit_log: admins may read. Writes go through append_audit() / service role.
create policy audit_log_admin_read on public.audit_log
  for select using (public.is_admin());

-- ── Lock down the SECURITY DEFINER helpers so anon can't probe them ─────────
revoke all on function public.is_admin() from anon;
revoke all on function public.owns_vault(uuid) from anon;
revoke all on function public.append_audit(uuid, text, text, text, uuid, jsonb) from anon, authenticated;
