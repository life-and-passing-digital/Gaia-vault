// ═════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: release
//
// The production-isolated home for the release step. It is the ONLY place the
// wrapping key should be usable (move it to a KMS reachable only by this
// function — see /docs/SECURITY.md gate 5). Mirrors lib/release/execute.ts;
// keep the tier rules identical:
//   • funeral_wishes  → released on approval
//   • estate_authority → released ONLY if claim.authority_confirmed
//   • personal        → never (no escrow key)
//
// LEGAL-GATE: invoked ONLY by the admin approval action after a human approves
// a death claim. It re-checks status === 'approved' and refuses otherwise.
// ═════════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  hashToken,
  openItemViaEscrow,
  randomToken,
  sealForRecipient,
} from "../_shared/crypto.ts";

const GRANT_TTL_DAYS = 14;
const rank: Record<string, number> = {
  personal: 0,
  funeral_wishes: 1,
  estate_authority: 2,
};

Deno.serve(async (req) => {
  try {
    const { claimId, adminId } = await req.json();
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: claim } = await sb
      .from("death_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (!claim) return json({ error: "claim not found" }, 404);
    if (claim.status !== "approved") return json({ error: "claim not approved" }, 409);
    if (!claim.deceased_profile_id) return json({ error: "no deceased profile" }, 409);

    const { data: vault } = await sb
      .from("vaults")
      .select("id")
      .eq("owner_id", claim.deceased_profile_id)
      .maybeSingle();
    if (!vault) return json({ error: "no vault" }, 409);

    const { data: items } = await sb
      .from("vault_items")
      .select("*")
      .eq("vault_id", vault.id)
      .neq("release_tier", "personal");

    let released = 0;
    let grants = 0;

    for (const item of items ?? []) {
      if (!item.dek_wrapped_escrow) continue;
      if (item.release_tier === "estate_authority" && !claim.authority_confirmed) continue;

      const { data: recRows } = await sb
        .from("item_recipients")
        .select(
          "recipient_type, nominee:nominees(id,email,entitled_tier), director:funeral_directors(id,email)",
        )
        .eq("vault_item_id", item.id);

      const recipients = (recRows ?? [])
        .map((r: Record<string, unknown>) => {
          const nom = r.nominee as { id: string; email: string; entitled_tier: string } | null;
          const dir = r.director as { id: string; email: string } | null;
          if (r.recipient_type === "nominee" && nom?.email) {
            return { type: "nominee", id: nom.id, email: nom.email, tier: nom.entitled_tier };
          }
          if (r.recipient_type === "funeral_director" && dir?.email) {
            return { type: "funeral_director", id: dir.id, email: dir.email, tier: "funeral_wishes" };
          }
          return null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .filter((r) => rank[r.tier] >= rank[item.release_tier]);

      if (recipients.length === 0) continue;

      const plaintext = await openItemViaEscrow(item);
      released += 1;

      for (const recipient of recipients) {
        const token = randomToken();
        const grant = await sealForRecipient(plaintext, token);
        const expiresAt = new Date(Date.now() + GRANT_TTL_DAYS * 86_400_000).toISOString();

        const { data: evt } = await sb
          .from("release_events")
          .insert({
            claim_id: claimId,
            vault_item_id: item.id,
            released_tier: item.release_tier,
            recipient_type: recipient.type,
            recipient_id: recipient.id,
            recipient_email: recipient.email,
            released_by: adminId,
          })
          .select("id")
          .single();

        await sb.from("recipient_grants").insert({
          claim_id: claimId,
          release_event_id: evt?.id,
          recipient_type: recipient.type,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          iv: grant.iv,
          ciphertext: grant.ciphertext,
          token_hash: await hashToken(token),
          released_tier: item.release_tier,
          expires_at: expiresAt,
        });
        grants += 1;

        // NOTE: email delivery of the secure link happens via the app's email
        // abstraction; this function focuses on the cryptographic release.
      }
    }

    await sb.rpc("append_audit", {
      p_actor_id: adminId,
      p_actor_role: "admin",
      p_action: "release.completed",
      p_entity_type: "death_claim",
      p_entity_id: claimId,
      p_metadata: { released, grants, via: "edge-function" },
    });

    return json({ released, grants });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
