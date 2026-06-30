-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — RLS tests (pgTAP)
--
-- Run with:  supabase test db
-- Verifies the security-critical Row Level Security guarantees against a real
-- Postgres with the migrations applied. (Not executed in the CI-less build
-- environment; runs locally / in CI alongside the migrations.)
-- ════════════════════════════════════════════════════════════════════════════

begin;
select plan(7);

-- Seed two users; the signup trigger provisions profile + vault + sections.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@example.com');

select is(
  (select count(*)::int from public.vaults
     where owner_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')),
  2, 'signup trigger provisions one vault per user');

-- ── Act as user A ──────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is((select count(*)::int from public.vaults), 1,
  'A sees only their own vault');

insert into public.vault_items
  (vault_id, section, release_tier, iv, ciphertext, dek_wrapped_user)
select id, 'wishes', 'personal', 'iv', 'ct', 'wrapped'
from public.vaults limit 1;

select is((select count(*)::int from public.vault_items), 1,
  'A can create and read their own item');

-- credentials are GATED: there is no INSERT policy, so this must be denied.
select throws_ok(
  $$ insert into public.credentials (vault_id, label, iv, ciphertext, dek_wrapped_user)
     select id, 'x', 'iv', 'ct', 'w' from public.vaults limit 1 $$,
  '42501', NULL,
  'credentials insert is denied by RLS (gated capability)');

-- ── Act as user B ──────────────────────────────────────────────────────────
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select is((select count(*)::int from public.vault_items), 0,
  'B cannot see A''s vault items');

select is((select count(*)::int from public.death_claims), 0,
  'a non-admin user sees no death claims');

-- release_events are append-only: even a read is admin-only, and no UPDATE
-- policy exists for anyone.
select is((select count(*)::int from public.release_events), 0,
  'a non-admin user sees no release events');

select * from finish();
rollback;
