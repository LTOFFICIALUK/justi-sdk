// Generated from the justi.fun OpenAPI spec (justi.fun API 1.0.0). Do not edit.
// Regenerate with `npm run gen`.

/** Base58 Solana address. */
export type Address = string;

export interface ApiKey {
  /** UUID. */
  id: string;
  prefix: string;
  label: string;
  ownerWallet: Address | null;
  tier: "free" | "partner" | "internal";
  limits: Record<string, {
    capacity: number;
    perMin: number;
  }> | null;
  /** Unix time in seconds. */
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
}

export interface Buyback {
  id: string;
  /** Base58 Solana address. */
  mint: Address;
  ticker: string | null;
  /** justi: $JUSTI buyback. coin: sniper-window burn of this coin. */
  kind: "justi" | "coin";
  status: "planned" | "swapped" | "burned" | "held";
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  lamports: U64String;
  tokensBought: U64String | null;
  route: string | null;
  swapSignature: string | null;
  burnSignature: string | null;
  /** Unix time in seconds. */
  createdAt: number;
  burnedAt: number | null;
}

export interface BuybackPage {
  totals: {
    burns: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    lamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    tokensBurned: U64String;
  };
  buybacks: Buyback[];
  nextCursor: string | null;
}

export interface Candles {
  /** Base58 Solana address. */
  mint: Address;
  timeframe: string;
  seconds: number;
  /** Unix time in seconds. */
  activationTs: number;
  /** Unix time in seconds. */
  windowEndsTs: number;
  candles: {
    /** Unix time in seconds. */
    t: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volumeSol: number;
    trades: number;
  }[];
  hasMore: boolean;
  nextBefore: number | null;
}

export interface CreatorStats {
  /** Base58 Solana address. */
  wallet: Address;
  totals: {
    coins: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    earnedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    claimableLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    holderRewardsLamports: U64String;
  };
  coins: Array<{
    /** Base58 Solana address. */
    mint: Address;
    name: string;
    ticker: string;
    image: string | null;
    /** Who earns the fee: the creator, holders, or both. */
    mode: "creator" | "holders" | "split";
    creatorPct: number;
    holdersPct: number;
    /** Unix time in seconds. */
    createdAt: number;
    graduated: boolean;
    curveProgressPct: number;
    marketCapSol: number;
    holderCount: number;
    trades: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    earnedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    claimableLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    claimedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    holderRewardsLamports: U64String;
  }>;
}

export interface Error {
  error: {
    /** Stable machine-readable code. */
    code: "bad_request" | "invalid_params" | "invalid_json" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "payload_too_large" | "rate_limited" | "internal" | "upstream_error" | "unavailable" | "slippage" | "graduating" | "insufficient_funds" | "expired" | "chain_rejected" | "copy_exists" | "mint_taken" | "launch_limit" | "tx_mismatch" | "signature_invalid" | "already_submitted" | "image_fetch_failed";
    /** Plain-language message, safe to show to a user. */
    message: string;
    /** Extra fields for some codes, e.g. suggestSlippageBps or the existing mint. */
    details?: Record<string, unknown>;
  };
}

export interface FeeSplit {
  /** Tier key, e.g. creator-100, holders, split-50. */
  tier: string;
  /** Who earns the fee: the creator, holders, or both. */
  mode: "creator" | "holders" | "split";
  /** Total pool fee after the opening window, percent of the SOL side. */
  totalPct: number;
  creatorPct: number;
  holdersPct: number;
  /** Pad share. 75% of it buys and burns $JUSTI, 25% goes to the dev wallet. */
  platformPct: number;
  /** Meteora protocol share (20% of the pool fee). */
  meteoraPct: number;
  /** creatorTradingFeePercentage on the DBC config. */
  creatorOnchainPercent: number;
  /** Pool fee numerator over 1e9 after the window. */
  poolFeeNumerator: U64String;
}

export interface HolderPage {
  /** Base58 Solana address. */
  mint: Address;
  snapshotAt: number | null;
  holderCount: number;
  holders: {
    rank: number;
    /** Base58 Solana address. */
    owner: Address;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    amount: U64String;
    pctOfSupply: number;
    /** false for pools and other program accounts */
    isWallet: boolean;
    isCreator: boolean;
  }[];
  nextCursor: string | null;
}

export interface KeyCreated {
  /** jf_live_... Store it now; only its hash is kept. */
  key: string;
  record: ApiKey;
  message: string;
}

export interface Launch {
  /** UUID. */
  launchId: string;
  status: "built" | "submitted" | "live" | "failed" | "expired";
  /** Base58 Solana address. */
  mint: Address;
  /** Base58 Solana address. */
  curvePool: Address;
  /** Base58 Solana address. */
  config: Address;
  tier: string;
  /** Base58 Solana address. */
  creator: Address;
  name: string;
  ticker: string;
  customMint: boolean;
  signature: string | null;
  error: string | null;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  devBuyLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  devBuyTokens: U64String;
  lastValidBlockHeight: number;
  metadataUri: string;
  image: string;
  viaApi: boolean;
  /** Label of the API key that built it. */
  partner: string | null;
  /** Unix time in seconds. */
  createdAt: number;
  /** Unix time in seconds. */
  updatedAt: number;
}

export interface LaunchBuilt {
  /** UUID. */
  launchId: string;
  /** Base58 Solana address. */
  mint: Address;
  customMint: boolean;
  /** A ...JUST key from the pool. */
  vanity: boolean;
  signers: Array<{
    /** Base58 Solana address. */
    pubkey: Address;
    role: "payer" | "mint" | "other";
    signed: boolean;
  }>;
  /** Base58 Solana address. */
  curvePool: Address;
  /** Base58 Solana address. */
  config: Address;
  tier: string;
  fees: {
    tier: string;
    /** Who earns the fee: the creator, holders, or both. */
    mode: "creator" | "holders" | "split";
    totalPct: number;
    platformPct: number;
    creatorPct: number;
    holdersPct: number;
    protocolPct: number;
    creatorOnchainPercent: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    poolFeeNumerator: U64String;
  };
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  devBuyLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  devBuyTokens: U64String;
  devBuyPctOfSupply: number;
  bytes: number;
  computeUnits: number | null;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  tipLamports: U64String;
  lastValidBlockHeight: number;
  metadataUri: string;
  image: string;
  transaction: string;
}

export interface LaunchRequest {
  /** Creator wallet: pays, signs, is the pool creator. */
  wallet: Address;
  name: string;
  /** 2 to 10 letters or numbers; a leading $ is dropped. */
  ticker: string;
  description?: string;
  /** https URL (fetched by the server: public hosts only, 5 MB max, 8 s) or a data:image/...;base64 URL up to 500 KB. */
  image: string;
  /** Optional 3:1 banner, https URL or data URL (1 MB). Site only, not on chain. */
  banner?: string | null;
  xUrl?: string | null;
  telegramUrl?: string | null;
  website?: string | null;
  /** Who earns the fee: the creator, holders, or both. */
  mode: "creator" | "holders" | "split";
  /** Creator fee in bps (creator: 0-250 step 25; split: 25-200 step 25; holders: 0). */
  creatorBps?: number;
  /** Dev buy in the create transaction. Capped at 15% of supply. */
  devBuyLamports?: U64String;
  /** Custom (vanity) mint public key. The integrator's client holds the keypair and signs the returned transaction with it. Never send the secret key. Without it the server uses a ...JUST key from its pool (already signed in). */
  mint?: Address;
}

export interface LaunchSubmitted {
  status: "live" | "submitted";
  /** Base58 Solana address. */
  mint: Address;
  signature: string;
}

export interface MintPool {
  suffix: string;
  available: number;
  ready: boolean;
  fallback: string;
}

export interface Pad {
  launchesEnabled: boolean;
  tiers: Array<{
    /** Tier key, e.g. creator-100, holders, split-50. */
    tier: string;
    /** Who earns the fee: the creator, holders, or both. */
    mode: "creator" | "holders" | "split";
    /** Total pool fee after the opening window, percent of the SOL side. */
    totalPct: number;
    creatorPct: number;
    holdersPct: number;
    /** Pad share. 75% of it buys and burns $JUSTI, 25% goes to the dev wallet. */
    platformPct: number;
    /** Meteora protocol share (20% of the pool fee). */
    meteoraPct: number;
    /** creatorTradingFeePercentage on the DBC config. */
    creatorOnchainPercent: number;
    /** Pool fee numerator over 1e9 after the window. */
    poolFeeNumerator: U64String;
    creatorBps: number;
    holderBps: number;
    config: Address | null;
    live: boolean;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    maxDevBuyLamports: U64String;
    sniperWindow: SniperWindow;
  }>;
  platformSplit: {
    burnJustiPct: number;
    devWalletPct: number;
  };
  meteoraSharePct: number;
  sniperWindow: {
    seconds: number;
    startPct: number;
    extraSplit: {
      burnCoinPct: number;
      burnJustiPct: number;
      platformPct: number;
    };
  };
  devBuyMaxPctOfSupply: number;
  copyWindowHours: number;
  holderRoundSec: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  minPayoutLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  totalSupply: U64String;
  decimals: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  graduationQuoteLamports: U64String;
  graduation: {
    venue: string;
    lpLockedPct: number;
    lpSplit: {
      platformPct: number;
      creatorPct: number;
    };
  };
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  jitoTipLamports: U64String;
  justiMint: Address | null;
  /** Unix time in seconds. */
  now: number;
}

export interface PayoutPage {
  payouts: {
    id: string;
    /** Base58 Solana address. */
    wallet: Address;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    lamports: U64String;
    signature: string;
    /** Unix time in seconds. */
    confirmedAt: number;
  }[];
  nextCursor: string | null;
}

export interface PlatformStats {
  coins: number;
  graduated: number;
  coinsLast24h: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  trades: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  volumeLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  volume24hLamports: U64String;
  traders24h: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  padClaimedLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  holderPaidLamports: U64String;
  holderPaidWallets: number;
  justiBurn: {
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    lamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    tokens: U64String;
  };
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  coinBurnLamports: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  creatorClaimedLamports: U64String;
  /** Unix time in seconds. */
  now: number;
}

export interface Protocol {
  name: string;
  site: string;
  api: string;
  /** Base58 Solana address. */
  dbcProgram: Address;
  /** Base58 Solana address. */
  dammV2Program: Address;
  /** Base58 Solana address. */
  quoteMint: Address;
  configs: Array<{
    /** Tier key, e.g. creator-100, holders, split-50. */
    tier: string;
    /** Who earns the fee: the creator, holders, or both. */
    mode: "creator" | "holders" | "split";
    /** Total pool fee after the opening window, percent of the SOL side. */
    totalPct: number;
    creatorPct: number;
    holdersPct: number;
    /** Pad share. 75% of it buys and burns $JUSTI, 25% goes to the dev wallet. */
    platformPct: number;
    /** Meteora protocol share (20% of the pool fee). */
    meteoraPct: number;
    /** creatorTradingFeePercentage on the DBC config. */
    creatorOnchainPercent: number;
    /** Pool fee numerator over 1e9 after the window. */
    poolFeeNumerator: U64String;
    address: Address | null;
    creatorBps: number;
    holderBps: number;
  }>;
  feeClaimer: Address | null;
  partnerMetadata: Address | null;
  lookupTable: Address | null;
  justiMint: Address | null;
  metadata: {
    createdOn: string;
    uriPattern: string;
    imagePattern: string;
  };
  vanitySuffix: string;
  coinUrlPattern: string;
  /** Base58 Solana address. */
  dammMigrationConfig: Address;
  howToTag: string;
}

export interface Quote {
  /** Base58 Solana address. */
  mint: Address;
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side: "buy" | "sell";
  /** curve: DBC swap. damm: direct DAMM v2 swap. jupiter: fallback only. */
  route: "curve" | "damm" | "jupiter";
  /** true when Jupiter stands in for a failed direct route. */
  fallback: boolean;
  /** Lamports for a buy, raw tokens for a sell. Fee included. */
  amountIn: U64String;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  expectedOut: U64String;
  /** expectedOut less slippage; the swap fails below it. */
  minOut: U64String;
  slippageBps: number;
  priceImpactPct: number;
  /** Spot before the trade, SOL per whole token. */
  priceSol: number;
  priceAfterSol: number;
  marketCapSol: number;
  curveProgressPct: number | null;
  fee: {
    /** The side the fee is taken in. DAMM v2 pools in both-token mode take the buy fee in the coin. */
    token: "SOL" | "TOKEN";
    /** Raw units of fee.token. */
    total: U64String;
    /** The fee as lamports (token fees valued at spot). */
    totalLamports: U64String;
    /** Fee as percent of the trade on the fee side. */
    pct: number;
    /** Seconds left in the opening sniper window. */
    windowSecondsLeft: number;
    /** Part of total above the normal tier fee (sniper window). */
    windowExtra: U64String;
    /** Where the fee goes. Sums to total. */
    parts: {
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      creator: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      holders: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      platformBurnJusti: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      platformWallet: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      sniperBurnCoin: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      sniperBurnJusti: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      sniperPlatform: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      meteora: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      liquidityProviders: U64String;
      /** Unsigned integer as a decimal string (may exceed 2^53). */
      referral: U64String;
    };
  };
  /** Unix time in seconds. */
  now: number;
}

export interface Safety {
  fixedSupply: boolean | null;
  mintAuthorityRevoked: boolean | null;
  freezeAuthorityRevoked: boolean | null;
  metadataImmutable: boolean | null;
  /** Share of graduation LP that is permanently locked (100 on every justi config). */
  lpLockedPct: number;
  /** Dev buy in the create transaction, percent of supply. */
  devBuyPct: number;
  /** Creator wallet's balance at the last holder snapshot, percent of supply. */
  devHoldsPct: number;
  /** Top 10 wallet holders, percent of supply, at the last snapshot. */
  top10Pct: number;
  holdersAt: number | null;
}

/** Base58 transaction signature. */
export type Signature = string;

export interface SniperWindow {
  /** Length of the opening window. */
  seconds: number;
  /** Fee at second 0. */
  startPct: number;
  /** Fee for each second of the window for this tier; after the last entry the tier fee applies. */
  schedule: {
    second: number;
    feePct: number;
  }[];
  /** How the pad's share of the fee above the normal rate is split. */
  extraSplit: {
    burnCoinPct: number;
    burnJustiPct: number;
    platformPct: number;
  };
}

export interface Status {
  ok: boolean;
  launchesEnabled: boolean;
  tradingEnabled: boolean;
  webhooksEnabled: boolean;
  ingest: {
    connected: boolean;
    pools: number;
  };
  streams: {
    websocketClients: number;
  };
  /** Unix time in seconds. */
  now: number;
}

export interface SubmitRequest {
  /** UUID. */
  swapId: string;
  /** Base64 signed transaction. */
  transaction: string;
  waitMs?: number;
}

export interface SwapBuilt {
  /** UUID. */
  swapId: string;
  route: "curve" | "damm" | "jupiter";
  fallback: boolean;
  quote: Quote;
  /** Base64 unsigned v0 transaction. */
  transaction: string;
  bytes: number;
  /** From the simulation. */
  computeUnitsConsumed: number | null;
  computeUnitLimit: number;
  priorityMicroLamports: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  jitoTipLamports: U64String;
  lastValidBlockHeight: number;
}

export interface SwapRequest {
  /** Base58 Solana address. */
  mint: Address;
  /** Fee payer and signer. */
  wallet: Address;
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side: "buy" | "sell";
  /** Lamports to spend on a buy, raw tokens to sell. */
  amount: U64String;
  /** Basis points, 10 to 5000. Default 1000 (10%). */
  slippageBps?: number;
  /** "auto" (Helius estimate or recent fees on the pool) or micro-lamports per compute unit. */
  priorityFee?: "auto" | number;
  /** "auto": simulated use x 1.2 + 5000. */
  computeUnitLimit?: "auto" | number;
  /** Adds a tip transfer to a Jito tip account; submit then also sends through Jito. 0 or 1000 to 100000000. */
  jitoTipLamports?: U64String;
}

export interface SwapStatus {
  /** UUID. */
  swapId: string;
  status: "built" | "submitted" | "confirmed" | "failed" | "expired";
  signature: string | null;
  /** Base58 Solana address. */
  mint: Address;
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side: "buy" | "sell";
  route: string;
  error: {
    code: string;
    message: string;
    suggestSlippageBps?: number;
  } | null;
}

export interface TokenDetail {
  /** Base58 Solana address. */
  mint: Address;
  name: string;
  ticker: string;
  description: string;
  /** Image URL (served by this API). */
  image: string | null;
  /** 3:1 banner URL, site only, not on chain. */
  banner: string | null;
  /** The on-chain metadata URI (Metaplex JSON). */
  metadataUri: string | null;
  /** Base58 Solana address. */
  creator: Address;
  /** Pool activation time. */
  createdAt: number;
  /** curve: trading on the bonding curve. graduating: curve full, migration pending. graduated: trading on DAMM v2. */
  status: "curve" | "graduating" | "graduated";
  /** Meteora DBC virtual pool. */
  curvePool: Address;
  /** DBC config (fee tier). */
  config: Address;
  /** Meteora DAMM v2 pool after graduation. */
  dammPool: Address | null;
  fees: FeeSplit;
  /** Share of the graduation threshold raised, 0 to 100. */
  curveProgressPct: number;
  /** SOL per whole token, from the pool's sqrt price. */
  priceSol: number;
  /** priceSol x 1,000,000,000 supply. */
  marketCapSol: number;
  holderCount: number;
  trades: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  volume24hLamports: U64String;
  lastTradeAt: number | null;
  /** Approved DEX Screener Enhanced Token Info order. */
  dexPaid: boolean;
  social: {
    x: string | null;
    telegram: string | null;
    website: string | null;
  };
  metadata: TokenMetadata | null;
  createSignature: string;
  safety: Safety;
  curve: {
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    quoteReserveLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    graduationQuoteLamports: U64String;
    progressPct: number;
  };
  graduation: {
    graduated: boolean;
    dammPool: Address | null;
    migratedAt: number | null;
    migrationSignature: string | null;
  };
  sniperWindow: {
    /** Length of the opening window. */
    seconds: number;
    /** Fee at second 0. */
    startPct: number;
    /** Fee for each second of the window for this tier; after the last entry the tier fee applies. */
    schedule: {
      second: number;
      feePct: number;
    }[];
    /** How the pad's share of the fee above the normal rate is split. */
    extraSplit: {
      burnCoinPct: number;
      burnJustiPct: number;
      platformPct: number;
    };
    /** Unix time in seconds. */
    endsAt: number;
    feeNowPct: number;
    buyers: number;
    boughtPctOfSupply: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    extraFeeLamports: U64String;
  };
  totals: {
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    volumeLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    holderRewardsLamports: U64String;
    holderRounds: number;
    holderWallets: number;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    burnedTokens: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    creatorClaimedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    creatorUnclaimedLamports: U64String;
  };
  dex: {
    paid: boolean;
    checkedAt: number | null;
    url: string;
  };
  url: string;
}

export interface TokenList {
  name: string;
  /** Unix time in seconds. */
  timestamp: number;
  count: number;
  tokens: Array<{
    chainId: number;
    /** Base58 Solana address. */
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string | null;
    metadataUri: string | null;
    /** Base58 Solana address. */
    curvePool: Address;
    dammPool: Address | null;
    /** Base58 Solana address. */
    config: Address;
    /** Base58 Solana address. */
    creator: Address;
    /** Unix time in seconds. */
    createdAt: number;
    /** curve: trading on the bonding curve. graduating: curve full, migration pending. graduated: trading on DAMM v2. */
    status: "curve" | "graduating" | "graduated";
  }>;
}

/** Metaplex-standard token metadata JSON we host (the on-chain uri). */
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdOn: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  banner?: string;
}

export interface TokenPage {
  tokens: TokenSummary[];
  total: number;
  nextCursor: string | null;
}

export interface TokenRewards {
  /** Base58 Solana address. */
  mint: Address;
  holdersPct: number;
  roundSec: number;
  nextRoundAt: number | null;
  totals: {
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    creditedLamports: U64String;
    rounds: number;
    wallets: number;
  };
  rounds: {
    id: string;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    poolLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    creditedLamports: U64String;
    wallets: number;
    /** Unix time in seconds. */
    at: number;
  }[];
}

export interface TokenSummary {
  /** Base58 Solana address. */
  mint: Address;
  name: string;
  ticker: string;
  description: string;
  /** Image URL (served by this API). */
  image: string | null;
  /** 3:1 banner URL, site only, not on chain. */
  banner: string | null;
  /** The on-chain metadata URI (Metaplex JSON). */
  metadataUri: string | null;
  /** Base58 Solana address. */
  creator: Address;
  /** Pool activation time. */
  createdAt: number;
  /** curve: trading on the bonding curve. graduating: curve full, migration pending. graduated: trading on DAMM v2. */
  status: "curve" | "graduating" | "graduated";
  /** Meteora DBC virtual pool. */
  curvePool: Address;
  /** DBC config (fee tier). */
  config: Address;
  /** Meteora DAMM v2 pool after graduation. */
  dammPool: Address | null;
  fees: FeeSplit;
  /** Share of the graduation threshold raised, 0 to 100. */
  curveProgressPct: number;
  /** SOL per whole token, from the pool's sqrt price. */
  priceSol: number;
  /** priceSol x 1,000,000,000 supply. */
  marketCapSol: number;
  holderCount: number;
  trades: number;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  volume24hLamports: U64String;
  lastTradeAt: number | null;
  /** Approved DEX Screener Enhanced Token Info order. */
  dexPaid: boolean;
  social: {
    x: string | null;
    telegram: string | null;
    website: string | null;
  };
}

export interface Trade {
  /** Base58 transaction signature. */
  signature: Signature;
  /** Instruction position in the transaction. With signature it is unique. */
  ix: string;
  /** curve: the Meteora DBC bonding curve. damm: the Meteora DAMM v2 pool after graduation. */
  venue: "curve" | "damm";
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side: "buy" | "sell";
  /** Base58 Solana address. */
  wallet: Address;
  /** Unsigned integer as a decimal string (may exceed 2^53). */
  solLamports: U64String;
  /** Raw token units (6 decimals). */
  tokenAmount: U64String;
  /** Pool price right after the trade, SOL per whole token. */
  priceSol: number | null;
  /** Unix time in seconds. */
  ts: number;
  slot: number;
  /** Inside the opening sniper window. */
  inWindow: boolean;
}

export interface TradePage {
  trades: Trade[];
  nextCursor: string | null;
}

export interface TxStatus {
  /** Base58 transaction signature. */
  signature: Signature;
  /** unknown: the RPC has not seen it (not sent, dropped, or too old). */
  status: "pending" | "confirmed" | "finalized" | "failed" | "unknown";
  slot: number | null;
  /** The on-chain error when failed. */
  error: unknown | null;
  kind: "swap" | "launch" | null;
  /** swapId or launchId when it was built here. */
  refId: string | null;
}

/** Unsigned integer as a decimal string (may exceed 2^53). */
export type U64String = string;

export interface WalletRewards {
  /** Base58 Solana address. */
  wallet: Address;
  totals: {
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    earnedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    paidLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    owedLamports: U64String;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    minPayoutLamports: U64String;
  };
  coins: {
    /** Base58 Solana address. */
    mint: Address;
    ticker: string;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    earnedLamports: U64String;
    rounds: number;
    /** Unix time in seconds. */
    lastRoundAt: number;
  }[];
  payouts: Array<{
    id: string;
    /** Unsigned integer as a decimal string (may exceed 2^53). */
    lamports: U64String;
    status: "planned" | "sent" | "confirmed";
    signature: string | null;
    /** Unix time in seconds. */
    createdAt: number;
    confirmedAt: number | null;
  }>;
}

export interface Webhook {
  /** UUID. */
  id: string;
  url: string;
  events: Array<"launch.created" | "trade" | "coin.graduated" | "burn" | "buyback" | "payout" | "creator.claim">;
  mints: Address[] | null;
  description: string | null;
  enabled: boolean;
  disabledReason: string | null;
  consecutiveFailures: number;
  /** Unix time in seconds. */
  createdAt: number;
  /** Unix time in seconds. */
  updatedAt: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
}

export interface WebhookCreate {
  /** https only, public hosts only. */
  url: string;
  events: Array<"launch.created" | "trade" | "coin.graduated" | "burn" | "buyback" | "payout" | "creator.claim">;
  /** Only for trade events. Null or absent: every coin. */
  mints?: Address[] | null;
  description?: string | null;
}

export interface WebhookCreated {
  webhook: Webhook;
  /** HMAC secret. Store it now; it is not shown again. */
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  eventId: string | null;
  eventType: string;
  status: "pending" | "delivered" | "failed" | "cancelled";
  attempts: number;
  nextAttemptAt: number | null;
  lastStatusCode: number | null;
  lastError: string | null;
  lastDurationMs: number | null;
  /** Unix time in seconds. */
  createdAt: number;
  deliveredAt: number | null;
  payload: Record<string, unknown>;
}

/** Response of getOpenApi. */
export type GetOpenApiResponse = Record<string, unknown>;

/** Query parameters of listTokens. */
export interface ListTokensQuery {
  status?: "all" | "curve" | "graduating" | "graduated";
  /** Only coins created by this wallet. */
  creator?: Address;
  /** Search ticker or name (contains), or an exact mint. */
  q?: string;
  sort?: "new" | "marketcap" | "volume24h" | "lastTrade" | "progress" | "trades";
  /** Page size, 1 to 100. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Query parameters of listTrades. */
export interface ListTradesQuery {
  /** Page size, 1 to 200. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
  /** Base58 Solana address. */
  wallet?: Address;
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side?: "buy" | "sell";
  /** curve: the Meteora DBC bonding curve. damm: the Meteora DAMM v2 pool after graduation. */
  venue?: "curve" | "damm";
}

/** Query parameters of getCandles. */
export interface GetCandlesQuery {
  tf?: "1s" | "15s" | "1m" | "5m" | "15m" | "1h";
  limit?: number;
  /** Unix time; candles strictly before it. */
  before?: number;
}

/** Query parameters of listHolders. */
export interface ListHoldersQuery {
  /** Page size, 1 to 500. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Query parameters of listTokenBurns. */
export interface ListTokenBurnsQuery {
  /** Page size, 1 to 200. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Query parameters of listBuybacks. */
export interface ListBuybacksQuery {
  kind?: "justi" | "coin";
  status?: "planned" | "swapped" | "burned" | "held";
  /** Page size, 1 to 200. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Query parameters of getTokenRewards. */
export interface GetTokenRewardsQuery {
  /** Page size, 1 to 200. */
  limit?: number;
}

/** Query parameters of getWalletRewards. */
export interface GetWalletRewardsQuery {
  /** Page size, 1 to 200. */
  limit?: number;
}

/** Query parameters of listPayouts. */
export interface ListPayoutsQuery {
  /** Page size, 1 to 200. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Query parameters of getQuote. */
export interface GetQuoteQuery {
  /** Base58 Solana address. */
  mint: Address;
  /** buy: SOL in, coin out. sell: coin in, SOL out. */
  side: "buy" | "sell";
  /** Lamports to spend on a buy, raw tokens to sell. */
  amount: U64String | number | bigint;
  /** Basis points, 10 to 5000. Default 1000 (10%). */
  slippageBps?: number;
}

/** Request body of submitLaunch. */
export interface SubmitLaunchBody {
  /** Base64 serialized versioned transaction. */
  transaction: string;
  waitMs?: number;
}

/** Response of listWebhooks. */
export type ListWebhooksResponse = {
  webhooks: Webhook[];
};

/** Request body of updateWebhook. */
export interface UpdateWebhookBody {
  url?: string;
  events?: Array<"launch.created" | "trade" | "coin.graduated" | "burn" | "buyback" | "payout" | "creator.claim">;
  mints?: Address[] | null;
  description?: string | null;
  enabled?: boolean;
}

/** Response of deleteWebhook. */
export type DeleteWebhookResponse = {
  deleted: boolean;
};

/** Response of listWebhookDeliveries. */
export type ListWebhookDeliveriesResponse = {
  deliveries: WebhookDelivery[];
  nextCursor: string | null;
};

/** Query parameters of listWebhookDeliveries. */
export interface ListWebhookDeliveriesQuery {
  /** Page size, 1 to 200. */
  limit?: number;
  /** nextCursor from the previous page. */
  cursor?: string;
}

/** Response of testWebhook. */
export type TestWebhookResponse = {
  deliveryId: string;
  delivered: boolean;
  statusCode: number | null;
  error: string | null;
  durationMs: number;
};

/** Request body of createFreeKey. */
export interface CreateFreeKeyBody {
  /** Base58 Solana address. */
  wallet: Address;
  label: string;
  /** Unix seconds used in the message. */
  ts: number;
  /** Base58 ed25519 signature of the message. */
  signature: string;
}

/** Response of getMyKey. */
export type GetMyKeyResponse = {
  key: ApiKey;
  limits: Record<string, {
    capacity: number;
    perMin: number;
  }>;
  maxStreamConnections: number;
};

/** Response of revokeMyKey. */
export type RevokeMyKeyResponse = {
  revoked: boolean;
};

