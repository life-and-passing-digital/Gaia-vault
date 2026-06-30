import { createClient } from "@supabase/supabase-js";
import "server-only";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * Use ONLY in trusted server contexts that have their own authorisation checks:
 * the death-claim intake endpoint, the admin review actions, the release Edge
 * Function, and audit writes. NEVER import this into client code — the
 * `server-only` guard above turns any client import into a build error.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Service-role Supabase credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
