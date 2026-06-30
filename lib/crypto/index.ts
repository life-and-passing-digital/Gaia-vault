// ═════════════════════════════════════════════════════════════════════════════
// lib/crypto — application-layer encryption for Gaia Vault
//
// Envelope encryption with AES-256-GCM, built on WebCrypto so the exact same
// scheme runs in Node (server actions) and Deno (Supabase Edge Functions).
//
//   plaintext ──AES-256-GCM(DEK)──▶ ciphertext        (per item)
//   DEK ──wrap(userKey)──▶ dekWrappedUser              (personal path, always)
//   DEK ──wrap(wrappingKey)──▶ dekWrappedEscrow        (release path, gated)
//
//   userKey      = HKDF-SHA256(pepper, salt=userId)    — server-derivable
//   wrappingKey  = RELEASE_WRAPPING_KEY (env in v1; KMS in prod — see SECURITY.md)
//
// HONESTY (mirrored in /docs/SECURITY.md and the UI):
//   • The personal path is NOT zero-knowledge: a holder of the DB + pepper can
//     derive userKey and decrypt. We never claim end-to-end-zero-knowledge.
//   • The release set is deliberately recoverable by an approved release process
//     (that is its whole purpose) and is therefore explicitly NOT zero-knowledge.
// ═════════════════════════════════════════════════════════════════════════════

import type { ReleaseTier } from "@/lib/vault/tiers";
import type { EncryptedEnvelope } from "@/lib/db/types";

const IV_BYTES = 12; // 96-bit nonce, the GCM standard
const KEY_BYTES = 32; // AES-256
const subtle = globalThis.crypto.subtle;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// ── base64 helpers ──────────────────────────────────────────────────────────
function toB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
function fromB64(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64"));
}

// WebCrypto's BufferSource is stricter about its backing buffer than Node's
// Buffer/typed-array generics. Normalise any view to a fresh ArrayBuffer-backed
// Uint8Array so it satisfies subtle.* without unsafe casts.
function src(u: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(u.byteLength);
  out.set(u);
  return out;
}

// ── env-held key material ───────────────────────────────────────────────────
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required secret: ${name}`);
  return v;
}

function pepper(): Uint8Array {
  return fromB64(requireEnv("VAULT_KEY_DERIVATION_PEPPER"));
}

/**
 * The company-held wrapping key that escrows release-set DEKs.
 * v1 reads it from env. PRODUCTION HARDENING TODO: this MUST come from a KMS /
 * Supabase Vault and only be usable inside the approved release context. See
 * /docs/SECURITY.md → "Production hardening".
 */
export function releaseWrappingKey(): Uint8Array {
  const key = fromB64(requireEnv("RELEASE_WRAPPING_KEY"));
  if (key.length !== KEY_BYTES) {
    throw new Error("RELEASE_WRAPPING_KEY must be 32 bytes (base64-encoded).");
  }
  return key;
}

// ── primitives ──────────────────────────────────────────────────────────────
export function randomKey(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(KEY_BYTES));
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return subtle.importKey("raw", src(raw), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Derive a per-user key from the server pepper. Deterministic per userId. */
export async function deriveUserKey(userId: string): Promise<Uint8Array> {
  const base = await subtle.importKey("raw", src(pepper()), "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: src(textEncoder.encode(userId)),
      info: src(textEncoder.encode("gaia-vault:user-key:v1")),
    },
    base,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** AES-256-GCM encrypt. Returns base64 iv and base64 ciphertext (incl. tag). */
async function aesEncrypt(
  keyRaw: Uint8Array,
  plaintext: Uint8Array,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await importAesKey(keyRaw);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, src(plaintext));
  return { iv: toB64(iv), ciphertext: toB64(new Uint8Array(ct)) };
}

async function aesDecrypt(
  keyRaw: Uint8Array,
  ivB64: string,
  ciphertextB64: string,
): Promise<Uint8Array> {
  const key = await importAesKey(keyRaw);
  const pt = await subtle.decrypt(
    { name: "AES-GCM", iv: src(fromB64(ivB64)) },
    key,
    src(fromB64(ciphertextB64)),
  );
  return new Uint8Array(pt);
}

/** Wrap a 32-byte DEK under a key-encryption-key. Output packs iv‖ciphertext. */
export async function wrapKey(kek: Uint8Array, dek: Uint8Array): Promise<string> {
  const { iv, ciphertext } = await aesEncrypt(kek, dek);
  const packed = new Uint8Array([...fromB64(iv), ...fromB64(ciphertext)]);
  return toB64(packed);
}

export async function unwrapKey(kek: Uint8Array, wrapped: string): Promise<Uint8Array> {
  const packed = fromB64(wrapped);
  const iv = packed.slice(0, IV_BYTES);
  const ciphertext = packed.slice(IV_BYTES);
  return aesDecrypt(kek, toB64(iv), toB64(ciphertext));
}

// ── high-level: seal & open vault items ─────────────────────────────────────

/**
 * Encrypt a plaintext payload into a storable envelope. Generates a fresh DEK,
 * encrypts the payload, wraps the DEK to the user, and — for release tiers —
 * additionally escrows the DEK under the company wrapping key so an approved
 * release can later recover it.
 */
export async function sealItem(params: {
  userId: string;
  plaintext: string;
  releaseTier: ReleaseTier;
}): Promise<EncryptedEnvelope> {
  const dek = randomKey();
  const { iv, ciphertext } = await aesEncrypt(dek, textEncoder.encode(params.plaintext));
  const userKey = await deriveUserKey(params.userId);
  const dekWrappedUser = await wrapKey(userKey, dek);

  let dekWrappedEscrow: string | null = null;
  if (params.releaseTier !== "personal") {
    dekWrappedEscrow = await wrapKey(releaseWrappingKey(), dek);
  }

  return { encVersion: 1, iv, ciphertext, dekWrappedUser, dekWrappedEscrow };
}

/** Decrypt an item via the personal path (the living owner). */
export async function openItemPersonal(
  userId: string,
  envelope: EncryptedEnvelope,
): Promise<string> {
  const userKey = await deriveUserKey(userId);
  const dek = await unwrapKey(userKey, envelope.dekWrappedUser);
  const pt = await aesDecrypt(dek, envelope.iv, envelope.ciphertext);
  return textDecoder.decode(pt);
}

/**
 * Decrypt an item via the escrow path. Used ONLY inside the approved release
 * context (the release Edge Function / trusted server action) after an admin
 * has approved a death claim. Throws on personal items, which carry no escrow.
 */
export async function openItemViaEscrow(envelope: EncryptedEnvelope): Promise<string> {
  if (!envelope.dekWrappedEscrow) {
    throw new Error("Item has no escrowed key — it is personal and not releasable.");
  }
  const dek = await unwrapKey(releaseWrappingKey(), envelope.dekWrappedEscrow);
  const pt = await aesDecrypt(dek, envelope.iv, envelope.ciphertext);
  return textDecoder.decode(pt);
}

// ── Living shares (re-encrypt one item for another living user) ─────────────
/** Encrypt plaintext directly under a specific user's derived key. */
export async function sealForUser(
  plaintext: string,
  userId: string,
): Promise<{ iv: string; ciphertext: string }> {
  const key = await deriveUserKey(userId);
  return aesEncrypt(key, textEncoder.encode(plaintext));
}

/** Decrypt a living share with the recipient user's own derived key. */
export async function openForUser(
  envelope: { iv: string; ciphertext: string },
  userId: string,
): Promise<string> {
  const key = await deriveUserKey(userId);
  const pt = await aesDecrypt(key, envelope.iv, envelope.ciphertext);
  return textDecoder.decode(pt);
}

// ── Recipient grants ────────────────────────────────────────────────────────
// After release, content is re-encrypted under a key derived from a one-time
// access token that we email to the recipient. The stored row is NOT sufficient
// to read the content without the token, and the token is never stored (only its
// hash). This gives recipients time-limited access to exactly their entitlement.

/** A URL-safe one-time access token (256-bit). */
export function randomToken(): string {
  return Buffer.from(randomKey()).toString("base64url");
}

/** Lookup hash for a token. The raw token is never persisted. */
export async function hashToken(token: string): Promise<string> {
  const digest = await subtle.digest("SHA-256", src(textEncoder.encode(token)));
  return Buffer.from(new Uint8Array(digest)).toString("hex");
}

async function deriveTokenKey(token: string): Promise<Uint8Array> {
  const base = await subtle.importKey(
    "raw",
    src(textEncoder.encode(token)),
    "HKDF",
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: src(textEncoder.encode("gaia-vault:grant")),
      info: src(textEncoder.encode("recipient-access:v1")),
    },
    base,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Re-encrypt released plaintext for a recipient, bound to their token. */
export async function sealForRecipient(
  plaintext: string,
  token: string,
): Promise<{ iv: string; ciphertext: string }> {
  const key = await deriveTokenKey(token);
  return aesEncrypt(key, textEncoder.encode(plaintext));
}

/** Recipient decrypts their grant with the token from their secure link. */
export async function openForRecipient(
  envelope: { iv: string; ciphertext: string },
  token: string,
): Promise<string> {
  const key = await deriveTokenKey(token);
  const pt = await aesDecrypt(key, envelope.iv, envelope.ciphertext);
  return textDecoder.decode(pt);
}
