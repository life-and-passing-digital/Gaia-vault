import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceDb } from "@/lib/db";

export const metadata = { title: "Review queue" };

const STATUS_TONE: Record<string, string> = {
  submitted: "bg-flame-300/30 text-flame-600",
  under_review: "bg-sage-100 text-forest-700",
  approved: "bg-forest-100 text-forest-800",
  rejected: "bg-canvas-300 text-ink-500",
};

export default async function AdminClaimsPage() {
  await requireAdmin();
  const db = await getServiceDb();
  const claims = await db.listClaims();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-forest-800">Review queue</h1>
        <p className="mt-1 text-ink-500">
          Every claim is reviewed by a person. Nothing releases without approval.
        </p>
      </div>

      {claims.length === 0 ? (
        <EmptyState title="No claims to review" description="New notifications will appear here." />
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <Link key={c.id} href={`/admin/claims/${c.id}`}>
              <Card interactive className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-forest-800">{c.deceasedEmail}</p>
                  <p className="text-sm text-ink-500">
                    Claimed by {c.claimantName} ({c.claimantRelationship}) ·{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-pill px-3 py-1 text-xs font-medium ${STATUS_TONE[c.status]}`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
