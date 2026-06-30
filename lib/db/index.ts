// ─────────────────────────────────────────────────────────────────────────────
// lib/db — the one place feature code imports the database from.
//
// Swap backends here and nowhere else. To move off Supabase (e.g. to Firebase),
// implement DatabaseAdapter in a sibling folder and point `getDb` at it. No
// feature code changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { AdapterFactory, DatabaseAdapter } from "./adapter";
import { createSupabaseAdapter } from "./supabase";

const activeFactory: AdapterFactory = createSupabaseAdapter;

/** User-scoped database (RLS enforced). Default for all user-facing code. */
export function getDb(): Promise<DatabaseAdapter> {
  return activeFactory();
}

/**
 * Service-role database (RLS bypassed). Trusted server contexts ONLY — claim
 * intake, admin actions, release Edge Function, audit. Each caller is
 * responsible for its own authorisation.
 */
export function getServiceDb(): Promise<DatabaseAdapter> {
  return activeFactory({ serviceRole: true });
}

export type { DatabaseAdapter } from "./adapter";
export * from "./types";
