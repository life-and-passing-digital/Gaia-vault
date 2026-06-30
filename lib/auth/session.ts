import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The authenticated user, or null. Verified against the auth server. */
export async function getUser() {
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
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) redirect("/dashboard");
  return user;
}
