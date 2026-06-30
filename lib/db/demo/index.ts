// In-memory implementation of DatabaseAdapter for DEMO_MODE. No Supabase, no
// network: everything lives in process memory and resets on restart. Seeded
// once with realistic, fully-decryptable demo content so every screen looks
// alive. This is the adapter boundary (lib/db/adapter.ts) doing exactly what it
// was designed for — swapping the entire backend without touching feature code.

import { sealItem } from "@/lib/crypto";
import { DEMO_PEPPER, DEMO_USER } from "@/lib/demo/config";
import type { DatabaseAdapter } from "../adapter";
import type {
  AuditAction,
  DeathClaim,
  FuneralDirector,
  NewNominee,
  NewVaultItem,
  Nominee,
  Profile,
  SectionType,
  UpdatableVaultItem,
  Vault,
  VaultItem,
  VaultSection,
} from "../types";

const VAULT_ID = "00000000-0000-4000-8000-0000000d0001";

interface Store {
  profile: Profile;
  vault: Vault;
  sections: VaultSection[];
  items: VaultItem[];
  nominees: Nominee[];
  directors: FuneralDirector[];
  claims: DeathClaim[];
}

let store: Store | null = null;
let seeding: Promise<Store> | null = null;

function ts(daysAgo: number): string {
  // Fixed reference date so demo content is deterministic across restarts.
  const base = Date.parse("2026-06-01T00:00:00Z");
  return new Date(base - daysAgo * 86_400_000).toISOString();
}

async function seedItem(
  section: SectionType,
  tier: VaultItem["releaseTier"],
  title: string,
  body: string,
  idx: number,
): Promise<VaultItem> {
  const env = await sealItem({
    userId: DEMO_USER.id,
    plaintext: JSON.stringify({ title, body }),
    releaseTier: tier,
  });
  return {
    id: `00000000-0000-4000-8000-00000000i${idx.toString().padStart(3, "0")}`.slice(0, 36),
    vaultId: VAULT_ID,
    section,
    releaseTier: tier,
    region: "au",
    lastReviewedAt: idx % 2 === 0 ? ts(40) : null,
    createdAt: ts(60 - idx),
    updatedAt: ts(30 - idx),
    ...env,
  };
}

async function buildStore(): Promise<Store> {
  // Ensure crypto has key material even if env wasn't configured.
  if (!process.env.VAULT_KEY_DERIVATION_PEPPER) {
    process.env.VAULT_KEY_DERIVATION_PEPPER = DEMO_PEPPER;
  }
  if (!process.env.RELEASE_WRAPPING_KEY) {
    process.env.RELEASE_WRAPPING_KEY = DEMO_PEPPER;
  }

  const profile: Profile = {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    fullName: DEMO_USER.fullName,
    region: "au",
    plan: "paid",
    planStatus: "active",
    mfaEnabled: false,
    stripeCustomerId: null,
    createdAt: ts(120),
  };
  const vault: Vault = { id: VAULT_ID, ownerId: DEMO_USER.id, region: "au", createdAt: ts(120) };
  const sectionTypes: SectionType[] = ["wishes", "people", "documents", "assets", "messages"];
  const sections: VaultSection[] = sectionTypes.map((section, i) => ({
    id: `sec-${section}`,
    vaultId: VAULT_ID,
    section,
    lastReviewedAt: i < 2 ? ts(20) : null,
  }));

  const items: VaultItem[] = await Promise.all([
    seedItem("wishes", "funeral_wishes", "My funeral preferences",
      "A simple service among the gum trees. Native flowers, no black. Play “Into My Arms”.", 1),
    seedItem("wishes", "funeral_wishes", "Readings & music",
      "Mary Oliver, “Wild Geese”. The kids can choose a song each.", 2),
    seedItem("people", "personal", "Dr. Anita Rao (GP)",
      "Practice: Brunswick Family Health. The kids’ records are there too.", 3),
    seedItem("documents", "estate_authority", "Will & solicitor",
      "Will held with Harper & Lowe, Carlton. Executor is my sister, Jess.", 4),
    seedItem("assets", "estate_authority", "Accounts to wind down",
      "Everyday account at the credit union; super with AwareSuper; a few subscriptions.", 5),
    seedItem("messages", "personal", "For Jess, when the time comes",
      "Thank you for always picking up the phone. Look after Mum’s garden for me.", 6),
  ]);

  const nominees: Nominee[] = [
    {
      id: "nom-1", vaultId: VAULT_ID, fullName: "Jess Wells", relationship: "Sister",
      email: "jess@example.com", phone: null, entitledTier: "estate_authority",
      notifyOnRelease: true, createdAt: ts(90),
    },
    {
      id: "nom-2", vaultId: VAULT_ID, fullName: "Tom Wells", relationship: "Partner",
      email: "tom@example.com", phone: null, entitledTier: "funeral_wishes",
      notifyOnRelease: true, createdAt: ts(80),
    },
  ];
  const directors: FuneralDirector[] = [
    {
      id: "dir-1", vaultId: VAULT_ID, businessName: "Gentle Grove Funerals",
      contactName: "Priya Nair", email: "care@gentlegrove.example", phone: null,
      authorised: true, createdAt: ts(70),
    },
  ];
  const claims: DeathClaim[] = [
    {
      id: "claim-demo-1", deceasedProfileId: null, deceasedEmail: "robert.k@example.com",
      claimantName: "Helen Kerr", claimantEmail: "helen@example.com", claimantPhone: "0400 000 000",
      claimantRelationship: "Daughter", deathCertificatePath: "claim-demo-1/death-certificate.pdf",
      proofOfAuthorityPath: null, status: "submitted", adminNotes: null, corroboration: {},
      authorityConfirmed: false, region: "au", reviewedBy: null, reviewedAt: null, createdAt: ts(2),
    },
    {
      id: "claim-demo-2", deceasedProfileId: null, deceasedEmail: "margaret.s@example.com",
      claimantName: "David Searle", claimantEmail: "david@example.com", claimantPhone: null,
      claimantRelationship: "Son", deathCertificatePath: "claim-demo-2/death-certificate.pdf",
      proofOfAuthorityPath: "claim-demo-2/probate.pdf", status: "under_review",
      adminNotes: "Certificate sighted; awaiting probate confirmation.", corroboration: {},
      authorityConfirmed: false, region: "au", reviewedBy: null, reviewedAt: null, createdAt: ts(6),
    },
  ];

  return { profile, vault, sections, items, nominees, directors, claims };
}

async function getStore(): Promise<Store> {
  if (store) return store;
  if (!seeding) seeding = buildStore().then((s) => (store = s));
  return seeding;
}

class DemoAdapter implements DatabaseAdapter {
  async getProfile(userId: string) {
    const s = await getStore();
    return userId === s.profile.id ? s.profile : null;
  }
  async updateProfile(_userId: string, patch: Partial<Pick<Profile, "fullName" | "mfaEnabled">>) {
    const s = await getStore();
    if (patch.fullName !== undefined) s.profile.fullName = patch.fullName;
    if (patch.mfaEnabled !== undefined) s.profile.mfaEnabled = patch.mfaEnabled;
    return s.profile;
  }
  async getVaultForOwner(userId: string) {
    const s = await getStore();
    return userId === s.vault.ownerId ? s.vault : null;
  }
  async listSections() {
    return (await getStore()).sections;
  }
  async stampSectionReviewed(_vaultId: string, section: string) {
    const s = await getStore();
    const row = s.sections.find((x) => x.section === section);
    if (row) row.lastReviewedAt = new Date().toISOString();
  }
  async listItems(_vaultId: string, section?: string) {
    const s = await getStore();
    return section ? s.items.filter((i) => i.section === section) : s.items;
  }
  async getItem(itemId: string) {
    const s = await getStore();
    return s.items.find((i) => i.id === itemId) ?? null;
  }
  async createItem(input: NewVaultItem) {
    const s = await getStore();
    const item: VaultItem = {
      id: `demo-item-${s.items.length + 1}-${Date.now()}`,
      vaultId: input.vaultId,
      section: input.section,
      releaseTier: input.releaseTier,
      region: "au",
      lastReviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input.envelope,
    };
    s.items.unshift(item);
    return item;
  }
  async updateItem(itemId: string, patch: UpdatableVaultItem) {
    const s = await getStore();
    const item = s.items.find((i) => i.id === itemId);
    if (!item) throw new Error("demo: item not found");
    if (patch.section) item.section = patch.section;
    if (patch.releaseTier) item.releaseTier = patch.releaseTier;
    if (patch.envelope) Object.assign(item, patch.envelope);
    item.updatedAt = new Date().toISOString();
    return item;
  }
  async deleteItem(itemId: string) {
    const s = await getStore();
    s.items = s.items.filter((i) => i.id !== itemId);
  }
  async listNominees() {
    return (await getStore()).nominees;
  }
  async createNominee(input: NewNominee) {
    const s = await getStore();
    const nominee: Nominee = {
      id: `demo-nom-${s.nominees.length + 1}`,
      vaultId: input.vaultId,
      fullName: input.fullName,
      relationship: input.relationship ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      entitledTier: input.entitledTier,
      notifyOnRelease: input.notifyOnRelease ?? true,
      createdAt: new Date().toISOString(),
    };
    s.nominees.push(nominee);
    return nominee;
  }
  async deleteNominee(nomineeId: string) {
    const s = await getStore();
    s.nominees = s.nominees.filter((n) => n.id !== nomineeId);
  }
  async listFuneralDirectors() {
    return (await getStore()).directors;
  }
  async listClaims(status?: DeathClaim["status"]) {
    const s = await getStore();
    return status ? s.claims.filter((c) => c.status === status) : s.claims;
  }
  async getClaim(claimId: string) {
    const s = await getStore();
    return s.claims.find((c) => c.id === claimId) ?? null;
  }
  async audit(_action: AuditAction) {
    // No-op in demo: audit log isn't surfaced and nothing is persisted.
  }
}

export async function createDemoAdapter(): Promise<DatabaseAdapter> {
  return new DemoAdapter();
}
