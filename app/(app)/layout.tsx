import { AppNav } from "@/components/app/AppNav";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const sb = await createSupabaseServerClient();
  const { data: admin } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-dvh bg-canvas-100">
      <AppNav isAdmin={Boolean(admin)} />
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
