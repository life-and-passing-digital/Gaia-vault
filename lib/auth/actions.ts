"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/config";

export type AuthState = { error?: string } | undefined;

// Is Supabase Auth actually configured on this deployment? If not, auth actions
// must fail with a friendly message instead of throwing (which surfaces as a
// full-page "server-side exception"). See docs/DEPLOY-VERCEL.md.
function authConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const NOT_CONFIGURED =
  "Accounts aren’t set up on this deployment yet. If you’re just exploring, try the demo.";

/** Sign in. If the account has MFA, Supabase requires an aal2 step next. */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (DEMO_MODE) redirect("/dashboard");
  if (!authConfigured()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email or password didn’t match. Please try again." };

  // If a second factor is enrolled, the session is aal1 until verified.
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect("/login/verify");
  }
  redirect("/dashboard");
}

/** Create an account. Region is captured at signup and is fixed for residency. */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (DEMO_MODE) redirect("/dashboard");
  if (!authConfigured()) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const region = String(formData.get("region") ?? "au");
  if (!email || password.length < 10) {
    return { error: "Use a valid email and a password of at least 10 characters." };
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, region } },
  });
  if (error) return { error: error.message };
  redirect("/login?check-email=1");
}

export async function signOut() {
  if (!DEMO_MODE && authConfigured()) {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  redirect("/");
}

/** Verify a TOTP code to lift the session to aal2 (MFA challenge at login). */
export async function verifyMfa(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (DEMO_MODE) redirect("/dashboard");
  if (!authConfigured()) return { error: NOT_CONFIGURED };
  const code = String(formData.get("code") ?? "").trim();
  const sb = await createSupabaseServerClient();
  const { data: factors } = await sb.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) redirect("/dashboard");

  const { data: challenge, error: cErr } = await sb.auth.mfa.challenge({
    factorId: totp!.id,
  });
  if (cErr || !challenge) return { error: "Couldn’t start verification. Try again." };

  const { error } = await sb.auth.mfa.verify({
    factorId: totp!.id,
    challengeId: challenge.id,
    code,
  });
  if (error) return { error: "That code wasn’t right. Please try again." };
  redirect("/dashboard");
}
