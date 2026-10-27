// Generated from the justi.fun OpenAPI spec (justi.fun API 1.0.0). Do not edit.
// Regenerate with `npm run gen`.

import type * as T from "./types.js";

export interface RequestOptions {
  /** Abort the request. */
  signal?: AbortSignal;
  /** Extra headers for this call. */
  headers?: Record<string, string>;
}

export type Requester = <R>(method: string, path: string, query: Record<string, unknown> | undefined, body: unknown, opts: RequestOptions | undefined) => Promise<R>;

/** Every public operation, one method each, named by operationId. */
export class JustiApi {
  protected readonly _req: Requester;
  constructor(req: Requester) {
    this._req = req;
  }

  /**
   * What a terminal needs to tag justi.fun coins.
   *
   * DBC program, the 20 config addresses with their fee tiers, fee claimer, lookup table, metadata createdOn and URL patterns.
   *
   * `GET /v1/protocol`, rate class `read`, API key optional.
   */
  getProtocol(opts?: RequestOptions): Promise<T.Protocol> {
    return this._req<T.Protocol>("GET", `/v1/protocol`, undefined, undefined, opts);
  }

  /**
   * Pad config, fee tiers, fee splits and the sniper window schedule.
   *
   * `GET /v1/pad`, rate class `read`, API key optional.
   */
  getPad(opts?: RequestOptions): Promise<T.Pad> {
    return this._req<T.Pad>("GET", `/v1/pad`, undefined, undefined, opts);
  }

  /**
   * Service status: switches and live ingest.
   *
   * `GET /v1/status`, rate class `read`, API key optional.
   */
  getStatus(opts?: RequestOptions): Promise<T.Status> {
    return this._req<T.Status>("GET", `/v1/status`, undefined, undefined, opts);
  }

  /**
   * This OpenAPI 3.1 document.
   *
   * `GET /v1/openapi.json`, rate class `read`, no auth.
   */
  getOpenApi(opts?: RequestOptions): Promise<T.GetOpenApiResponse> {
    return this._req<T.GetOpenApiResponse>("GET", `/v1/openapi.json`, undefined, undefined, opts);
  }

  /**
   * Coins, with filters, sort, search and pagination.
   *
   * `GET /v1/tokens`, rate class `read`, API key optional.
   */
  listTokens(query?: T.ListTokensQuery, opts?: RequestOptions): Promise<T.TokenPage> {
    return this._req<T.TokenPage>("GET", `/v1/tokens`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Every coin in one list (for terminals).
   *
   * Mint, pools, config, creator, createdAt and status for every coin, newest first. Cached 30s.
   *
   * `GET /v1/tokenlist`, rate class `read`, API key optional.
   */
  getTokenList(opts?: RequestOptions): Promise<T.TokenList> {
    return this._req<T.TokenList>("GET", `/v1/tokenlist`, undefined, undefined, opts);
  }

  /**
   * Coin detail: metadata, safety facts, curve, graduation, sniper window, totals.
   *
   * `GET /v1/tokens/{mint}`, rate class `read`, API key optional.
   */
  getToken(mint: string, opts?: RequestOptions): Promise<T.TokenDetail> {
    return this._req<T.TokenDetail>("GET", `/v1/tokens/${encodeURIComponent(mint)}`, undefined, undefined, opts);
  }

  /**
   * Metaplex metadata JSON for a coin.
   *
   * `GET /v1/tokens/{mint}/metadata`, rate class `read`, API key optional.
   */
  getTokenMetadata(mint: string, opts?: RequestOptions): Promise<T.TokenMetadata> {
    return this._req<T.TokenMetadata>("GET", `/v1/tokens/${encodeURIComponent(mint)}/metadata`, undefined, undefined, opts);
  }

  /**
   * Trades, newest first, cursor paginated (curve and DAMM v2).
   *
   * `GET /v1/tokens/{mint}/trades`, rate class `read`, API key optional.
   */
  listTrades(mint: string, query?: T.ListTradesQuery, opts?: RequestOptions): Promise<T.TradePage> {
    return this._req<T.TradePage>("GET", `/v1/tokens/${encodeURIComponent(mint)}/trades`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * OHLCV candles from indexed trades.
   *
   * Each candle opens at the previous close. Prices are SOL per whole token, volume in SOL. Page back with before=nextBefore.
   *
   * `GET /v1/tokens/{mint}/candles`, rate class `read`, API key optional.
   */
  getCandles(mint: string, query?: T.GetCandlesQuery, opts?: RequestOptions): Promise<T.Candles> {
    return this._req<T.Candles>("GET", `/v1/tokens/${encodeURIComponent(mint)}/candles`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Holders from the latest snapshot (every 10 minutes).
   *
   * `GET /v1/tokens/{mint}/holders`, rate class `read`, API key optional.
   */
  listHolders(mint: string, query?: T.ListHoldersQuery, opts?: RequestOptions): Promise<T.HolderPage> {
    return this._req<T.HolderPage>("GET", `/v1/tokens/${encodeURIComponent(mint)}/holders`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Buybacks and burns of one coin, with signatures.
   *
   * `GET /v1/tokens/{mint}/burns`, rate class `read`, API key optional.
   */
  listTokenBurns(mint: string, query?: T.ListTokenBurnsQuery, opts?: RequestOptions): Promise<T.BuybackPage> {
    return this._req<T.BuybackPage>("GET", `/v1/tokens/${encodeURIComponent(mint)}/burns`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * All buybacks and burns ($JUSTI and sniper-window coin burns).
   *
   * `GET /v1/buybacks`, rate class `read`, API key optional.
   */
  listBuybacks(query?: T.ListBuybacksQuery, opts?: RequestOptions): Promise<T.BuybackPage> {
    return this._req<T.BuybackPage>("GET", `/v1/buybacks`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Holder reward rounds of one coin.
   *
   * `GET /v1/tokens/{mint}/rewards`, rate class `read`, API key optional.
   */
  getTokenRewards(mint: string, query?: T.GetTokenRewardsQuery, opts?: RequestOptions): Promise<T.TokenRewards> {
    return this._req<T.TokenRewards>("GET", `/v1/tokens/${encodeURIComponent(mint)}/rewards`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * What a wallet earned from holding, and its payouts with signatures.
   *
   * `GET /v1/wallets/{address}/rewards`, rate class `read`, API key optional.
   */
  getWalletRewards(address: string, query?: T.GetWalletRewardsQuery, opts?: RequestOptions): Promise<T.WalletRewards> {
    return this._req<T.WalletRewards>("GET", `/v1/wallets/${encodeURIComponent(address)}/rewards`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Confirmed holder payouts, newest first.
   *
   * `GET /v1/payouts`, rate class `read`, API key optional.
   */
  listPayouts(query?: T.ListPayoutsQuery, opts?: RequestOptions): Promise<T.PayoutPage> {
    return this._req<T.PayoutPage>("GET", `/v1/payouts`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Creator stats: coins, fees earned and claimable (read live from the pools).
   *
   * `GET /v1/creators/{wallet}`, rate class `read`, API key optional.
   */
  getCreator(wallet: string, opts?: RequestOptions): Promise<T.CreatorStats> {
    return this._req<T.CreatorStats>("GET", `/v1/creators/${encodeURIComponent(wallet)}`, undefined, undefined, opts);
  }

  /**
   * Platform totals.
   *
   * `GET /v1/platform/stats`, rate class `read`, API key optional.
   */
  getPlatformStats(opts?: RequestOptions): Promise<T.PlatformStats> {
    return this._req<T.PlatformStats>("GET", `/v1/platform/stats`, undefined, undefined, opts);
  }

  /**
   * Vanity (...JUST) mint pool status.
   *
   * `GET /v1/mint-pool`, rate class `read`, API key optional.
   */
  getMintPool(opts?: RequestOptions): Promise<T.MintPool> {
    return this._req<T.MintPool>("GET", `/v1/mint-pool`, undefined, undefined, opts);
  }

  /**
   * Metadata JSON by launch id (the uri stored on chain).
   *
   * `GET /v1/meta/{id}`, rate class `asset`, no auth.
   */
  getLaunchMetadata(id: string, opts?: RequestOptions): Promise<T.TokenMetadata> {
    return this._req<T.TokenMetadata>("GET", `/v1/meta/${encodeURIComponent(id)}`, undefined, undefined, opts);
  }

  /**
   * Quote a buy or sell (exact in) on the curve or the DAMM v2 pool.
   *
   * `GET /v1/quote`, rate class `quote`, API key optional.
   */
  getQuote(query: T.GetQuoteQuery, opts?: RequestOptions): Promise<T.Quote> {
    return this._req<T.Quote>("GET", `/v1/quote`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Build an unsigned v0 swap transaction for a wallet.
   *
   * Quotes fresh, builds, simulates and sets the compute limit. Sign the returned transaction with the wallet and send it to POST /v1/submit (or send it yourself). The wallet may add instructions, but the swap instruction must stay as built.
   *
   * `POST /v1/swap`, rate class `build`, API key optional.
   */
  buildSwap(body: T.SwapRequest, opts?: RequestOptions): Promise<T.SwapBuilt> {
    return this._req<T.SwapBuilt>("POST", `/v1/swap`, undefined, body, opts);
  }

  /**
   * Relay a signed swap built by POST /v1/swap.
   *
   * Checks it is paid and signed by the building wallet and carries the exact swap instruction built, then sends it (RPC rebroadcast every 2s, plus Jito when built with a tip) until confirmed, failed or expired. Answers when it settles or after waitMs (default 20000, max 25000) with status submitted; poll GET /v1/tx/{signature}. A trade that fails on chain is a 200 with status failed and an error.
   *
   * `POST /v1/submit`, rate class `submit`, API key optional.
   */
  submitSwap(body: T.SubmitRequest, opts?: RequestOptions): Promise<T.SwapStatus> {
    return this._req<T.SwapStatus>("POST", `/v1/submit`, undefined, body, opts);
  }

  /**
   * Status of a swap built through the API.
   *
   * `GET /v1/swaps/{id}`, rate class `read`, API key optional.
   */
  getSwap(id: string, opts?: RequestOptions): Promise<T.SwapStatus> {
    return this._req<T.SwapStatus>("GET", `/v1/swaps/${encodeURIComponent(id)}`, undefined, undefined, opts);
  }

  /**
   * Status of any transaction signature (and the swap or launch it belongs to).
   *
   * `GET /v1/tx/{signature}`, rate class `read`, API key optional.
   */
  getTransactionStatus(signature: string, opts?: RequestOptions): Promise<T.TxStatus> {
    return this._req<T.TxStatus>("GET", `/v1/tx/${encodeURIComponent(signature)}`, undefined, undefined, opts);
  }

  /**
   * Build a launch exactly like the site does.
   *
   * Same validation as the site: copy rule, 15% dev-buy cap, tier configs, sniper window, 10 launches per wallet a day. Returns an unsigned (by the wallet) v0 create transaction. signers lists every required signature: the payer (wallet) always; the mint is already signed for pool keys, or must be signed by your client with your custom mint keypair. Then POST /v1/launches/{id}/submit with the fully signed transaction within about a minute.
   *
   * `POST /v1/launches`, rate class `launch`, API key optional.
   */
  buildLaunch(body: T.LaunchRequest, opts?: RequestOptions): Promise<T.LaunchBuilt> {
    return this._req<T.LaunchBuilt>("POST", `/v1/launches`, undefined, body, opts);
  }

  /**
   * Send a signed launch (Jito, private).
   *
   * The transaction must be exactly the built message with every required signature. Answers live, or submitted after waitMs (default 20000); poll GET /v1/launches/{id}.
   *
   * `POST /v1/launches/{id}/submit`, rate class `submit`, API key optional.
   */
  submitLaunch(id: string, body: T.SubmitLaunchBody, opts?: RequestOptions): Promise<T.LaunchSubmitted> {
    return this._req<T.LaunchSubmitted>("POST", `/v1/launches/${encodeURIComponent(id)}/submit`, undefined, body, opts);
  }

  /**
   * Launch status.
   *
   * `GET /v1/launches/{id}`, rate class `read`, API key optional.
   */
  getLaunch(id: string, opts?: RequestOptions): Promise<T.Launch> {
    return this._req<T.Launch>("GET", `/v1/launches/${encodeURIComponent(id)}`, undefined, undefined, opts);
  }

  /**
   * Register a webhook (the secret is shown once).
   *
   * Deliveries are POSTs of {id,type,createdAt,data} with headers Justi-Event, Justi-Delivery and Justi-Signature: t=<unix>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>. Any 2xx is success. Retries: 8 attempts, 30s x 3^(n-1) (cap 6h, +-20% jitter). 25 failures in a row disable the webhook. trade events can be limited to mints.
   *
   * `POST /v1/webhooks`, rate class `manage`, API key required.
   */
  createWebhook(body: T.WebhookCreate, opts?: RequestOptions): Promise<T.WebhookCreated> {
    return this._req<T.WebhookCreated>("POST", `/v1/webhooks`, undefined, body, opts);
  }

  /**
   * Webhooks of this API key.
   *
   * `GET /v1/webhooks`, rate class `manage`, API key required.
   */
  listWebhooks(opts?: RequestOptions): Promise<T.ListWebhooksResponse> {
    return this._req<T.ListWebhooksResponse>("GET", `/v1/webhooks`, undefined, undefined, opts);
  }

  /**
   * One webhook.
   *
   * `GET /v1/webhooks/{id}`, rate class `manage`, API key required.
   */
  getWebhook(id: string, opts?: RequestOptions): Promise<T.Webhook> {
    return this._req<T.Webhook>("GET", `/v1/webhooks/${encodeURIComponent(id)}`, undefined, undefined, opts);
  }

  /**
   * Change a webhook; enabled=true re-enables one that was disabled.
   *
   * `PATCH /v1/webhooks/{id}`, rate class `manage`, API key required.
   */
  updateWebhook(id: string, body: T.UpdateWebhookBody, opts?: RequestOptions): Promise<T.Webhook> {
    return this._req<T.Webhook>("PATCH", `/v1/webhooks/${encodeURIComponent(id)}`, undefined, body, opts);
  }

  /**
   * Delete a webhook and its delivery log.
   *
   * `DELETE /v1/webhooks/{id}`, rate class `manage`, API key required.
   */
  deleteWebhook(id: string, opts?: RequestOptions): Promise<T.DeleteWebhookResponse> {
    return this._req<T.DeleteWebhookResponse>("DELETE", `/v1/webhooks/${encodeURIComponent(id)}`, undefined, undefined, opts);
  }

  /**
   * Delivery log, newest first.
   *
   * `GET /v1/webhooks/{id}/deliveries`, rate class `manage`, API key required.
   */
  listWebhookDeliveries(id: string, query?: T.ListWebhookDeliveriesQuery, opts?: RequestOptions): Promise<T.ListWebhookDeliveriesResponse> {
    return this._req<T.ListWebhookDeliveriesResponse>("GET", `/v1/webhooks/${encodeURIComponent(id)}/deliveries`, query as unknown as Record<string, unknown> | undefined, undefined, opts);
  }

  /**
   * Send one signed webhook.test delivery now.
   *
   * `POST /v1/webhooks/{id}/test`, rate class `manage`, API key required.
   */
  testWebhook(id: string, opts?: RequestOptions): Promise<T.TestWebhookResponse> {
    return this._req<T.TestWebhookResponse>("POST", `/v1/webhooks/${encodeURIComponent(id)}/test`, undefined, undefined, opts);
  }

  /**
   * Self-serve: a wallet signs a message and gets a free-tier key.
   *
   * Sign the UTF-8 message "justi.fun api key\nwallet: <wallet>\nlabel: <label>\ntime: <ts>" with the wallet (ed25519, e.g. signMessage), send the base58 signature. ts within 5 minutes. One active free key per wallet. The key is shown once.
   *
   * `POST /v1/keys`, rate class `keys`, no auth.
   */
  createFreeKey(body: T.CreateFreeKeyBody, opts?: RequestOptions): Promise<T.KeyCreated> {
    return this._req<T.KeyCreated>("POST", `/v1/keys`, undefined, body, opts);
  }

  /**
   * The calling key, its tier and limits.
   *
   * `GET /v1/keys/me`, rate class `read`, API key required.
   */
  getMyKey(opts?: RequestOptions): Promise<T.GetMyKeyResponse> {
    return this._req<T.GetMyKeyResponse>("GET", `/v1/keys/me`, undefined, undefined, opts);
  }

  /**
   * Revoke the calling key (its webhooks stop).
   *
   * `DELETE /v1/keys/me`, rate class `manage`, API key required.
   */
  revokeMyKey(opts?: RequestOptions): Promise<T.RevokeMyKeyResponse> {
    return this._req<T.RevokeMyKeyResponse>("DELETE", `/v1/keys/me`, undefined, undefined, opts);
  }
}

/** Operation index: method, path, auth and rate class per operationId. */
export const operations = {
  "getProtocol": {
    "method": "GET",
    "path": "/v1/protocol",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Protocol",
    "summary": "What a terminal needs to tag justi.fun coins"
  },
  "getPad": {
    "method": "GET",
    "path": "/v1/pad",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Protocol",
    "summary": "Pad config, fee tiers, fee splits and the sniper window schedule"
  },
  "getStatus": {
    "method": "GET",
    "path": "/v1/status",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Protocol",
    "summary": "Service status: switches and live ingest"
  },
  "getOpenApi": {
    "method": "GET",
    "path": "/v1/openapi.json",
    "auth": "none",
    "rateClass": "read",
    "tag": "Protocol",
    "summary": "This OpenAPI 3.1 document"
  },
  "listTokens": {
    "method": "GET",
    "path": "/v1/tokens",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Coins, with filters, sort, search and pagination"
  },
  "getTokenList": {
    "method": "GET",
    "path": "/v1/tokenlist",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Every coin in one list (for terminals)"
  },
  "getToken": {
    "method": "GET",
    "path": "/v1/tokens/{mint}",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Coin detail: metadata, safety facts, curve, graduation, sniper window, totals"
  },
  "getTokenMetadata": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/metadata",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Metaplex metadata JSON for a coin"
  },
  "listTrades": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/trades",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Trades, newest first, cursor paginated (curve and DAMM v2)"
  },
  "getCandles": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/candles",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "OHLCV candles from indexed trades"
  },
  "listHolders": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/holders",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Holders from the latest snapshot (every 10 minutes)"
  },
  "listTokenBurns": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/burns",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Tokens",
    "summary": "Buybacks and burns of one coin, with signatures"
  },
  "listBuybacks": {
    "method": "GET",
    "path": "/v1/buybacks",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Platform",
    "summary": "All buybacks and burns ($JUSTI and sniper-window coin burns)"
  },
  "getTokenRewards": {
    "method": "GET",
    "path": "/v1/tokens/{mint}/rewards",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Rewards",
    "summary": "Holder reward rounds of one coin"
  },
  "getWalletRewards": {
    "method": "GET",
    "path": "/v1/wallets/{address}/rewards",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Rewards",
    "summary": "What a wallet earned from holding, and its payouts with signatures"
  },
  "listPayouts": {
    "method": "GET",
    "path": "/v1/payouts",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Rewards",
    "summary": "Confirmed holder payouts, newest first"
  },
  "getCreator": {
    "method": "GET",
    "path": "/v1/creators/{wallet}",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Rewards",
    "summary": "Creator stats: coins, fees earned and claimable (read live from the pools)"
  },
  "getPlatformStats": {
    "method": "GET",
    "path": "/v1/platform/stats",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Platform",
    "summary": "Platform totals"
  },
  "getMintPool": {
    "method": "GET",
    "path": "/v1/mint-pool",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Platform",
    "summary": "Vanity (...JUST) mint pool status"
  },
  "getLaunchMetadata": {
    "method": "GET",
    "path": "/v1/meta/{id}",
    "auth": "none",
    "rateClass": "asset",
    "tag": "Assets",
    "summary": "Metadata JSON by launch id (the uri stored on chain)"
  },
  "getQuote": {
    "method": "GET",
    "path": "/v1/quote",
    "auth": "optional",
    "rateClass": "quote",
    "tag": "Trading",
    "summary": "Quote a buy or sell (exact in) on the curve or the DAMM v2 pool"
  },
  "buildSwap": {
    "method": "POST",
    "path": "/v1/swap",
    "auth": "optional",
    "rateClass": "build",
    "tag": "Trading",
    "summary": "Build an unsigned v0 swap transaction for a wallet"
  },
  "submitSwap": {
    "method": "POST",
    "path": "/v1/submit",
    "auth": "optional",
    "rateClass": "submit",
    "tag": "Trading",
    "summary": "Relay a signed swap built by POST /v1/swap"
  },
  "getSwap": {
    "method": "GET",
    "path": "/v1/swaps/{id}",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Trading",
    "summary": "Status of a swap built through the API"
  },
  "getTransactionStatus": {
    "method": "GET",
    "path": "/v1/tx/{signature}",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Trading",
    "summary": "Status of any transaction signature (and the swap or launch it belongs to)"
  },
  "buildLaunch": {
    "method": "POST",
    "path": "/v1/launches",
    "auth": "optional",
    "rateClass": "launch",
    "tag": "Launches",
    "summary": "Build a launch exactly like the site does"
  },
  "submitLaunch": {
    "method": "POST",
    "path": "/v1/launches/{id}/submit",
    "auth": "optional",
    "rateClass": "submit",
    "tag": "Launches",
    "summary": "Send a signed launch (Jito, private)"
  },
  "getLaunch": {
    "method": "GET",
    "path": "/v1/launches/{id}",
    "auth": "optional",
    "rateClass": "read",
    "tag": "Launches",
    "summary": "Launch status"
  },
  "createWebhook": {
    "method": "POST",
    "path": "/v1/webhooks",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Register a webhook (the secret is shown once)"
  },
  "listWebhooks": {
    "method": "GET",
    "path": "/v1/webhooks",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Webhooks of this API key"
  },
  "getWebhook": {
    "method": "GET",
    "path": "/v1/webhooks/{id}",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "One webhook"
  },
  "updateWebhook": {
    "method": "PATCH",
    "path": "/v1/webhooks/{id}",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Change a webhook; enabled=true re-enables one that was disabled"
  },
  "deleteWebhook": {
    "method": "DELETE",
    "path": "/v1/webhooks/{id}",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Delete a webhook and its delivery log"
  },
  "listWebhookDeliveries": {
    "method": "GET",
    "path": "/v1/webhooks/{id}/deliveries",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Delivery log, newest first"
  },
  "testWebhook": {
    "method": "POST",
    "path": "/v1/webhooks/{id}/test",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Webhooks",
    "summary": "Send one signed webhook.test delivery now"
  },
  "createFreeKey": {
    "method": "POST",
    "path": "/v1/keys",
    "auth": "none",
    "rateClass": "keys",
    "tag": "Keys",
    "summary": "Self-serve: a wallet signs a message and gets a free-tier key"
  },
  "getMyKey": {
    "method": "GET",
    "path": "/v1/keys/me",
    "auth": "required",
    "rateClass": "read",
    "tag": "Keys",
    "summary": "The calling key, its tier and limits"
  },
  "revokeMyKey": {
    "method": "DELETE",
    "path": "/v1/keys/me",
    "auth": "required",
    "rateClass": "manage",
    "tag": "Keys",
    "summary": "Revoke the calling key (its webhooks stop)"
  }
} as const;

export type OperationId = keyof typeof operations;
