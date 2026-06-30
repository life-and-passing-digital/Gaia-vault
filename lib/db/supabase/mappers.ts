// Row → domain mappers. Confine all snake_case ↔ camelCase translation here so
// the rest of the adapter reads cleanly and the boundary stays honest.

import type {
  DeathClaim,
  FuneralDirector,
  Nominee,
  Profile,
  Vault,
  VaultItem,
  VaultSection,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const toProfile = (r: any): Profile => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  region: r.region,
  plan: r.plan,
  planStatus: r.plan_status,
  mfaEnabled: r.mfa_enabled,
  stripeCustomerId: r.stripe_customer_id,
  createdAt: r.created_at,
});

export const toVault = (r: any): Vault => ({
  id: r.id,
  ownerId: r.owner_id,
  region: r.region,
  createdAt: r.created_at,
});

export const toSection = (r: any): VaultSection => ({
  id: r.id,
  vaultId: r.vault_id,
  section: r.section,
  lastReviewedAt: r.last_reviewed_at,
});

export const toItem = (r: any): VaultItem => ({
  id: r.id,
  vaultId: r.vault_id,
  section: r.section,
  releaseTier: r.release_tier,
  encVersion: r.enc_version,
  iv: r.iv,
  ciphertext: r.ciphertext,
  dekWrappedUser: r.dek_wrapped_user,
  dekWrappedEscrow: r.dek_wrapped_escrow,
  region: r.region,
  lastReviewedAt: r.last_reviewed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toNominee = (r: any): Nominee => ({
  id: r.id,
  vaultId: r.vault_id,
  fullName: r.full_name,
  relationship: r.relationship,
  email: r.email,
  phone: r.phone,
  entitledTier: r.entitled_tier,
  notifyOnRelease: r.notify_on_release,
  createdAt: r.created_at,
});

export const toDirector = (r: any): FuneralDirector => ({
  id: r.id,
  vaultId: r.vault_id,
  businessName: r.business_name,
  contactName: r.contact_name,
  email: r.email,
  phone: r.phone,
  authorised: r.authorised,
  createdAt: r.created_at,
});

export const toClaim = (r: any): DeathClaim => ({
  id: r.id,
  deceasedProfileId: r.deceased_profile_id,
  deceasedEmail: r.deceased_email,
  claimantName: r.claimant_name,
  claimantEmail: r.claimant_email,
  claimantPhone: r.claimant_phone,
  claimantRelationship: r.claimant_relationship,
  deathCertificatePath: r.death_certificate_path,
  proofOfAuthorityPath: r.proof_of_authority_path,
  status: r.status,
  adminNotes: r.admin_notes,
  corroboration: r.corroboration ?? {},
  authorityConfirmed: r.authority_confirmed,
  region: r.region,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at,
});
