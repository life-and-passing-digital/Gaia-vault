import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { toClaim, toItem } from "@/lib/db/supabase/mappers";
import type {
  GrantInput,
  ReleaseEventInput,
  ReleasePort,
  ReleaseRecipient,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Supabase (service-role) implementation of ReleasePort. Used only inside the
 * approved release path. The pure decisions live in execute.ts; this is just
 * the persistence wiring.
 */
export function createSupabaseReleasePort(): ReleasePort {
  const sb = createSupabaseServiceClient();

  return {
    async getClaim(claimId) {
      const { data } = await sb.from("death_claims").select("*").eq("id", claimId).maybeSingle();
      return data ? toClaim(data) : null;
    },

    async getVaultIdForOwner(ownerId) {
      const { data } = await sb.from("vaults").select("id").eq("owner_id", ownerId).maybeSingle();
      return data?.id ?? null;
    },

    async listReleasableItems(vaultId) {
      const { data, error } = await sb
        .from("vault_items")
        .select("*")
        .eq("vault_id", vaultId)
        .neq("release_tier", "personal");
      if (error) throw new Error(`release.listReleasableItems: ${error.message}`);
      return (data ?? []).map(toItem);
    },

    async listItemRecipients(itemId): Promise<ReleaseRecipient[]> {
      const { data, error } = await sb
        .from("item_recipients")
        .select(
          "recipient_type, nominee:nominees(id,email,entitled_tier), director:funeral_directors(id,email)",
        )
        .eq("vault_item_id", itemId);
      if (error) throw new Error(`release.listItemRecipients: ${error.message}`);
      const out: ReleaseRecipient[] = [];
      for (const row of (data ?? []) as any[]) {
        if (row.recipient_type === "nominee" && row.nominee) {
          out.push({
            type: "nominee",
            id: row.nominee.id,
            email: row.nominee.email,
            entitledTier: row.nominee.entitled_tier,
          });
        } else if (row.recipient_type === "funeral_director" && row.director) {
          out.push({
            type: "funeral_director",
            id: row.director.id,
            email: row.director.email,
            // Directors are, by definition, entitled to funeral wishes.
            entitledTier: "funeral_wishes",
          });
        }
      }
      return out;
    },

    async recordReleaseEvent(input: ReleaseEventInput) {
      const { data, error } = await sb
        .from("release_events")
        .insert({
          claim_id: input.claimId,
          vault_item_id: input.vaultItemId,
          released_tier: input.releasedTier,
          recipient_type: input.recipientType,
          recipient_id: input.recipientId,
          recipient_email: input.recipientEmail,
          released_by: input.releasedBy,
          delivery_ref: input.deliveryRef,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(`release.recordReleaseEvent: ${error?.message}`);
      return { id: data.id };
    },

    async createGrant(input: GrantInput) {
      const { error } = await sb.from("recipient_grants").insert({
        claim_id: input.claimId,
        release_event_id: input.releaseEventId,
        recipient_type: input.recipientType,
        recipient_id: input.recipientId,
        recipient_email: input.recipientEmail,
        iv: input.iv,
        ciphertext: input.ciphertext,
        token_hash: input.tokenHash,
        released_tier: input.releasedTier,
        expires_at: input.expiresAt,
      });
      if (error) throw new Error(`release.createGrant: ${error.message}`);
    },

    async audit(action) {
      await sb.rpc("append_audit", {
        p_actor_id: action.actorId,
        p_actor_role: action.actorRole,
        p_action: action.action,
        p_entity_type: action.entityType ?? null,
        p_entity_id: action.entityId ?? null,
        p_metadata: action.metadata ?? {},
      });
    },
  };
}
