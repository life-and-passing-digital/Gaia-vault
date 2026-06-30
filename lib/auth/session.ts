import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE, DEMO_USER } from "@/lib/demo/config";

/** A minimal user shape both real Supabase and demo mode satisfy. */
export type SessionUser = { id: string; email?: string };

const demoUser = (): SessionUser => ({ id: DEMO_USER.id, email: DEMO_USER.email });

/** The authenticated user, or null. Verified against the auth server. */
export async function getUser(): Promise<SessionUser | null> {
  if (DEMO_MODE) return demoUser();
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

/** Require a signed-in user or bounce to login. Returns the user. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require a signed-in ADMIN. Admin status is authoritative in the database
 * (`admin_users` + RLS); we check it there, not from a client claim. Every
 * admin entry point should call this AND audit the access.
 */
export async function requireAdmin() {
  const user = await requireUser();
  // In demo mode the demo user is treated as an admin so the review console is
  // reachable. Real deployments always check the admin_users table below.
  if (DEMO_MODE) return user;
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) redirect("/dashboard");
  return user;
}
