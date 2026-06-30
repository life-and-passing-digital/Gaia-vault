// Domain types for Gaia Vault. These are storage-agnostic on purpose: feature
// code depends on these, NOT on Supabase row shapes, so the backend can be
// swapped behind lib/db (see lib/db/adapter.ts).

import type { ReleaseTier } from "@/lib/vault/tiers";
import type { RegionCode } from "@/lib/regions/config";

export type SectionType =
  | "wishes"
  | "people"
  | "documents"
  | "assets"
  | "messages";

export type PlanTier = "free" | "paid";
export type PlanStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "none";
export type RecipientType = "nominee" | "funeral_director";
export type ClaimStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  region: RegionCode;
  plan: PlanTier;
  planStatus: PlanStatus;
  mfaEnabled: boolean;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface Vault {
  id: string;
  ownerId: string;
  region: RegionCode;
  createdAt: string;
}

export interface VaultSection {
  id: string;
  vaultId: string;
  section: SectionType;
  lastReviewedAt: string | null;
}

/** The encrypted envelope as it lives at rest. Never contains plaintext. */
export interface EncryptedEnvelope {
  encVersion: number;
  iv: string; // base64 GCM nonce
  ciphertext: string; // base64 GCM ciphertext + tag
  dekWrappedUser: string; // base64 DEK wrapped to the user key
  dekWrappedEscrow: string | null; // base64 DEK wrapped to escrow (release only)
}

export interface VaultItem extends EncryptedEnvelope {
  id: string;
  vaultId: string;
  section: SectionType;
  releaseTier: ReleaseTier;
  region: RegionCode;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Nominee {
  id: string;
  vaultId: string;
  fullName: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  entitledTier: ReleaseTier;
  notifyOnRelease: boolean;
  createdAt: string;
}

export interface FuneralDirector {
  id: string;
  vaultId: string;
  businessName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  authorised: boolean;
  createdAt: string;
}

export interface DeathClaim {
  id: string;
  deceasedProfileId: string | null;
  deceasedEmail: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string | null;
  claimantRelationship: string;
  deathCertificatePath: string | null;
  proofOfAuthorityPath: string | null;
  status: ClaimStatus;
  adminNotes: string | null;
  corroboration: Record<string, unknown>;
  authorityConfirmed: boolean;
  region: RegionCode;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AuditAction {
  actorId: string | null;
  actorRole: "user" | "admin" | "system" | "service";
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>; // non-sensitive only
}

// ── Input DTOs ──────────────────────────────────────────────────────────────
export interface NewVaultItem {
  vaultId: string;
  section: SectionType;
  releaseTier: ReleaseTier;
  envelope: EncryptedEnvelope;
}

export type UpdatableVaultItem = Partial<
  Pick<VaultItem, "section" | "releaseTier"> & {
    envelope: EncryptedEnvelope;
  }
>;

export interface NewNominee {
  vaultId: string;
  fullName: string;
  relationship?: string;
  email?: string;
  phone?: string;
  entitledTier: ReleaseTier;
  notifyOnRelease?: boolean;
}
