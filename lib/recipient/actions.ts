import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { hashToken, openForRecipient } from "@/lib/crypto";
import type { ReleaseTier } from "@/lib/vault/tiers";

export type GrantView =
  | {
      ok: true;
      title: string;
      body: string;
      tier: ReleaseTier;
      expiresAt: string;
    }
  | { ok: false; reason: "not_found" | "expired" | "revoked" };

/**
 * Exchange a one-time access token for the content a recipient is entitled to.
 * Runs with the service role because the recipient is not an authenticated user;
 * the token itself is the credential. The stored row is re-encrypted under a key
 * derived from the token, so this is the only way to read it.
 */
export async function getGrantedContent(token: string): Promise<GrantView> {
  if (!token) return { ok: false, reason: "not_found" };
  const sb = createSupabaseServiceClient();
  const tokenHash = await hashToken(token);

  const { data: grant } = await sb
    .from("recipient_grants")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!grant) return { ok: false, reason: "not_found" };
  if (grant.revoked) return { ok: false, reason: "revoked" };
  if (new Date(grant.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const plaintext = await openForRecipient(
    { iv: grant.iv, ciphertext: grant.ciphertext },
    token,
  );
  const content = JSON.parse(plaintext) as { title: string; body: string };

  // Record first access (audit the action, not the content).
  if (!grant.accessed_at) {
    await sb
      .from("recipient_grants")
      .update({ accessed_at: new Date().toISOString() })
      .eq("id", grant.id);
  }
  await sb.rpc("append_audit", {
    p_actor_id: null,
    p_actor_role: "service",
    p_action: "grant.accessed",
    p_entity_type: "recipient_grant",
    p_entity_id: grant.id,
    p_metadata: { tier: grant.released_tier },
  });

  return {
    ok: true,
    title: content.title,
    body: content.body,
    tier: grant.released_tier,
    expiresAt: grant.expires_at,
  };
}
