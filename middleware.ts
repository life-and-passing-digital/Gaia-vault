import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require a signed-in user. Everything else (marketing, claim
// intake, auth) is public.
const PROTECTED_PREFIXES = ["/dashboard", "/vault", "/people", "/account", "/admin"];

/**
 * Refreshes the Supabase session cookie on every request and gate-keeps
 * protected routes. Admin authorisation is enforced more strictly server-side
 * (see lib/auth/requireAdmin) and at the database via RLS — this is only the
 * first, coarse gate.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured (e.g. a fresh deploy with no env vars yet),
  // never throw — that would 500 EVERY route via MIDDLEWARE_INVOCATION_FAILED.
  // Let public pages render; protected pages are still guarded server-side by
  // requireUser(), which redirects to /login.
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const path = request.nextUrl.pathname;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          toSet: { name: string; value: string; options?: Record<string, unknown> }[],
        ) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
    if (needsAuth && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Auth refresh failed (network/config). Don't take the whole site down;
    // protected routes remain guarded by requireUser() at the page layer.
    console.error("middleware: auth refresh failed", error);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the manifest/icons.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|webmanifest)$).*)"],
};
