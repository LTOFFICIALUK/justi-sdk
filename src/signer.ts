// Signers. The SDK signs serialized transactions as bytes, so it needs no Solana library.
// Pass a Keypair, a 64-byte secret key, a wallet adapter / Phantom provider, or your own signer.
import { base58Decode, base58Encode } from "./bytes.js";
import { ed25519Sign, importEd25519, publicKeyOf } from "./crypto.js";
import { placeSignature, txMessage } from "./tx.js";

/** Anything that can sign a serialized transaction. */
export interface TransactionSigner {
  /** Base58 public key. */
  readonly publicKey: string;
  /** Takes serialized transaction bytes, returns them with this key's signature in place. */
  signTransaction(tx: Uint8Array): Promise<Uint8Array>;
}

/** A @solana/web3.js Keypair or anything with a 64-byte secretKey. */
export interface KeypairLike {
  secretKey: Uint8Array;
}

/** A wallet adapter, Phantom/Solflare provider, or any object with publicKey and signTransaction(VersionedTransaction). */
export interface WalletLike {
  publicKey: { toBase58(): string } | string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signTransaction?: (tx: any) => Promise<any>;
}

/** The VersionedTransaction class from @solana/web3.js (needed only for wallet adapters). */
export interface VersionedTransactionClass {
  deserialize(bytes: Uint8Array): { serialize(): Uint8Array };
}

export type SignerInput = TransactionSigner | KeypairLike | Uint8Array | WalletLike;

/** A signer whose publicKey is a base58 string signs bytes (the TransactionSigner shape). */
const isTxSigner = (x: unknown): x is TransactionSigner =>
  !!x && typeof x === "object" && typeof (x as TransactionSigner).publicKey === "string" && typeof (x as TransactionSigner).signTransaction === "function";

/** Signs with a raw secret key (64-byte Solana secret key, e.g. Keypair.secretKey or a solana-keygen JSON array). */
export const keypairSigner = (secret: KeypairLike | Uint8Array | number[]): TransactionSigner => {
  const bytes = secret instanceof Uint8Array ? secret : Array.isArray(secret) ? Uint8Array.from(secret) : secret.secretKey;
  const publicKey = base58Encode(publicKeyOf(bytes));
  let key: Promise<CryptoKey> | null = null;
  return {
    publicKey,
    async signTransaction(tx: Uint8Array) {
      key ??= importEd25519(bytes);
      const sig = await ed25519Sign(await key, txMessage(tx));
      return placeSignature(tx, publicKey, sig);
    },
  }
};

/**
 * Signs through a function that signs raw message bytes with ed25519
 * (a KMS, an MPC wallet API, a hardware key). It receives the transaction message.
 */
export const messageSigner = (publicKey: string, signMessage: (message: Uint8Array) => Promise<Uint8Array>): TransactionSigner => {
  base58Decode(publicKey);
  return {
    publicKey,
    async signTransaction(tx: Uint8Array) {
      return placeSignature(tx, publicKey, await signMessage(txMessage(tx)));
    },
  }
};

/**
 * Signs through a browser wallet (wallet adapter, Phantom, Solflare, Backpack...).
 * Pass VersionedTransaction from @solana/web3.js so the wallet gets the object it expects.
 */
export const walletSigner = (wallet: WalletLike, VersionedTransaction: VersionedTransactionClass): TransactionSigner => {
  const pk = typeof wallet.publicKey === "string" ? wallet.publicKey : wallet.publicKey?.toBase58();
  if (!pk) throw new Error("The wallet is not connected.");
  return {
    publicKey: pk,
    async signTransaction(tx: Uint8Array) {
      if (!wallet.signTransaction) throw new Error("This wallet cannot sign transactions.");
      const signed = (await wallet.signTransaction(VersionedTransaction.deserialize(tx))) as { serialize(): Uint8Array };
      return new Uint8Array(signed.serialize());
    },
  }
};

/** Turns any supported signer input into a TransactionSigner. */
export const toSigner = (input: SignerInput, VersionedTransaction?: VersionedTransactionClass): TransactionSigner => {
  if (isTxSigner(input)) return input;
  if (input instanceof Uint8Array) return keypairSigner(input);
  if (input && typeof input === "object" && "secretKey" in input && (input as KeypairLike).secretKey instanceof Uint8Array) return keypairSigner(input as KeypairLike);
  if (input && typeof input === "object" && typeof (input as WalletLike).signTransaction === "function") {
    const w = input as WalletLike;
    if (!VersionedTransaction) {
      throw new Error("To sign with a wallet adapter, pass VersionedTransaction from @solana/web3.js: new Justi({ VersionedTransaction }) or walletSigner(wallet, VersionedTransaction).");
    }
    return walletSigner(w, VersionedTransaction);
  }
  throw new Error("Unsupported signer. Pass a Keypair, a 64-byte secret key, a wallet adapter, or a TransactionSigner.");
};
