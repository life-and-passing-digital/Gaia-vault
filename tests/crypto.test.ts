import { beforeAll, describe, expect, it } from "vitest";
import {
  deriveUserKey,
  openItemPersonal,
  openItemViaEscrow,
  sealItem,
  unwrapKey,
  wrapKey,
  randomKey,
} from "@/lib/crypto";

// Deterministic test keys (32 bytes, base64). These never leave the test.
const TEST_PEPPER = Buffer.alloc(32, 7).toString("base64");
const TEST_WRAPPING_KEY = Buffer.alloc(32, 9).toString("base64");

beforeAll(() => {
  process.env.VAULT_KEY_DERIVATION_PEPPER = TEST_PEPPER;
  process.env.RELEASE_WRAPPING_KEY = TEST_WRAPPING_KEY;
});

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

describe("envelope encryption", () => {
  it("round-trips a personal item for its owner", async () => {
    const env = await sealItem({
      userId: USER_A,
      plaintext: "my super-sensitive note",
      releaseTier: "personal",
    });
    expect(env.dekWrappedEscrow).toBeNull(); // personal is never escrowed
    const out = await openItemPersonal(USER_A, env);
    expect(out).toBe("my super-sensitive note");
  });

  it("does not let another user decrypt via the personal path", async () => {
    const env = await sealItem({
      userId: USER_A,
      plaintext: "private",
      releaseTier: "personal",
    });
    await expect(openItemPersonal(USER_B, env)).rejects.toThrow();
  });

  it("escrows release-tier items and recovers them via the escrow path", async () => {
    const env = await sealItem({
      userId: USER_A,
      plaintext: "funeral: native garden, no black",
      releaseTier: "funeral_wishes",
    });
    expect(env.dekWrappedEscrow).not.toBeNull();
    // Owner can still read it while alive…
    expect(await openItemPersonal(USER_A, env)).toContain("native garden");
    // …and the approved release context can read it via escrow.
    expect(await openItemViaEscrow(env)).toContain("native garden");
  });

  it("refuses to escrow-open a personal item (no escrow key exists)", async () => {
    const env = await sealItem({
      userId: USER_A,
      plaintext: "personal only",
      releaseTier: "personal",
    });
    await expect(openItemViaEscrow(env)).rejects.toThrow(/not releasable/i);
  });

  it("detects tampering (GCM authentication)", async () => {
    const env = await sealItem({
      userId: USER_A,
      plaintext: "do not tamper",
      releaseTier: "personal",
    });
    const corrupted = { ...env, ciphertext: flipLastByte(env.ciphertext) };
    await expect(openItemPersonal(USER_A, corrupted)).rejects.toThrow();
  });

  it("derives distinct keys per user and supports raw wrap/unwrap", async () => {
    const ka = await deriveUserKey(USER_A);
    const kb = await deriveUserKey(USER_B);
    expect(Buffer.from(ka).equals(Buffer.from(kb))).toBe(false);

    const dek = randomKey();
    const wrapped = await wrapKey(ka, dek);
    const unwrapped = await unwrapKey(ka, wrapped);
    expect(Buffer.from(unwrapped).equals(Buffer.from(dek))).toBe(true);
    await expect(unwrapKey(kb, wrapped)).rejects.toThrow();
  });
});

function flipLastByte(b64: string): string {
  const buf = Buffer.from(b64, "base64");
  const last = buf.length - 1;
  buf.writeUInt8(buf.readUInt8(last) ^ 0xff, last);
  return buf.toString("base64");
}
