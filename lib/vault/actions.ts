"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { openItemPersonal, sealItem } from "@/lib/crypto";
import { isReleaseTier, type ReleaseTier } from "@/lib/vault/tiers";
import type { SectionType, VaultItem } from "@/lib/db/types";

/** Decrypted view of an item for the owner. Never persisted. */
export interface DecryptedItem {
  id: string;
  section: SectionType;
  releaseTier: ReleaseTier;
  title: string;
  body: string;
  updatedAt: string;
}

interface ItemContent {
  title: string;
  body: string;
}

async function ownerVaultId(userId: string): Promise<string> {
  const db = await getDb();
  const vault = await db.getVaultForOwner(userId);
  if (!vault) throw new Error("No vault for user — signup trigger may not have run.");
  return vault.id;
}

/** Decrypt one item via the personal path. */
async function decrypt(userId: string, item: VaultItem): Promise<DecryptedItem> {
  const raw = await openItemPersonal(userId, item);
  const content = JSON.parse(raw) as ItemContent;
  return {
    id: item.id,
    section: item.section,
    releaseTier: item.releaseTier,
    title: content.title,
    body: content.body,
    updatedAt: item.updatedAt,
  };
}

/** List a section's items, decrypted for the owner. */
export async function listSectionItems(section: SectionType): Promise<DecryptedItem[]> {
  const user = await requireUser();
  const db = await getDb();
  const vaultId = await ownerVaultId(user.id);
  const items = await db.listItems(vaultId, section);
  // Reading is a sensitive action — audit the action, never the payload.
  await db.audit({
    actorId: user.id,
    actorRole: "user",
    action: "vault_section.read",
    entityType: "section",
    metadata: { section, count: items.length },
  });
  return Promise.all(items.map((i) => decrypt(user.id, i)));
}

/** Counts per section for the dashboard completeness ring. */
export async function sectionCounts(): Promise<Record<SectionType, number>> {
  const user = await requireUser();
  const db = await getDb();
  const vaultId = await ownerVaultId(user.id);
  const items = await db.listItems(vaultId);
  const counts = {
    wishes: 0,
    people: 0,
    documents: 0,
    assets: 0,
    messages: 0,
  } as Record<SectionType, number>;
  for (const i of items) counts[i.section] += 1;
  return counts;
}

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/** Create an encrypted vault item. Encryption happens here, before storage. */
export async function createItem(formData: FormData): Promise<SaveResult> {
  const user = await requireUser();
  const section = String(formData.get("section") ?? "") as SectionType;
  const tierRaw = String(formData.get("releaseTier") ?? "personal");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) return { ok: false, error: "Please give this a short title." };
  if (!isReleaseTier(tierRaw)) return { ok: false, error: "Unknown release setting." };

  const db = await getDb();
  const vaultId = await ownerVaultId(user.id);
  const envelope = await sealItem({
    userId: user.id,
    plaintext: JSON.stringify({ title, body } satisfies ItemContent),
    releaseTier: tierRaw,
  });
  const item = await db.createItem({
    vaultId,
    section,
    releaseTier: tierRaw,
    envelope,
  });
  await db.audit({
    actorId: user.id,
    actorRole: "user",
    action: "vault_item.create",
    entityType: "vault_item",
    entityId: item.id,
    metadata: { section, releaseTier: tierRaw }, // no content
  });
  revalidatePath(`/vault/${section}`);
  revalidatePath("/dashboard");
  return { ok: true, id: item.id };
}

export async function deleteItem(itemId: string, section: SectionType): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  await db.deleteItem(itemId);
  await db.audit({
    actorId: user.id,
    actorRole: "user",
    action: "vault_item.delete",
    entityType: "vault_item",
    entityId: itemId,
    metadata: { section },
  });
  revalidatePath(`/vault/${section}`);
  revalidatePath("/dashboard");
}
