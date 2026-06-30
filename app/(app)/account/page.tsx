import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { MfaSetup } from "@/components/account/MfaSetup";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { REGIONS } from "@/lib/regions/config";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const db = await getDb();
  const profile = await db.getProfile(user.id);
  const sb = await createSupabaseServerClient();
  const { data: factors } = await sb.auth.mfa.listFactors();
  const hasMfa = Boolean(factors?.totp?.length);
  const region = profile ? REGIONS[profile.region] : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-display text-forest-800">Account</h1>

      <Card>
        <CardTitle>Your details</CardTitle>
        <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-ink-400">Name</dt>
          <dd className="text-ink-800">{profile?.fullName ?? "—"}</dd>
          <dt className="text-ink-400">Email</dt>
          <dd className="text-ink-800">{profile?.email}</dd>
          <dt className="text-ink-400">Plan</dt>
          <dd className="text-ink-800 capitalize">{profile?.plan ?? "free"}</dd>
          <dt className="text-ink-400">Data region</dt>
          <dd className="text-ink-800">{region?.label ?? "Australia"}</dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Two-step verification</CardTitle>
        <CardDescription className="mt-1 mb-4">
          Add a one-time code from an authenticator app for extra protection.
          Optional, and you can turn it off any time.
        </CardDescription>
        <MfaSetup alreadyEnrolled={hasMfa} />
      </Card>

      <Card>
        <CardTitle>Billing</CardTitle>
        <CardDescription className="mt-1">
          Manage your plan, see invoices, or change your payment method.
        </CardDescription>
        <a
          href="/account/billing"
          className="mt-4 inline-block text-sm text-forest-700 underline"
        >
          Go to billing →
        </a>
      </Card>
    </div>
  );
}
