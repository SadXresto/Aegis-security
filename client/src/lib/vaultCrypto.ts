/**
 * Vault password encryption — Web Crypto (AES-256-GCM), browser-side.
 *
 * Threat model (documented on purpose):
 * - The plaintext password is encrypted in the browser and only the ciphertext
 *   (`v1.<iv>.<data>`, base64) is ever written to Supabase.
 * - The per-user data key is a random 256-bit key generated on first use and
 *   kept in the signed-in user's own `user_metadata` (readable only by that
 *   authenticated user through RLS-protected metadata).
 * - This protects passwords at rest in the database/backups. It is *not*
 *   zero-knowledge: a fully compromised account can recover its own key, so it
 *   defends against database exposure rather than a hijacked session.
 * - Requires a secure context (https or localhost); `crypto.subtle` is
 *   unavailable otherwise and the vault surfaces a clear message.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";

const META_KEY = "aegis_vault_key";
const FORMAT_PREFIX = "v1";

function assertSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("This browser can't encrypt the vault. Use a secure (https) connection and a modern browser.");
  }
  return subtle;
}

function toBase64(bytes: Uint8Array<ArrayBufferLike>): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Returns a Uint8Array backed by a plain ArrayBuffer so it satisfies BufferSource.
function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return assertSubtleCrypto().importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Returns the user's vault key, creating and persisting it on first use.
 */
export async function getVaultKey(client: SupabaseClient, user: User): Promise<CryptoKey> {
  const existing = (user.user_metadata as Record<string, unknown> | null | undefined)?.[META_KEY];

  if (typeof existing === "string" && existing.length > 0) {
    try {
      return await importKey(fromBase64(existing));
    } catch {
      /* corrupted metadata — fall through and mint a fresh key */
    }
  }

  const raw = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const { error } = await client.auth.updateUser({
    data: { [META_KEY]: toBase64(raw) },
  });
  if (error) throw error;
  return importKey(raw);
}

export async function encryptSecret(key: CryptoKey, plain: string): Promise<string> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await assertSubtleCrypto().encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${FORMAT_PREFIX}.${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

/** Returns null when the payload is missing, malformed, or not decryptable. */
export async function decryptSecret(key: CryptoKey, payload: string | null): Promise<string | null> {
  if (!payload) return null;
  try {
    const [prefix, ivPart, dataPart] = payload.split(".");
    if (prefix !== FORMAT_PREFIX || !ivPart || !dataPart) return null;
    const plain = await assertSubtleCrypto().decrypt(
      { name: "AES-GCM", iv: fromBase64(ivPart) },
      key,
      fromBase64(dataPart)
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
