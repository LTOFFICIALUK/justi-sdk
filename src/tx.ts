// Minimal Solana wire-format reader for signing: finds the signer slots of a
// serialized (legacy or v0) transaction and writes signatures into them.
import { base58Encode } from "./bytes.js";

const readShortVec = (b: Uint8Array, at: number): [number, number] => {
  let len = 0;
  let size = 0;
  for (;;) {
    const byte = b[at + size];
    if (byte === undefined) throw new Error("Transaction bytes end early.");
    len |= (byte & 0x7f) << (size * 7);
    size++;
    if ((byte & 0x80) === 0) break;
    if (size > 3) throw new Error("Bad compact length.");
  }
  return [len, size];
};

export interface TxLayout {
  /** Number of signature slots. */
  signatureCount: number;
  /** Byte offset of signature slot 0. */
  signaturesAt: number;
  /** Byte offset of the message. */
  messageAt: number;
  /** "legacy" or 0. */
  version: "legacy" | number;
  /** The accounts that must sign, in slot order (base58). */
  signers: string[];
}

/** Reads the signature slots and required signers of a serialized transaction. */
export const txLayout = (tx: Uint8Array): TxLayout => {
  const [count, size] = readShortVec(tx, 0);
  const signaturesAt = size;
  const messageAt = size + count * 64;
  let at = messageAt;
  let version: "legacy" | number = "legacy";
  if (tx[at] & 0x80) {
    version = tx[at] & 0x7f;
    at++;
  }
  const required = tx[at];
  at += 3;
  const [keyCount, keySize] = readShortVec(tx, at);
  at += keySize;
  if (required > keyCount || required !== count) throw new Error("Transaction header does not match its signature slots.");
  const signers: string[] = [];
  for (let i = 0; i < required; i++) signers.push(base58Encode(tx.subarray(at + i * 32, at + i * 32 + 32)));
  return { signatureCount: count, signaturesAt, messageAt, version, signers };
};

/** The bytes a signer signs. */
export const txMessage = (tx: Uint8Array): Uint8Array => tx.subarray(txLayout(tx).messageAt);

/** Returns a copy of tx with `signature` placed in the slot of `pubkey`. */
export const placeSignature = (tx: Uint8Array, pubkey: string, signature: Uint8Array): Uint8Array => {
  if (signature.length !== 64) throw new Error("A signature is 64 bytes.");
  const l = txLayout(tx);
  const slot = l.signers.indexOf(pubkey);
  if (slot < 0) throw new Error(`${pubkey} is not a signer of this transaction.`);
  const out = new Uint8Array(tx);
  out.set(signature, l.signaturesAt + slot * 64);
  return out;
};

/** Signer slots and whether each one holds a signature yet (all-zero slot = unsigned). */
export const signatureStatus = (tx: Uint8Array): { pubkey: string; signed: boolean }[] => {
  const l = txLayout(tx);
  return l.signers.map((pubkey, i) => {
    const sig = tx.subarray(l.signaturesAt + i * 64, l.signaturesAt + i * 64 + 64);
    return { pubkey, signed: sig.some((b) => b !== 0) };
  });
};

/** The transaction id (first signature, base58), or null when slot 0 is unsigned. */
export const txSignature = (tx: Uint8Array): string | null => {
  const l = txLayout(tx);
  const sig = tx.subarray(l.signaturesAt, l.signaturesAt + 64);
  return sig.some((b) => b !== 0) ? base58Encode(sig) : null;
};
