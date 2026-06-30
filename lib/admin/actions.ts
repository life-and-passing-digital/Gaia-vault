"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email";
import { createSupabaseReleasePort } from "@/lib/release/supabasePort";
import { executeRelease } from "@/lib/release/execute";

async function auditAdmin(
  sb: ReturnType<typeof createSupabaseServiceClient>,
  adminId: string,
  action: string,
  claimId: string,
  metadata: Record<string, unknown> = {},
) {
  await sb.rpc("append_audit", {
    p_actor_id: adminId,
    p_actor_role: "admin",
    p_action: action,
    p_entity_type: "death_claim",
    p_entity_id: claimId,
    p_metadata: metadata,
  });
}

/** Move a claim into review and (optionally) match it to a deceased profile. */
export async function startReview(claimId: string): Promise<void> {
  const admin = await requireAdmin();
  const sb = createSupabaseServiceClient();
  // Best-effort match the deceased by email to their profile.
  const { data: claim } = await sb
    .from("death_claims")
    .select("deceased_email")
    .eq("id", claimId)
    .maybeSingle();
  let deceasedProfileId: string | null = null;
  if (claim?.deceased_email) {
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .eq("email", claim.deceased_email)
      .maybeSingle();
    deceasedProfileId = profile?.id ?? null;
  }
  await sb
    .from("death_claims")
    .update({
      status: "under_review",
      reviewed_by: admin.id,
      deceased_profile_id: deceasedProfileId,
    })
    .eq("id", claimId);
  await auditAdmin(sb, admin.id, "claim.under_review", claimId, {
    matched: Boolean(deceasedProfileId),
  });
  revalidatePath(`/admin/claims/${claimId}`);
}

/** Save manual corroboration notes. LEGAL-GATE: manual only, never a trigger. */
export async function saveCorroboration(
  claimId: string,
  corroboration: Record<string, unknown>,
): Promise<void> {
  const admin = await requireAdmin();
  const sb = createSupabaseServiceClient();
  await sb.from("death_claims").update({ corroboration }).eq("id", claimId);
  await auditAdmin(sb, admin.id, "claim.corroboration_saved", claimId);
  revalidatePath(`/admin/claims/${claimId}`);
}

/** Confirm proof of legal authority — unlocks estate-tier release. */
export async function confirmAuthority(claimId: string, note: string): Promise<void> {
  const admin = await requireAdmin();
  if (!note.trim()) throw new Error("A note describing the authority is required.");
  const sb = createSupabaseServiceClient();
  await sb
    .from("death_claims")
    .update({ authority_confirmed: true, admin_notes: note })
    .eq("id", claimId);
  await auditAdmin(sb, admin.id, "claim.authority_confirmed", claimId);
  revalidatePath(`/admin/claims/${claimId}`);
}

export async function rejectClaim(claimId: string, note: string): Promise<void> {
  const admin = await requireAdmin();
  if (!note.trim()) throw new Error("A reason is required to reject a claim.");
  const sb = createSupabaseServiceClient();
  await sb
    .from("death_claims")
    .update({ status: "rejected", admin_notes: note, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", claimId);
  await auditAdmin(sb, admin.id, "claim.rejected", claimId);
  revalidatePath(`/admin/claims/${claimId}`);
}

export type ApproveResult =
  | { ok: true; released: number; grants: number }
  | { ok: false; error: string };

/**
 * Approve a claim and execute the release. Mandatory notes. This is the only
 * path that releases data, and it runs only after a human approves here.
 */
export async function approveAndRelease(
  claimId: string,
  note: string,
): Promise<ApproveResult> {
  const admin = await requireAdmin();
  if (!note.trim()) return { ok: false, error: "Approval notes are required." };
  const sb = createSupabaseServiceClient();

  // 1) Record the human approval decision first.
  await sb
    .from("death_claims")
    .update({
      status: "approved",
      admin_notes: note,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claimId);
  await auditAdmin(sb, admin.id, "claim.approved", claimId);

  // 2) Execute the release (funeral wishes now; estate only if authority set).
  try {
    const summary = await executeRelease(claimId, {
      port: createSupabaseReleasePort(),
      email: getEmailProvider(),
      adminId: admin.id,
    });
    revalidatePath(`/admin/claims/${claimId}`);
    return { ok: true, released: summary.releasedItemCount, grants: summary.grantCount };
  } catch (e) {
    await auditAdmin(sb, admin.id, "release.failed", claimId, {
      error: e instanceof Error ? e.message : "unknown",
    });
    return { ok: false, error: "Approved, but the release hit an error. Check the audit log." };
  }
}

/** A short-lived signed URL for viewing an uploaded claim document. */
export async function signClaimDocument(path: string): Promise<string | null> {
  await requireAdmin();
  const sb = createSupabaseServiceClient();
  const { data } = await sb.storage.from("claim-documents").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
