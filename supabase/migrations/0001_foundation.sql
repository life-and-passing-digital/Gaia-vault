-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0001 Foundation: extensions, enums, helper functions
--
-- RESIDENCY: this schema is deployed per-region. v1 ships a single AU project
-- (Supabase region ap-southeast-2 / Sydney). The `region` column is recorded on
-- every row so data never has to be inferred from where it happens to live, and
-- so additional regional projects (UK/EU/US) can be added without refactor.
-- See /docs/DATA-RESIDENCY.md.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Enumerations ────────────────────────────────────────────────────────────
create type region as enum ('au', 'uk', 'eu', 'us');
create type plan_tier as enum ('free', 'paid');
create type plan_status as enum ('active', 'trialing', 'past_due', 'canceled', 'none');
create type section_type as enum ('wishes', 'people', 'documents', 'assets', 'messages');

-- Release tiers — kept in lockstep with lib/vault/tiers.ts (the UI copy).
-- 'personal'         : never released on death.
-- 'funeral_wishes'   : released quickly to an authorised funeral director.
-- 'estate_authority' : released only after proof of legal authority.
create type release_tier as enum ('personal', 'funeral_wishes', 'estate_authority');

create type recipient_type as enum ('nominee', 'funeral_director');
create type claim_status as enum ('submitted', 'under_review', 'approved', 'rejected');

-- ── Helper functions ────────────────────────────────────────────────────────
-- The currently authenticated user (NULL for anon / service contexts).
create or replace function public.current_uid()
returns uuid
language sql
stable
as $$ select auth.uid() $$;

-- Is the caller a Gaia Vault admin? Admins are a tiny, explicitly-listed set.
-- SECURITY DEFINER so the policy check can read admin_users regardless of the
-- caller's own RLS. Used only to *grant* the review workflow; every admin
-- action is additionally written to audit_log by the application/Edge layer.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  )
$$;

comment on function public.is_admin() is
  'True if the caller is a listed Gaia Vault admin. Grants access to the death-claim review workflow only; all access is audit-logged at the application layer.';
