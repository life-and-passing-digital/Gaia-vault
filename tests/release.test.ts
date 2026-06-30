import { beforeAll, describe, expect, it } from "vitest";
import { sealItem } from "@/lib/crypto";
import { MemoryEmailProvider } from "@/lib/email";
import { executeRelease } from "@/lib/release/execute";
import type {
  GrantInput,
  ReleaseEventInput,
  ReleasePort,
  ReleaseRecipient,
} from "@/lib/release/types";
import type { DeathClaim, VaultItem } from "@/lib/db/types";
import type { ReleaseTier } from "@/lib/vault/tiers";

beforeAll(() => {
  process.env.VAULT_KEY_DERIVATION_PEPPER = Buffer.alloc(32, 7).toString("base64");
  process.env.RELEASE_WRAPPING_KEY = Buffer.alloc(32, 9).toString("base64");
});

const OWNER = "00000000-0000-0000-0000-0000000000aa";
const VAULT = "00000000-0000-0000-0000-0000000000bb";
const ADMIN = "00000000-0000-0000-0000-0000000000cc";

async function makeItem(
  id: string,
  tier: ReleaseTier,
  plaintext: string,
): Promise<VaultItem> {
  const env = await sealItem({ userId: OWNER, plaintext, releaseTier: tier });
  return {
    id,
    vaultId: VAULT,
    section: "wishes",
    releaseTier: tier,
    region: "au",
    lastReviewedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...env,
  };
}

class FakePort implements ReleasePort {
  events: ReleaseEventInput[] = [];
  grants: GrantInput[] = [];
  audits: { action: string; metadata?: Record<string, unknown> }[] = [];
  private seq = 0;

  constructor(
    private claim: DeathClaim,
    private items: VaultItem[],
    private recipients: Record<string, ReleaseRecipient[]>,
  ) {}

  async getClaim() {
    return this.claim;
  }
  async getVaultIdForOwner(ownerId: string) {
    return ownerId === OWNER ? VAULT : null;
  }
  async listReleasableItems() {
    // Simulate the DB query: only escrowed (release-tier) items come back.
    return this.items.filter((i) => i.dekWrappedEscrow !== null);
  }
  async listItemRecipients(itemId: string) {
    return this.recipients[itemId] ?? [];
  }
  async recordReleaseEvent(input: ReleaseEventInput) {
    this.events.push(input);
    return { id: `evt_${++this.seq}` };
  }
  async createGrant(input: GrantInput) {
    this.grants.push(input);
  }
  async audit(action: { action: string; metadata?: Record<string, unknown> }) {
    this.audits.push({ action: action.action, metadata: action.metadata });
  }
}

function baseClaim(overrides: Partial<DeathClaim> = {}): DeathClaim {
  return {
    id: "claim_1",
    deceasedProfileId: OWNER,
    deceasedEmail: "owner@example.com",
    claimantName: "A Relative",
    claimantEmail: "relative@example.com",
    claimantPhone: null,
    claimantRelationship: "child",
    deathCertificatePath: "claim_1/cert.pdf",
    proofOfAuthorityPath: null,
    status: "approved",
    adminNotes: "verified",
    corroboration: {},
    authorityConfirmed: false,
    region: "au",
    reviewedBy: ADMIN,
    reviewedAt: "2026-02-01T00:00:00Z",
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

const director: ReleaseRecipient = {
  type: "funeral_director",
  id: "dir_1",
  email: "director@example.com",
  entitledTier: "funeral_wishes",
};
const executor: ReleaseRecipient = {
  type: "nominee",
  id: "nom_1",
  email: "executor@example.com",
  entitledTier: "estate_authority",
};

describe("release workflow", () => {
  it("refuses to release an unapproved claim", async () => {
    const port = new FakePort(baseClaim({ status: "under_review" }), [], {});
    await expect(
      executeRelease("claim_1", { port, email: new MemoryEmailProvider(), adminId: ADMIN }),
    ).rejects.toThrow(/not approved/i);
  });

  it("releases funeral wishes but holds estate until authority is confirmed", async () => {
    const personal = await makeItem("i_personal", "personal", "secret diary");
    const funeral = await makeItem("i_funeral", "funeral_wishes", "native garden, no black");
    const estate = await makeItem("i_estate", "estate_authority", "bank: ACME #123");
    const port = new FakePort(baseClaim({ authorityConfirmed: false }), [personal, funeral, estate], {
      i_funeral: [director],
      i_estate: [executor],
    });
    const email = new MemoryEmailProvider();

    const summary = await executeRelease("claim_1", { port, email, adminId: ADMIN });

    expect(summary.releasedItemCount).toBe(1); // only the funeral item
    expect(summary.grantCount).toBe(1);
    expect(summary.skipped).toContainEqual({
      reason: "estate_authority_not_confirmed",
      count: 1,
    });
    // Personal item never appears in events/grants.
    expect(port.events.every((e) => e.vaultItemId !== "i_personal")).toBe(true);
    // A gentle notification went out, containing a link but NOT the content.
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]!.text).not.toContain("native garden");
    expect(email.sent[0]!.text).toContain("/access?token=");
    // Audit recorded the completion without payloads.
    expect(port.audits.some((a) => a.action === "release.completed")).toBe(true);
  });

  it("releases estate items once authority is confirmed", async () => {
    const estate = await makeItem("i_estate", "estate_authority", "bank: ACME #123");
    const port = new FakePort(baseClaim({ authorityConfirmed: true }), [estate], {
      i_estate: [executor],
    });
    const summary = await executeRelease("claim_1", {
      port,
      email: new MemoryEmailProvider(),
      adminId: ADMIN,
    });
    expect(summary.releasedItemCount).toBe(1);
    expect(port.events[0]!.releasedTier).toBe("estate_authority");
    // The stored grant is re-encrypted, not plaintext.
    expect(port.grants[0]!.ciphertext).not.toContain("ACME");
  });
});
