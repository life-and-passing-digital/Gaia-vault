// Deno (Edge Function) mirror of lib/crypto's release primitives. Same scheme
// (AES-256-GCM + HKDF-SHA256, envelope), implemented on WebCrypto with no Node
// Buffer. Keep in lockstep with lib/crypto/index.ts.
//
// PRODUCTION HARDENING: in production the RELEASE_WRAPPING_KEY must come from a
// KMS reachable ONLY by this function's identity — not from an env var. See
// /docs/SECURITY.md gate 5.

const IV_BYTES = 12;
const KEY_BYTES = 32;
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function wrappingKey(): Uint8Array {
  const raw = Deno.env.get("RELEASE_WRAPPING_KEY");
  if (!raw) throw new Error("RELEASE_WRAPPING_KEY not set");
  const key = b64ToBytes(raw);
  if (key.length !== KEY_BYTES) throw new Error("wrapping key must be 32 bytes");
  return key;
}

async function importAes(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function aesDecrypt(keyRaw: Uint8Array, ivB64: string, ctB64: string): Promise<string> {
  const key = await importAes(keyRaw);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) },
    key,
    b64ToBytes(ctB64),
  );
  return dec.decode(pt);
}

async function aesEncrypt(keyRaw: Uint8Array, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await importAes(keyRaw);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return { iv: bytesToB64(iv), ciphertext: bytesToB64(new Uint8Array(ct)) };
}

async function unwrap(kek: Uint8Array, wrapped: string): Promise<Uint8Array> {
  const packed = b64ToBytes(wrapped);
  const iv = packed.slice(0, IV_BYTES);
  const ct = packed.slice(IV_BYTES);
  const key = await importAes(kek);
  const dekBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new Uint8Array(dekBuf);
}

export interface Envelope {
  iv: string;
  ciphertext: string;
  dek_wrapped_escrow: string | null;
}

/** Decrypt a release-tier item via the escrow path. */
export async function openItemViaEscrow(item: Envelope): Promise<string> {
  if (!item.dek_wrapped_escrow) throw new Error("item not releasable (no escrow key)");
  const dek = await unwrap(wrappingKey(), item.dek_wrapped_escrow);
  return aesDecrypt(dek, item.iv, item.ciphertext);
}

export function randomToken(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(KEY_BYTES)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return bytesToHex(new Uint8Array(digest));
}

async function deriveTokenKey(token: string): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", enc.encode(token), "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode("gaia-vault:grant"),
      info: enc.encode("recipient-access:v1"),
    },
    base,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function sealForRecipient(plaintext: string, token: string) {
  const key = await deriveTokenKey(token);
  return aesEncrypt(key, plaintext);
}
