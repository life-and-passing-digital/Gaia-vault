import type { DeathClaim, RecipientType, VaultItem } from "@/lib/db/types";
import type { ReleaseTier } from "@/lib/vault/tiers";

export interface ReleaseRecipient {
  type: RecipientType;
  id: string;
  email: string | null;
  /** Highest tier this recipient is entitled to (nominee.entitledTier). */
  entitledTier: ReleaseTier;
}

export interface ReleaseEventInput {
  claimId: string;
  vaultItemId: string;
  releasedTier: ReleaseTier;
  recipientType: RecipientType;
  recipientId: string;
  recipientEmail: string | null;
  releasedBy: string;
  deliveryRef: string | null;
}

export interface GrantInput {
  claimId: string;
  releaseEventId: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientEmail: string;
  iv: string;
  ciphertext: string;
  tokenHash: string;
  releasedTier: ReleaseTier;
  expiresAt: string;
}

/**
 * Everything the release logic needs from the outside world. Implemented over
 * Supabase (service role) in production and faked in tests, so the *decisions*
 * (which tiers, which recipients, what gets logged) are unit-tested without a DB.
 */
export interface ReleasePort {
  getClaim(claimId: string): Promise<DeathClaim | null>;
  getVaultIdForOwner(ownerId: string): Promise<string | null>;
  listReleasableItems(vaultId: string): Promise<VaultItem[]>;
  listItemRecipients(itemId: string): Promise<ReleaseRecipient[]>;
  recordReleaseEvent(input: ReleaseEventInput): Promise<{ id: string }>;
  createGrant(input: GrantInput): Promise<void>;
  audit(action: {
    actorId: string | null;
    actorRole: "admin" | "service";
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export interface ReleaseSummary {
  claimId: string;
  releasedItemCount: number;
  grantCount: number;
  skipped: { reason: string; count: number }[];
}
