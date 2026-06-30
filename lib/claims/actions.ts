"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email";
import { DEMO_MODE } from "@/lib/demo/config";

const ClaimSchema = z.object({
  deceasedName: z.string().min(1),
  deceasedEmail: z.string().email(),
  claimantName: z.string().min(1),
  claimantEmail: z.string().email(),
  claimantPhone: z.string().optional(),
  claimantRelationship: z.string().min(1),
});

export type ClaimResult = { ok: true; ref: string } | { ok: false; error: string };

async function uploadDoc(
  sb: ReturnType<typeof createSupabaseServiceClient>,
  claimId: string,
  field: string,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const path = `${claimId}/${field}-${file.name}`.replace(/[^a-zA-Z0-9._/-]/g, "_");
  const { error } = await sb.storage
    .from("claim-documents") // RESIDENCY: private, in-region bucket
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`claim upload failed: ${error.message}`);
  return path;
}

/**
 * Public death-claim intake. The claimant is NOT a user and can see no vault
 * data — they only submit and await human review. Runs with the service role
 * because there is no authenticated session; all it can do is create a claim.
 *
 * LEGAL-GATE: this submission NEVER releases data. It enters the human review
 * queue. See /docs/SECURITY.md.
 */
export async function submitClaim(formData: FormData): Promise<ClaimResult> {
  if (DEMO_MODE) return { ok: true, ref: "demo-claim-ref-0001" };
  const parsed = ClaimSchema.safeParse({
    deceasedName: formData.get("deceasedName"),
    deceasedEmail: formData.get("deceasedEmail"),
    claimantName: formData.get("claimantName"),
    claimantEmail: formData.get("claimantEmail"),
    claimantPhone: formData.get("claimantPhone") || undefined,
    claimantRelationship: formData.get("claimantRelationship"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the details and try again." };
  }
  const v = parsed.data;
  const sb = createSupabaseServiceClient();

  // Create the claim first (status 'submitted') so we have an id for doc paths.
  const { data: claim, error } = await sb
    .from("death_claims")
    .insert({
      deceased_email: v.deceasedEmail,
      claimant_name: v.claimantName,
      claimant_email: v.claimantEmail,
      claimant_phone: v.claimantPhone ?? null,
      claimant_relationship: v.claimantRelationship,
      status: "submitted",
    })
    .select("id")
    .single();
  if (error || !claim) return { ok: false, error: "We couldn’t submit that just now. Please try again." };

  try {
    const certPath = await uploadDoc(sb, claim.id, "death-certificate", formData.get("deathCertificate") as File | null);
    const authPath = await uploadDoc(sb, claim.id, "proof-of-authority", formData.get("proofOfAuthority") as File | null);
    await sb
      .from("death_claims")
      .update({ death_certificate_path: certPath, proof_of_authority_path: authPath })
      .eq("id", claim.id);
  } catch {
    // Keep the claim; an admin can request documents during review.
  }

  await sb.rpc("append_audit", {
    p_actor_id: null,
    p_actor_role: "service",
    p_action: "claim.submitted",
    p_entity_type: "death_claim",
    p_entity_id: claim.id,
    p_metadata: { relationship: v.claimantRelationship }, // no documents/PII bodies
  });

  // Gentle acknowledgement to the claimant; alert admins out of band.
  const email = getEmailProvider();
  await email.send({
    to: v.claimantEmail,
    subject: "We’ve received your notification",
    text:
      `Dear ${v.claimantName},\n\n` +
      `Thank you for letting us know. We understand this is a difficult time.\n\n` +
      `Your reference is ${claim.id}. A member of our team will carefully review ` +
      `what you’ve sent and be in touch. No information is shared until that ` +
      `review is complete.\n\nWith our condolences,\nThe Gaia Vault team`,
    tag: "claim-ack",
  });

  return { ok: true, ref: claim.id };
}
