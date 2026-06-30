// ─────────────────────────────────────────────────────────────────────────────
// Demo mode.
//
// When NEXT_PUBLIC_DEMO_MODE=true the app runs with NO Supabase: an in-memory
// database adapter (lib/db/demo) and a demo session stand in for the real
// backend. This makes the app fully explorable for previews/sales without any
// infrastructure — deploy to Vercel with just this flag and no secrets.
//
// Demo mode is NOT for real data: everything lives in process memory, resets on
// restart, and the demo user is treated as both an owner and an admin so all
// screens are reachable.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-0000000d3700",
  email: "demo@gaiaapp.net",
  fullName: "Demo Wells",
} as const;

// Fixed 32-byte (base64) key material so demo items seal/open deterministically
// even when no env keys are set. Demo data only — never used for real data.
// Real deployments always set VAULT_KEY_DERIVATION_PEPPER and RELEASE_WRAPPING_KEY.
export const DEMO_PEPPER = "KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKio=";
