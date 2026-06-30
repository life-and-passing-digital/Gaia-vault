import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import type { DatabaseAdapter } from "../adapter";
import type {
  AuditAction,
  DeathClaim,
  NewNominee,
  NewVaultItem,
  UpdatableVaultItem,
} from "../types";
import {
  toClaim,
  toDirector,
  toItem,
  toNominee,
  toProfile,
  toSection,
  toVault,
} from "./mappers";

/* eslint-disable @typescript-eslint/no-explicit-any */

function unwrap<T>(res: { data: T | null; error: any }, what: string): T {
  if (res.error) throw new Error(`db:${what}: ${res.error.message}`);
  if (res.data === null) throw new Error(`db:${what}: no data`);
  return res.data;
}

/**
 * Supabase implementation of the DatabaseAdapter. Holds a SupabaseClient that is
 * either user-scoped (RLS enforced) or service-role (RLS bypassed) — chosen by
 * the factory. Stores opaque encrypted envelopes; never encrypts or decrypts.
 */
class SupabaseAdapter implements DatabaseAdapter {
  constructor(private readonly sb: SupabaseClient) {}

  async getProfile(userId: string) {
    const { data, error } = await this.sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(`db:getProfile: ${error.message}`);
    return data ? toProfile(data) : null;
  }

  async updateProfile(userId: string, patch: any) {
    const row: Record<string, unknown> = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.mfaEnabled !== undefined) row.mfa_enabled = patch.mfaEnabled;
    const res = await this.sb
      .from("profiles")
      .update(row)
      .eq("id", userId)
      .select("*")
      .single();
    return toProfile(unwrap(res, "updateProfile"));
  }

  async getVaultForOwner(userId: string) {
    const { data, error } = await this.sb
      .from("vaults")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(`db:getVaultForOwner: ${error.message}`);
    return data ? toVault(data) : null;
  }

  async listSections(vaultId: string) {
    const res = await this.sb
      .from("vault_sections")
      .select("*")
      .eq("vault_id", vaultId)
      .order("section");
    return unwrap(res, "listSections").map(toSection);
  }

  async stampSectionReviewed(vaultId: string, section: string) {
    const { error } = await this.sb
      .from("vault_sections")
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq("vault_id", vaultId)
      .eq("section", section);
    if (error) throw new Error(`db:stampSectionReviewed: ${error.message}`);
  }

  async listItems(vaultId: string, section?: string) {
    let q = this.sb.from("vault_items").select("*").eq("vault_id", vaultId);
    if (section) q = q.eq("section", section);
    const res = await q.order("created_at", { ascending: false });
    return unwrap(res, "listItems").map(toItem);
  }

  async getItem(itemId: string) {
    const { data, error } = await this.sb
      .from("vault_items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    if (error) throw new Error(`db:getItem: ${error.message}`);
    return data ? toItem(data) : null;
  }

  async createItem(input: NewVaultItem) {
    const res = await this.sb
      .from("vault_items")
      .insert({
        vault_id: input.vaultId,
        section: input.section,
        release_tier: input.releaseTier,
        enc_version: input.envelope.encVersion,
        iv: input.envelope.iv,
        ciphertext: input.envelope.ciphertext,
        dek_wrapped_user: input.envelope.dekWrappedUser,
        dek_wrapped_escrow: input.envelope.dekWrappedEscrow,
      })
      .select("*")
      .single();
    return toItem(unwrap(res, "createItem"));
  }

  async updateItem(itemId: string, patch: UpdatableVaultItem) {
    const row: Record<string, unknown> = {};
    if (patch.section) row.section = patch.section;
    if (patch.releaseTier) row.release_tier = patch.releaseTier;
    if (patch.envelope) {
      row.enc_version = patch.envelope.encVersion;
      row.iv = patch.envelope.iv;
      row.ciphertext = patch.envelope.ciphertext;
      row.dek_wrapped_user = patch.envelope.dekWrappedUser;
      row.dek_wrapped_escrow = patch.envelope.dekWrappedEscrow;
    }
    const res = await this.sb
      .from("vault_items")
      .update(row)
      .eq("id", itemId)
      .select("*")
      .single();
    return toItem(unwrap(res, "updateItem"));
  }

  async deleteItem(itemId: string) {
    const { error } = await this.sb.from("vault_items").delete().eq("id", itemId);
    if (error) throw new Error(`db:deleteItem: ${error.message}`);
  }

  async listNominees(vaultId: string) {
    const res = await this.sb
      .from("nominees")
      .select("*")
      .eq("vault_id", vaultId)
      .order("created_at");
    return unwrap(res, "listNominees").map(toNominee);
  }

  async createNominee(input: NewNominee) {
    const res = await this.sb
      .from("nominees")
      .insert({
        vault_id: input.vaultId,
        full_name: input.fullName,
        relationship: input.relationship ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        entitled_tier: input.entitledTier,
        notify_on_release: input.notifyOnRelease ?? true,
      })
      .select("*")
      .single();
    return toNominee(unwrap(res, "createNominee"));
  }

  async deleteNominee(nomineeId: string) {
    const { error } = await this.sb.from("nominees").delete().eq("id", nomineeId);
    if (error) throw new Error(`db:deleteNominee: ${error.message}`);
  }

  async listFuneralDirectors(vaultId: string) {
    const res = await this.sb
      .from("funeral_directors")
      .select("*")
      .eq("vault_id", vaultId)
      .order("created_at");
    return unwrap(res, "listFuneralDirectors").map(toDirector);
  }

  async listClaims(status?: DeathClaim["status"]) {
    let q = this.sb.from("death_claims").select("*");
    if (status) q = q.eq("status", status);
    const res = await q.order("created_at", { ascending: false });
    return unwrap(res, "listClaims").map(toClaim);
  }

  async getClaim(claimId: string) {
    const { data, error } = await this.sb
      .from("death_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (error) throw new Error(`db:getClaim: ${error.message}`);
    return data ? toClaim(data) : null;
  }

  async audit(action: AuditAction) {
    // Routed through append_audit() so we never need blanket INSERT on the log.
    const { error } = await this.sb.rpc("append_audit", {
      p_actor_id: action.actorId,
      p_actor_role: action.actorRole,
      p_action: action.action,
      p_entity_type: action.entityType ?? null,
      p_entity_id: action.entityId ?? null,
      p_metadata: action.metadata ?? {},
    });
    if (error) throw new Error(`db:audit: ${error.message}`);
  }
}

/** Factory: user-scoped (RLS) by default, service-role when explicitly asked. */
export async function createSupabaseAdapter(ctx?: {
  serviceRole?: boolean;
}): Promise<DatabaseAdapter> {
  const sb = ctx?.serviceRole
    ? createSupabaseServiceClient()
    : await createSupabaseServerClient();
  return new SupabaseAdapter(sb as unknown as SupabaseClient);
}
