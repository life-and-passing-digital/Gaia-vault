import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ClaimReview } from "@/components/admin/ClaimReview";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceDb } from "@/lib/db";

export default async function AdminClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = await getServiceDb();
  const claim = await db.getClaim(id);
  if (!claim) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/claims" className="text-sm text-forest-700 hover:underline">
        ← Back to queue
      </Link>
      <div>
        <h1 className="text-2xl font-display text-forest-800">
          Claim for {claim.deceasedEmail}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Reference <span className="font-mono">{claim.id}</span> · Status{" "}
          {claim.status.replace("_", " ")}
        </p>
      </div>

      <Card>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-ink-400">Claimant</dt>
          <dd className="text-ink-800">{claim.claimantName}</dd>
          <dt className="text-ink-400">Relationship</dt>
          <dd className="text-ink-800">{claim.claimantRelationship}</dd>
          <dt className="text-ink-400">Contact</dt>
          <dd className="text-ink-800">
            {claim.claimantEmail}
            {claim.claimantPhone ? ` · ${claim.claimantPhone}` : ""}
          </dd>
          <dt className="text-ink-400">Submitted</dt>
          <dd className="text-ink-800">{new Date(claim.createdAt).toLocaleString()}</dd>
        </dl>
      </Card>

      <ClaimReview claim={claim} />
    </div>
  );
}
