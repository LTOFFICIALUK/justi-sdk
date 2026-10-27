import { base58Encode, base64Decode, base64Encode, toRaw, utf8 } from "./bytes.js";
import { ed25519Sign, importEd25519, publicKeyOf } from "./crypto.js";
import { JustiError, type RateLimitInfo } from "./errors.js";
import type { Channel, StreamEvent } from "./events.js";
import { JustiApi, type RequestOptions } from "./gen/client.js";
import type * as T from "./gen/types.js";
import { makeRequester } from "./http.js";
import { toSigner, type SignerInput, type TransactionSigner, type VersionedTransactionClass } from "./signer.js";
import { signatureStatus, txSignature } from "./tx.js";
import { verifyWebhook, parseWebhook, type VerifyOptions } from "./webhook.js";
import { openSubscription, type SubscribeOptions, type Subscription } from "./ws.js";

/** Production API. */
export const DEFAULT_BASE_URL = "https://server-production-cc13.up.railway.app";
/** The site, for coin links. */
export const SITE_URL = "https://justi.fun";
export const SOL_DECIMALS = 9;
export const TOKEN_DECIMALS = 6;

export interface JustiOptions {
  /** API key (jf_live_...). Optional. Raises rate limits and attributes swaps and launches to you. */
  apiKey?: string;
  /** API base URL. Default: the production API. */
  baseUrl?: string;
  /** Custom fetch (e.g. for proxies or tests). */
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Default 45000. */
  timeoutMs?: number;
  /** GET retries on 429/502/503/network errors. Default 2. */
  retries?: number;
  /** VersionedTransaction from @solana/web3.js. Only needed to sign with a browser wallet adapter. */
  VersionedTransaction?: VersionedTransactionClass;
  /** Called with the RateLimit headers of every response. */
  onRateLimit?: (info: RateLimitInfo) => void;
}

type Amount = string | number | bigint;

export interface QuoteInput {
  mint: string;
  side: "buy" | "sell";
  /** Buy: SOL to spend, as a decimal (0.5 = half a SOL). */
  sol?: Amount;
  /** Sell: whole tokens to sell, as a decimal (1500.25). */
  tokens?: Amount;
  /** Raw amount: lamports for a buy, raw token units (6 decimals) for a sell. */
  amount?: Amount;
  /** Basis points, 10 to 5000. Default 1000 (10%). */
  slippageBps?: number;
}

export interface TradeOptions {
  /** Who pays and signs: a Keypair, a 64-byte secret key, a wallet adapter, or a TransactionSigner. */
  signer: SignerInput;
  slippageBps?: number;
  /** "auto" (default) or micro-lamports per compute unit. */
  priorityFee?: "auto" | number;
  computeUnitLimit?: "auto" | number;
  /** Adds a Jito tip and sends through Jito too. */
  jitoTipLamports?: Amount;
  /** How long the submit call waits on the server, ms (max 25000). Default 20000. */
  waitMs?: number;
  /** After submit, keep polling until confirmed, failed or expired. Default true. */
  wait?: boolean;
  /** Give up polling after this many ms. Default 90000. */
  timeoutMs?: number;
  /** Build and sign only; return the signed transaction without sending it. */
  dryRun?: boolean;
  signal?: AbortSignal;
}

export interface BuyInput extends TradeOptions {
  mint: string;
  /** SOL to spend as a decimal. Or pass `lamports`. */
  sol?: Amount;
  lamports?: Amount;
}

export interface SellInput extends TradeOptions {
  mint: string;
  /** Whole tokens as a decimal. Or pass `amount` in raw units. */
  tokens?: Amount;
  amount?: Amount;
}

export interface TradeResult {
  swapId: string;
  status: T.SwapStatus["status"];
  signature: string | null;
  route: string;
  quote: T.Quote;
  error: T.SwapStatus["error"];
  /** The signed transaction (base64). */
  transaction: string;
}

export type ImageInput = string | Uint8Array | Blob;

export interface LaunchInput extends Omit<T.LaunchRequest, "wallet" | "image" | "banner" | "devBuyLamports" | "mint" | "creatorBps" | "description"> {
  /** The creator wallet: pays, signs and owns the coin. */
  signer: SignerInput;
  /** https URL, data URL, or image bytes (png, jpeg, gif, webp). */
  image: ImageInput;
  /** Optional 3:1 banner, same forms as image. */
  banner?: ImageInput | null;
  description?: string;
  /** Creator fee in bps. creator: 0-250 step 25. split: 25-200 step 25. holders: 0. */
  creatorBps?: number;
  /** Dev buy in SOL (decimal). Or `devBuyLamports`. Capped at 15% of supply. */
  devBuySol?: Amount;
  devBuyLamports?: Amount;
  /** A custom (vanity) mint keypair. You keep it; the SDK signs with it locally and never sends the secret. */
  mintSigner?: SignerInput;
  /** How long submit waits on the server, ms. Default 20000. */
  waitMs?: number;
  /** After submit, poll until live, failed or expired. Default true. */
  wait?: boolean;
  /** Give up polling after this many ms. Default 90000. */
  timeoutMs?: number;
  /** Build and sign only; return the signed transaction without sending it. */
  dryRun?: boolean;
  signal?: AbortSignal;
}

export interface LaunchResult {
  launchId: string;
  mint: string;
  status: T.Launch["status"] | "signed";
  signature: string | null;
  /** Coin page on justi.fun. */
  url: string;
  built: T.LaunchBuilt;
  /** The signed transaction (base64). */
  transaction: string;
  error: string | null;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new JustiError("timeout", "Cancelled."));
    });
  });

const str = (v: Amount) => (typeof v === "string" ? v.trim() : typeof v === "bigint" ? v.toString() : Number.isInteger(v) ? String(v) : (() => { throw new JustiError("invalid_params", `Raw amounts are whole numbers; got ${v}.`); })());

const sniffMime = (b: Uint8Array): string | null => {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
};

/** Image input to the string the API takes (https URL or data URL). */
export const imageToString = async (img: ImageInput): Promise<string> => {
  if (typeof img === "string") return img;
  const bytes = img instanceof Uint8Array ? img : new Uint8Array(await img.arrayBuffer());
  const mime = sniffMime(bytes) ?? (typeof Blob !== "undefined" && img instanceof Blob ? img.type : null);
  if (!mime || !mime.startsWith("image/")) throw new JustiError("invalid_params", "The image must be png, jpeg, gif or webp.");
  return `data:${mime};base64,${base64Encode(bytes)}`;
};

/** A signer for the self-serve key message: a Keypair / secret key, or a wallet with signMessage (Phantom, wallet adapter). */
export type MessageSignerInput = { secretKey: Uint8Array } | Uint8Array | { publicKey: { toBase58(): string } | string; signMessage(message: Uint8Array): Promise<Uint8Array | { signature: Uint8Array }> };

/** The exact message a wallet signs to get a free API key. */
export const apiKeyMessage = (wallet: string, label: string, ts: number) => `justi.fun api key\nwallet: ${wallet}\nlabel: ${label}\ntime: ${ts}`;

/**
 * justi.fun client. Every API operation is a method (named by operationId), plus helpers:
 * launch, quote, buy, sell, getCoin, listCoins, coins, subscribe, verifyWebhook.
 */
export class Justi extends JustiApi {
  readonly baseUrl: string;
  readonly apiKey: string | undefined;
  private readonly VT: VersionedTransactionClass | undefined;
  /** RateLimit headers of the latest response. */
  rateLimit: RateLimitInfo | null = null;

  constructor(opts: JustiOptions = {}) {
    const baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    let self: Justi | null = null;
    super(
      makeRequester({
        baseUrl,
        apiKey: opts.apiKey,
        fetch: opts.fetch,
        timeoutMs: opts.timeoutMs,
        retries: opts.retries,
        userAgent: "justi-sdk/0.1.0",
        onRateLimit: (info) => {
          if (self) self.rateLimit = info;
          opts.onRateLimit?.(info);
        },
      }),
    );
    self = this;
    this.baseUrl = baseUrl;
    this.apiKey = opts.apiKey;
    this.VT = opts.VersionedTransaction;
  }

  /** One coin with metadata, safety facts, curve, graduation, sniper window and totals. */
  getCoin(mint: string, opts?: RequestOptions): Promise<T.TokenDetail> {
    return this.getToken(mint, opts);
  }

  /** Coins with filters, sort, search (q) and a cursor. */
  listCoins(query?: T.ListTokensQuery, opts?: RequestOptions): Promise<T.TokenPage> {
    return this.listTokens(query, opts);
  }

  /** Every coin matching the query, page by page. `for await (const c of justi.coins({ sort: "volume24h" }))` */
  async *coins(query: Omit<T.ListTokensQuery, "cursor"> = {}, opts?: RequestOptions): AsyncGenerator<T.TokenSummary> {
    let cursor: string | undefined;
    do {
      const page = await this.listTokens({ ...query, cursor }, opts);
      yield* page.tokens;
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
  }

  /** Quote a buy or sell. Pass `sol` (buy) or `tokens` (sell) as decimals, or `amount` in raw units. */
  async quote(input: QuoteInput, opts?: RequestOptions): Promise<T.Quote> {
    return this.getQuote({ mint: input.mint, side: input.side, amount: rawAmount(input), slippageBps: input.slippageBps }, opts);
  }

  /** Build, sign, submit and confirm a buy. */
  async buy(input: BuyInput): Promise<TradeResult> {
    const amount = input.lamports !== undefined ? str(input.lamports) : input.sol !== undefined ? toRaw(input.sol, SOL_DECIMALS).toString() : missing("sol or lamports");
    return this.trade("buy", input.mint, amount, input);
  }

  /** Build, sign, submit and confirm a sell. */
  async sell(input: SellInput): Promise<TradeResult> {
    const amount = input.amount !== undefined ? str(input.amount) : input.tokens !== undefined ? toRaw(input.tokens, TOKEN_DECIMALS).toString() : missing("tokens or amount");
    return this.trade("sell", input.mint, amount, input);
  }

  /** Turns a signer input into a TransactionSigner (uses the VersionedTransaction given to the constructor for wallet adapters). */
  signer(input: SignerInput): TransactionSigner {
    return toSigner(input, this.VT);
  }

  private async trade(side: "buy" | "sell", mint: string, amount: string, o: TradeOptions): Promise<TradeResult> {
    const signer = this.signer(o.signer);
    const built = await this.buildSwap(
      {
        mint,
        wallet: signer.publicKey,
        side,
        amount,
        slippageBps: o.slippageBps,
        priorityFee: o.priorityFee,
        computeUnitLimit: o.computeUnitLimit,
        jitoTipLamports: o.jitoTipLamports !== undefined ? str(o.jitoTipLamports) : undefined,
      },
      { signal: o.signal },
    );
    const signedBytes = await signer.signTransaction(base64Decode(built.transaction)).catch((e: unknown) => {
      throw new JustiError("signer", `The wallet did not sign: ${e instanceof Error ? e.message : String(e)}`);
    });
    const transaction = base64Encode(signedBytes);
    const base = { swapId: built.swapId, route: built.route, quote: built.quote, transaction };
    if (o.dryRun) return { ...base, status: "built", signature: txSignature(signedBytes), error: null };
    let st = await this.submitSwap({ swapId: built.swapId, transaction, waitMs: o.waitMs }, { signal: o.signal });
    if (o.wait !== false) st = await this.waitForSwap(built.swapId, { timeoutMs: o.timeoutMs, signal: o.signal, last: st });
    return { ...base, status: st.status, signature: st.signature, error: st.error, route: st.route || built.route };
  }

  /** Polls a swap until it is confirmed, failed or expired. */
  async waitForSwap(swapId: string, o: { timeoutMs?: number; signal?: AbortSignal; last?: T.SwapStatus } = {}): Promise<T.SwapStatus> {
    const end = Date.now() + (o.timeoutMs ?? 90_000);
    let st = o.last ?? (await this.getSwap(swapId, { signal: o.signal }));
    while (st.status === "submitted" || st.status === "built") {
      if (Date.now() > end) return st;
      await sleep(2000, o.signal);
      st = await this.getSwap(swapId, { signal: o.signal });
    }
    return st;
  }

  /** Polls a launch until it is live, failed or expired. */
  async waitForLaunch(launchId: string, o: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<T.Launch> {
    const end = Date.now() + (o.timeoutMs ?? 90_000);
    let l = await this.getLaunch(launchId, { signal: o.signal });
    while (l.status === "submitted" || l.status === "built") {
      if (Date.now() > end) return l;
      await sleep(2000, o.signal);
      l = await this.getLaunch(launchId, { signal: o.signal });
    }
    return l;
  }

  /**
   * Launch a coin: build on the server (same rules as the site), sign locally with
   * your wallet (and your mint key for a vanity mint), submit privately, wait until live.
   */
  async launch(input: LaunchInput): Promise<LaunchResult> {
    const signer = this.signer(input.signer);
    const mintSigner = input.mintSigner ? this.signer(input.mintSigner) : null;
    const devBuyLamports = input.devBuyLamports !== undefined ? str(input.devBuyLamports) : input.devBuySol !== undefined ? toRaw(input.devBuySol, SOL_DECIMALS).toString() : "0";
    const built = await this.buildLaunch(
      {
        wallet: signer.publicKey,
        name: input.name,
        ticker: input.ticker,
        description: input.description ?? "",
        image: await imageToString(input.image),
        banner: input.banner ? await imageToString(input.banner) : undefined,
        xUrl: input.xUrl,
        telegramUrl: input.telegramUrl,
        website: input.website,
        mode: input.mode,
        creatorBps: input.creatorBps ?? 0,
        devBuyLamports,
        mint: mintSigner?.publicKey,
      },
      { signal: input.signal },
    );
    let bytes = base64Decode(built.transaction);
    for (const s of built.signers) {
      if (s.signed) continue;
      const who = s.pubkey === signer.publicKey ? signer : mintSigner && s.pubkey === mintSigner.publicKey ? mintSigner : null;
      if (!who) throw new JustiError("signer", `The transaction needs a signature from ${s.pubkey} (${s.role}) and no signer for it was given.`);
      bytes = await who.signTransaction(bytes).catch((e: unknown) => {
        throw new JustiError("signer", `The wallet did not sign: ${e instanceof Error ? e.message : String(e)}`);
      });
    }
    const unsigned = signatureStatus(bytes).filter((s) => !s.signed);
    if (unsigned.length) throw new JustiError("signer", `Still unsigned: ${unsigned.map((u) => u.pubkey).join(", ")}.`);
    const transaction = base64Encode(bytes);
    const out: LaunchResult = { launchId: built.launchId, mint: built.mint, status: "signed", signature: txSignature(bytes), url: `${SITE_URL}/coin/${built.mint}`, built, transaction, error: null };
    if (input.dryRun) return out;
    const sub = await this.submitLaunch(built.launchId, { transaction, waitMs: input.waitMs }, { signal: input.signal });
    out.status = sub.status;
    out.signature = sub.signature;
    if (sub.status !== "live" && input.wait !== false) {
      const l = await this.waitForLaunch(built.launchId, { timeoutMs: input.timeoutMs, signal: input.signal });
      out.status = l.status;
      out.signature = l.signature ?? out.signature;
      out.error = l.error;
    }
    return out;
  }

  /**
   * Live events over the WebSocket, with auto-reconnect and resubscribe.
   * Channels: "launches", "trades", "trades:<mint>", "graduations", "burns".
   */
  subscribe(channels: Channel[], onEvent: (e: StreamEvent) => void, opts?: SubscribeOptions): Subscription {
    const url = this.baseUrl.replace(/^http/, "ws") + "/v1/ws" + (this.apiKey ? `?key=${encodeURIComponent(this.apiKey)}` : "");
    return openSubscription(url, channels, onEvent, opts);
  }

  /** Checks a webhook delivery's Justi-Signature header. See also parseWebhook. */
  static verifyWebhook(rawBody: string | Uint8Array, signatureHeader: string | null | undefined, secret: string, opts?: VerifyOptions): Promise<boolean> {
    return verifyWebhook(rawBody, signatureHeader, secret, opts);
  }

  /** Verifies and parses a webhook delivery; throws on a bad signature. */
  static parseWebhook = parseWebhook;

  /**
   * Self-serve a free API key: the wallet signs a short message, the API returns a key once.
   * Works with a Keypair / secret key or a wallet that has signMessage (Phantom, wallet adapter).
   */
  async createApiKey(input: { wallet: MessageSignerInput; label: string }, opts?: RequestOptions): Promise<T.KeyCreated> {
    const ts = Math.floor(Date.now() / 1000);
    let wallet: string;
    let sign: (m: Uint8Array) => Promise<Uint8Array>;
    const w = input.wallet;
    if (w instanceof Uint8Array || "secretKey" in w) {
      const secret = w instanceof Uint8Array ? w : w.secretKey;
      wallet = base58Encode(publicKeyOf(secret));
      sign = async (m) => ed25519Sign(await importEd25519(secret), m);
    } else {
      wallet = typeof w.publicKey === "string" ? w.publicKey : w.publicKey.toBase58();
      sign = async (m) => {
        const r = await w.signMessage(m);
        return r instanceof Uint8Array ? r : r.signature;
      };
    }
    const signature = base58Encode(await sign(utf8(apiKeyMessage(wallet, input.label, ts))));
    return this.createFreeKey({ wallet, label: input.label, ts, signature }, opts);
  }
}

const missing = (what: string): never => {
  throw new JustiError("invalid_params", `Pass ${what}.`);
};

const rawAmount = (q: QuoteInput): string => {
  if (q.amount !== undefined) return str(q.amount);
  if (q.side === "buy" && q.sol !== undefined) return toRaw(q.sol, SOL_DECIMALS).toString();
  if (q.side === "sell" && q.tokens !== undefined) return toRaw(q.tokens, TOKEN_DECIMALS).toString();
  return missing(q.side === "buy" ? "sol or amount" : "tokens or amount");
};
