// ═════════════════════════════════════════════════════════════════════════════
// The release execution logic — the most consequential code in the product.
//
// Runs ONLY after an admin has approved a death claim. It enforces, in code, the
// tier rules the law and the spec require:
//   • funeral_wishes  → released on approval.
//   • estate_authority → released ONLY if the admin has confirmed proof of legal
//     authority (claim.authorityConfirmed). Otherwise SKIPPED, never released.
//   • personal        → never releasable (no escrow key; filtered out).
//
// It decrypts via the escrow path, re-encrypts each item under a per-recipient
// grant token, records an immutable release_event, and writes the audit trail.
// It never logs vault contents.
//
// LEGAL-GATE: this must only ever be reachable through the human review queue.
// There is no automated caller. See /docs/SECURITY.md and /docs/ADMIN-RUNBOOK.md.
// ═════════════════════════════════════════════════════════════════════════════

import { openItemViaEscrow, sealForRecipient, hashToken, randomToken } from "@/lib/crypto";
import type { EmailProvider } from "@/lib/email";
import type { ReleasePort, ReleaseSummary } from "./types";
import type { ReleaseTier } from "@/lib/vault/tiers";

const GRANT_TTL_DAYS = 14;

function entitlementRank(tier: ReleaseTier): number {
  return { personal: 0, funeral_wishes: 1, estate_authority: 2 }[tier];
}

export interface ReleaseDeps {
  port: ReleasePort;
  email: EmailProvider;
  adminId: string;
  /** Injected for deterministic tests; defaults to Date.now in production. */
  now?: () => Date;
  appUrl?: string;
}

export async function executeRelease(
  claimId: string,
  deps: ReleaseDeps,
): Promise<ReleaseSummary> {
  const { port, email, adminId } = deps;
  const now = deps.now ? deps.now() : new Date();
  const appUrl = deps.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net";

  const claim = await port.getClaim(claimId);
  if (!claim) throw new Error("release: claim not found");
  if (claim.status !== "approved") {
    throw new Error("release: claim is not approved — refusing to release");
  }
  if (!claim.deceasedProfileId) {
    throw new Error("release: claim has no matched deceased profile");
  }

  const vaultId = await port.getVaultIdForOwner(claim.deceasedProfileId);
  if (!vaultId) throw new Error("release: deceased has no vault");

  const items = await port.listReleasableItems(vaultId);
  const skipped: ReleaseSummary["skipped"] = [];
  let releasedItemCount = 0;
  let grantCount = 0;
  let estateBlocked = 0;
  let noRecipients = 0;

  for (const item of items) {
    // Defence in depth: personal items must never reach here.
    if (item.releaseTier === "personal" || !item.dekWrappedEscrow) continue;

    // Estate-authority gate: requires confirmed legal authority.
    if (item.releaseTier === "estate_authority" && !claim.authorityConfirmed) {
      estateBlocked += 1;
      continue;
    }

    const recipients = await port.listItemRecipients(item.id);
    const eligible = recipients.filter(
      (r) => entitlementRank(r.entitledTier) >= entitlementRank(item.releaseTier) && r.email,
    );
    if (eligible.length === 0) {
      noRecipients += 1;
      continue;
    }

    // Decrypt once via the approved escrow path.
    const plaintext = await openItemViaEscrow(item);
    releasedItemCount += 1;

    for (const recipient of eligible) {
      const token = randomToken();
      const grantEnc = await sealForRecipient(plaintext, token);
      const expiresAt = new Date(now.getTime() + GRANT_TTL_DAYS * 86_400_000).toISOString();

      const evt = await port.recordReleaseEvent({
        claimId,
        vaultItemId: item.id,
        releasedTier: item.releaseTier,
        recipientType: recipient.type,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        releasedBy: adminId,
        deliveryRef: null,
      });

      await port.createGrant({
        claimId,
        releaseEventId: evt.id,
        recipientType: recipient.type,
        recipientId: recipient.id,
        recipientEmail: recipient.email!,
        iv: grantEnc.iv,
        ciphertext: grantEnc.ciphertext,
        tokenHash: await hashToken(token),
        releasedTier: item.releaseTier,
        expiresAt,
      });
      grantCount += 1;

      // Gentle notification only — the secure link, never the content.
      const link = `${appUrl}/access?token=${encodeURIComponent(token)}`;
      await email.send({
        to: recipient.email!,
        subject: "Something has been shared with you, with care",
        text:
          `Hello,\n\n` +
          `Someone trusted you with information through Gaia Vault, to be shared ` +
          `at this time. You can view what they left for you, securely, here:\n\n` +
          `${link}\n\n` +
          `This link is private to you and expires in ${GRANT_TTL_DAYS} days.\n\n` +
          `With care,\nThe Gaia Vault team`,
        tag: "release-notification",
      });

      await port.audit({
        actorId: adminId,
        actorRole: "admin",
        action: "release.delivered",
        entityType: "release_event",
        entityId: evt.id,
        metadata: { tier: item.releaseTier, recipientType: recipient.type }, // no content
      });
    }
  }

  if (estateBlocked > 0)
    skipped.push({ reason: "estate_authority_not_confirmed", count: estateBlocked });
  if (noRecipients > 0)
    skipped.push({ reason: "no_eligible_recipient", count: noRecipients });

  await port.audit({
    actorId: adminId,
    actorRole: "admin",
    action: "release.completed",
    entityType: "death_claim",
    entityId: claimId,
    metadata: { releasedItemCount, grantCount, skipped },
  });

  return { claimId, releasedItemCount, grantCount, skipped };
}
