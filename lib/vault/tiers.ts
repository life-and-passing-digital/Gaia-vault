/**
 * Release tiers — the single source of truth for *who gets what, and when*.
 *
 * These power both the database `release_tier` enum and the plain-language UI
 * copy. Keeping them together means the words a user reads can never drift from
 * the rule the system actually enforces.
 *
 * See /docs/SECURITY.md and /docs/LEGAL-GATES.md for why estate authority is
 * deliberately slower than funeral wishes.
 */
export const RELEASE_TIERS = {
  personal: {
    id: "personal",
    label: "Just for me",
    short: "Private",
    tone: "sage",
    description:
      "Encrypted and visible only to you (and anyone you choose to share with while you're alive). Never released on death.",
  },
  funeral_wishes: {
    id: "funeral_wishes",
    label: "Funeral wishes",
    short: "Funeral",
    tone: "flame",
    description:
      "Released quickly to your authorised funeral director once a death claim is reviewed and approved, so your wishes can be honoured in time.",
  },
  estate_authority: {
    id: "estate_authority",
    label: "Estate & authority",
    short: "Estate",
    tone: "forest",
    description:
      "Financial and estate information. Released only after proof of legal authority (such as a grant of probate or letters of administration) is confirmed by our team.",
  },
} as const;

export type ReleaseTier = keyof typeof RELEASE_TIERS;

export const RELEASE_TIER_IDS = Object.keys(RELEASE_TIERS) as ReleaseTier[];

export function isReleaseTier(value: string): value is ReleaseTier {
  return value in RELEASE_TIERS;
}
