// ─────────────────────────────────────────────────────────────────────────────
// Gaia CRM integration — INTERFACE ONLY, NOT WIRED IN V1.
//
// LEGAL-GATE: cross-product data sharing needs consent + DPA review before this
// can move real data (see /docs/LEGAL-GATES.md, gate 4). The interface is
// defined now so the hand-off to the Gaia team is concrete, but every method is
// disabled behind FEATURE_CRM_SYNC=false and throws if called while off.
// ─────────────────────────────────────────────────────────────────────────────

import { FLAGS } from "@/lib/flags";

export interface CrmContactRef {
  /** The Gaia CRM record id, once a link is established (never a vault secret). */
  crmId: string;
}

/**
 * The contract Gaia Vault would implement against Gaia CRM. Deliberately
 * minimal and consent-bound: only non-sensitive, user-approved fields ever
 * cross the boundary, and only after a DPA is in place.
 */
export interface CrmSyncPort {
  /** Link a Vault user to a CRM contact (after explicit user consent). */
  linkContact(userId: string): Promise<CrmContactRef>;
  /** Push only consented, non-sensitive profile fields. Never vault contents. */
  pushConsentedProfile(userId: string, ref: CrmContactRef): Promise<void>;
}

class DisabledCrmSync implements CrmSyncPort {
  private guard(): never {
    throw new Error(
      "CRM sync is disabled (FEATURE_CRM_SYNC=false). LEGAL-GATE: requires consent + DPA review.",
    );
  }
  async linkContact(): Promise<CrmContactRef> {
    this.guard();
  }
  async pushConsentedProfile(): Promise<void> {
    this.guard();
  }
}

export function getCrmSync(): CrmSyncPort {
  if (!FLAGS.crmSync) return new DisabledCrmSync();
  // When the gate is lifted, return a real implementation here.
  return new DisabledCrmSync();
}
