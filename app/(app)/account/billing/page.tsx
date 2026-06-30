import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { startCheckout, openPortal } from "@/lib/billing/actions";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const db = await getDb();
  const profile = await db.getProfile(user.id);
  const isPaid = profile?.plan === "paid";
  const { status } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-display text-forest-800">Billing</h1>

      {status === "success" && (
        <p className="rounded-2xl bg-sage-100 px-4 py-3 text-sm text-forest-800">
          Thank you. Your plan is active, and we’ll keep your vault safe.
        </p>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Your plan</CardTitle>
          <span className="rounded-pill bg-sage-100 px-3 py-1 text-sm text-forest-700 capitalize">
            {profile?.plan ?? "free"}
            {profile?.planStatus && profile.planStatus !== "none"
              ? ` · ${profile.planStatus}`
              : ""}
          </span>
        </div>

        {isPaid ? (
          <>
            <CardDescription className="mt-3">
              You’re on Gaia Vault Plus. Manage your plan, update payment details,
              or cancel any time.
            </CardDescription>
            <form action={openPortal} className="mt-4">
              <Button type="submit" variant="secondary">
                Manage subscription
              </Button>
            </form>
          </>
        ) : (
          <>
            <CardDescription className="mt-3">
              You’re on the free tier, enough to begin. Upgrade to Gaia Vault
              Plus for the full vault, partner sharing and posthumous messages.
            </CardDescription>
            <div className="mt-4 rounded-2xl bg-canvas-200 p-4">
              <p className="text-2xl font-display text-forest-800">
                A$99 <span className="text-base text-ink-400">/ year</span>
              </p>
            </div>
            <form action={startCheckout} className="mt-4">
              <Button type="submit">Upgrade to Plus</Button>
            </form>
            <p className="mt-3 text-xs text-ink-400">
              Your subscription renews automatically each year at A$99 unless you
              cancel beforehand. You can cancel any time from this page; your plan
              continues until the end of the paid period. Prices include GST.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
