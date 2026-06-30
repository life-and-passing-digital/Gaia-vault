"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email";
import { isReleaseTier } from "@/lib/vault/tiers";

async function vaultId(userId: string): Promise<string> {
  const db = await getDb();
  const v = await db.getVaultForOwner(userId);
  if (!v) throw new Error("No vault for user.");
  return v.id;
}

const NomineeSchema = z.object({
  fullName: z.string().min(1),
  relationship: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  entitledTier: z.string().refine(isReleaseTier),
});

export async function addNominee(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = NomineeSchema.safeParse({
    fullName: formData.get("fullName"),
    relationship: formData.get("relationship") || undefined,
    email: formData.get("email") || "",
    entitledTier: formData.get("entitledTier") || "funeral_wishes",
  });
  if (!parsed.success) return { error: "Please check the details." };
  const db = await getDb();
  await db.createNominee({
    vaultId: await vaultId(user.id),
    fullName: parsed.data.fullName,
    relationship: parsed.data.relationship,
    email: parsed.data.email || undefined,
    entitledTier: parsed.data.entitledTier as never,
  });
  revalidatePath("/people");
  return {};
}

export async function removeNominee(id: string): Promise<void> {
  await requireUser();
  const db = await getDb();
  await db.deleteNominee(id);
  revalidatePath("/people");
}

export async function addFuneralDirector(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  if (!businessName || !email) return { error: "Business name and email are required." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("funeral_directors").insert({
    vault_id: await vaultId(user.id),
    business_name: businessName,
    contact_name: contactName || null,
    email,
    authorised: true,
  });
  if (error) return { error: "Couldn’t save that just now." };
  revalidatePath("/people");
  return {};
}

/** Invite a partner to co-view designated items while you're alive. */
export async function invitePartner(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const email = String(formData.get("partnerEmail") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your partner’s email." };
  const vid = await vaultId(user.id);

  // Match an existing account by email (service role — cross-user lookup).
  const svc = createSupabaseServiceClient();
  const { data: partner } = await svc
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const sb = await createSupabaseServerClient();
  const { error } = await sb
    .from("living_access_invites")
    .upsert(
      { vault_id: vid, partner_email: email, partner_id: partner?.id ?? null },
      { onConflict: "vault_id,partner_email" },
    );
  if (error) return { error: "Couldn’t send that invite." };

  await getEmailProvider().send({
    to: email,
    subject: "You’ve been invited to share a Gaia Vault",
    text:
      `Hello,\n\nSomeone close to you would like to share part of their Gaia ` +
      `Vault with you, a calm place for the things that matter.\n\n` +
      `Create or sign in to your free account to view what they’ve shared:\n` +
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net"}/signup\n\n` +
      `With care,\nThe Gaia Vault team`,
    tag: "partner-invite",
  });
  revalidatePath("/people");
  return {};
}

/** Re-encrypt one item for an accepted partner so they can co-view it now. */
export async function shareItemWithPartner(
  itemId: string,
  partnerId: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const db = await getDb();
  const item = await db.getItem(itemId);
  if (!item) return { error: "Item not found." };

  const { openItemPersonal, sealForUser } = await import("@/lib/crypto");
  const plaintext = await openItemPersonal(user.id, item);
  const reEnc = await sealForUser(plaintext, partnerId);

  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("living_shares").upsert(
    {
      vault_id: item.vaultId,
      partner_id: partnerId,
      vault_item_id: itemId,
      iv: reEnc.iv,
      ciphertext: reEnc.ciphertext,
    },
    { onConflict: "vault_item_id,partner_id" },
  );
  if (error) return { error: "Couldn’t share that item." };
  await db.audit({
    actorId: user.id,
    actorRole: "user",
    action: "living_share.created",
    entityType: "vault_item",
    entityId: itemId,
    metadata: {},
  });
  revalidatePath("/people");
  return {};
}
