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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the manifest/icons.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|webmanifest)$).*)"],
};
