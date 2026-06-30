// ─────────────────────────────────────────────────────────────────────────────
// The database adapter boundary.
//
// ALL data access in feature code goes through this interface. Supabase is the
// v1 implementation (lib/db/supabase), but because nothing above this line
// imports `@supabase/*`, the operator can swap to Firebase or anything else by
// writing one new adapter — exactly the isolation the spec mandates.
//
// Adapters are responsible ONLY for persistence. Encryption happens in
// lib/crypto *before* data reaches an adapter; adapters store opaque envelopes.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AuditAction,
  DeathClaim,
  FuneralDirector,
  NewNominee,
  NewVaultItem,
  Nominee,
  Profile,
  UpdatableVaultItem,
  Vault,
  VaultItem,
  VaultSection,
} from "./types";

export interface DatabaseAdapter {
  // ── Profiles ──────────────────────────────────────────────────────────────
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(
    userId: string,
    patch: Partial<Pick<Profile, "fullName" | "mfaEnabled">>,
  ): Promise<Profile>;

  // ── Vault ─────────────────────────────────────────────────────────────────
  getVaultForOwner(userId: string): Promise<Vault | null>;
  listSections(vaultId: string): Promise<VaultSection[]>;
  stampSectionReviewed(vaultId: string, section: string): Promise<void>;

  // ── Items (opaque encrypted envelopes only) ───────────────────────────────
  listItems(vaultId: string, section?: string): Promise<VaultItem[]>;
  getItem(itemId: string): Promise<VaultItem | null>;
  createItem(input: NewVaultItem): Promise<VaultItem>;
  updateItem(itemId: string, patch: UpdatableVaultItem): Promise<VaultItem>;
  deleteItem(itemId: string): Promise<void>;

  // ── People ────────────────────────────────────────────────────────────────
  listNominees(vaultId: string): Promise<Nominee[]>;
  createNominee(input: NewNominee): Promise<Nominee>;
  deleteNominee(nomineeId: string): Promise<void>;
  listFuneralDirectors(vaultId: string): Promise<FuneralDirector[]>;

  // ── Death claims (admin / service surface) ────────────────────────────────
  listClaims(status?: DeathClaim["status"]): Promise<DeathClaim[]>;
  getClaim(claimId: string): Promise<DeathClaim | null>;

  // ── Audit (actions, never payloads) ───────────────────────────────────────
  audit(action: AuditAction): Promise<void>;
}

/**
 * A factory so each request can bind the adapter to the right auth context
 * (user-scoped RLS vs. service role). Implementations decide what `ctx` means.
 */
export type AdapterFactory = (ctx?: { serviceRole?: boolean }) => Promise<DatabaseAdapter>;
