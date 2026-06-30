-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0003 Death claims, releases, audit, and signup automation
--
-- This is the human-reviewed death pathway. NOTHING here auto-releases data: a
-- claim is reviewed by an admin before any release Edge Function runs.
-- ════════════════════════════════════════════════════════════════════════════

-- ── death_claims ────────────────────────────────────────────────────────────
-- A bereaved party's claim that a user has died. The claimant can see NO vault
-- data — they only submit and await review. Documents live in private Storage
-- (bucket policies in 0005); we keep only their paths here.
create table public.death_claims (
  id                     uuid primary key default gen_random_uuid(),
  -- Matched to a profile by an admin during review (not by the claimant).
  deceased_profile_id    uuid references public.profiles (id) on delete set null,
  deceased_email         text not null,
  claimant_name          text not null,
  claimant_email         text not null,
  claimant_phone         text,
  claimant_relationship  text not null,
  death_certificate_path text,  -- Storage object path (private bucket)
  proof_of_authority_path text, -- e.g. grant of probate / letters of admin
  status                 claim_status not null default 'submitted',
  admin_notes            text,
  -- LEGAL-GATE: database signals are corroboration only, never a trigger.
  -- Manual fields only; no live Australian Death Check / LADMF / Tell Us Once.
  corroboration          jsonb not null default '{}'::jsonb,
  -- Set by an admin when proof of legal authority is confirmed; required before
  -- any 'estate_authority' tier item may be released.
  authority_confirmed    boolean not null default false,
  region                 region not null default 'au', -- RESIDENCY
  reviewed_by            uuid references public.admin_users (user_id),
  reviewed_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index death_claims_status_idx on public.death_claims (status, created_at);

-- ── release_events — immutable audit of what was released ────────────────────
-- Append-only: 0004 grants no UPDATE or DELETE to anyone (service role writes
-- via the release Edge Function only). This is the evidentiary record.
create table public.release_events (
  id              uuid primary key default gen_random_uuid(),
  claim_id        uuid not null references public.death_claims (id),
  vault_item_id   uuid references public.vault_items (id),
  message_id      uuid references public.posthumous_messages (id),
  released_tier   release_tier not null,
  recipient_type  recipient_type not null,
  recipient_id    uuid,             -- nominee or funeral_director id
  recipient_email text,
  released_by     uuid references public.admin_users (user_id),
  delivery_ref    text,             -- email/provider reference, never content
  region          region not null default 'au',
  created_at      timestamptz not null default now()
);
create index release_events_claim_idx on public.release_events (claim_id);

-- ── audit_log — append-only, actions not payloads ───────────────────────────
-- Never store vault contents or secrets here. Only *what happened*.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,            -- NULL for system/cron actors
  actor_role  text not null default 'user', -- user | admin | system | service
  action      text not null,   -- e.g. 'vault_item.read', 'claim.approved'
  entity_type text,
  entity_id   uuid,
  region      region not null default 'au',
  ip          inet,
  metadata    jsonb not null default '{}'::jsonb, -- non-sensitive only
  created_at  timestamptz not null default now()
);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- ── append_audit() — the one sanctioned way to write the audit log ──────────
-- SECURITY DEFINER so any server context can record an action without being
-- granted blanket INSERT. Callers must pass only non-sensitive metadata.
create or replace function public.append_audit(
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
$$;

-- ── Signup automation: create profile + vault + seeded sections ─────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_region region := coalesce((new.raw_user_meta_data ->> 'region')::region, 'au');
  v_vault_id uuid;
  s section_type;
begin
  insert into public.profiles (id, email, full_name, region)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', v_region);

  insert into public.vaults (owner_id, region)
  values (new.id, v_region)
  returning id into v_vault_id;

  foreach s in array enum_range(null::section_type) loop
    insert into public.vault_sections (vault_id, section) values (v_vault_id, s);
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── keep updated_at fresh ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_vault_items before update on public.vault_items
  for each row execute function public.touch_updated_at();
create trigger touch_nominees before update on public.nominees
  for each row execute function public.touch_updated_at();
create trigger touch_death_claims before update on public.death_claims
  for each row execute function public.touch_updated_at();
