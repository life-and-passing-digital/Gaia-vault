import { AppNav } from "@/components/app/AppNav";
import { DemoBanner } from "@/components/app/DemoBanner";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/demo/config";

// The authenticated app is always per-request (auth/session, live data). Never
// prerender it at build — that would bake one user's view into static HTML.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  let isAdmin = false;
  if (DEMO_MODE) {
    isAdmin = true; // demo user can reach the admin console
  } else {
    const sb = await createSupabaseServerClient();
    const { data: admin } = await sb
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(admin);
  }

  return (
    <div className="min-h-dvh bg-canvas-100">
      <DemoBanner />
      <AppNav isAdmin={isAdmin} />
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
