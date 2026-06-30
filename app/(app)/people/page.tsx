import { PeopleManager } from "@/components/people/PeopleManager";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "People" };

export default async function PeoplePage() {
  const user = await requireUser();
  const db = await getDb();
  const vault = await db.getVaultForOwner(user.id);
  const nominees = vault ? await db.listNominees(vault.id) : [];
  const directors = vault ? await db.listFuneralDirectors(vault.id) : [];

  const sb = await createSupabaseServerClient();
  const { data: invites } = await sb
    .from("living_access_invites")
    .select("partner_email,status");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-display text-forest-800">People</h1>
        <p className="mt-1 text-ink-500">
          The people who matter, to share with now, or to care for later.
        </p>
      </div>
      <PeopleManager
        nominees={nominees}
        directors={directors}
        invites={invites ?? []}
      />
    </div>
  );
}
