-- ════════════════════════════════════════════════════════════════════════════
-- Gaia Vault — 0005 Storage buckets
--
-- Private buckets for the sensitive documents in the death-claim flow. These are
-- NOT public. Uploads from the public claim form go through a server endpoint
-- using the service role; only admins can read them, only via signed URLs minted
-- inside the review workflow.
-- RESIDENCY: Storage lives in the same regional project as the database.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('claim-documents', 'claim-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vault-attachments', 'vault-attachments', false)
on conflict (id) do nothing;

-- claim-documents: admins read; no public/anon/authenticated read or write.
-- (Writes happen via the service role from the claim-intake server endpoint.)
create policy "claim docs admin read" on storage.objects
  for select using (bucket_id = 'claim-documents' and public.is_admin());

-- vault-attachments: an owner may read/write files under a prefix that matches
-- their own vault id. The app stores attachments at `<vault_id>/<item_id>/...`.
create policy "vault attachments owner read" on storage.objects
  for select using (
    bucket_id = 'vault-attachments'
    and public.owns_vault((storage.foldername(name))[1]::uuid)
  );
create policy "vault attachments owner write" on storage.objects
  for insert with check (
    bucket_id = 'vault-attachments'
    and public.owns_vault((storage.foldername(name))[1]::uuid)
  );
create policy "vault attachments owner delete" on storage.objects
  for delete using (
    bucket_id = 'vault-attachments'
    and public.owns_vault((storage.foldername(name))[1]::uuid)
  );
