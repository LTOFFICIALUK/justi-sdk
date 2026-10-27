// Web Crypto access that works in browsers, Bun, Deno, edge runtimes and Node 18+.

type Subtle = SubtleCrypto;
let cached: Subtle | null = null;

export const subtle = async (): Promise<Subtle> => {
  if (cached) return cached;
  const g = (globalThis as { crypto?: Crypto }).crypto;
  if (g?.subtle) return (cached = g.subtle);
  // Node 18 does not expose globalThis.crypto by default.
  const name = "node:crypto";
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ name)) as { webcrypto: Crypto };
  return (cached = mod.webcrypto.subtle);
};

const PKCS8_ED25519 = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]);

/** Imports a 32-byte ed25519 seed (or a 64-byte Solana secret key) as a signing key. */
export const importEd25519 = async (secret: Uint8Array): Promise<CryptoKey> => {
  if (secret.length !== 64 && secret.length !== 32) throw new Error("An ed25519 secret key is 64 bytes (or a 32-byte seed).");
  const der = new Uint8Array(48);
  der.set(PKCS8_ED25519, 0);
  der.set(secret.subarray(0, 32), 16);
  return (await subtle()).importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]);
};

export const ed25519Sign = async (key: CryptoKey, message: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(await (await subtle()).sign({ name: "Ed25519" }, key, message as Uint8Array<ArrayBuffer>));

/** Public key of a 64-byte Solana secret key (its last 32 bytes). */
export const publicKeyOf = (secret: Uint8Array): Uint8Array => {
  if (secret.length !== 64) throw new Error("Pass the 64-byte secret key to read its public key.");
  return secret.subarray(32, 64);
};

export const hmacSha256 = async (secret: string, data: Uint8Array): Promise<Uint8Array> => {
  const s = await subtle();
  const key = await s.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await s.sign("HMAC", key, data as Uint8Array<ArrayBuffer>));
};
