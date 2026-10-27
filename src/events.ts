// Event payloads shared by webhooks and the WebSocket. Field names match the server exactly.
import type { Address, U64String } from "./gen/types.js";

export interface TradeEvent {
  mint: Address;
  ticker: string;
  /** curve: Meteora DBC bonding curve. damm: Meteora DAMM v2 pool after graduation. */
  venue: "curve" | "damm";
  side: "buy" | "sell";
  wallet: Address;
  solLamports: U64String;
  /** Raw token units (6 decimals). */
  tokenAmount: U64String;
  /** SOL per whole token after the trade. */
  priceSol: number;
  marketCapSol: number;
  signature: string;
  ix: string;
  slot: number;
  ts: number;
  /** true when the trade landed in the opening sniper window. */
  inWindow: boolean;
}

export interface LaunchCreatedEvent {
  mint: Address;
  name: string;
  ticker: string;
  description: string;
  image: string;
  metadataUri: string;
  creator: Address;
  curvePool: Address;
  config: Address;
  tier: string;
  activationTs: number;
  signature: string;
  devBuyTokens: U64String;
  /** Label of the API key that built the launch, or null. */
  partner: string | null;
}

export interface CoinGraduatedEvent {
  mint: Address;
  ticker: string;
  name: string;
  curvePool: Address;
  dammPool: Address;
  migrationSignature: string | null;
  ts: number;
}

export interface BuybackEvent {
  id: string;
  mint: Address;
  kind: "justi" | "coin";
  lamports: U64String;
  tokensBought: U64String;
  route: string | null;
  swapSignature: string;
  ts: number;
}

export interface BurnEvent {
  id: string;
  mint: Address;
  kind: "justi" | "coin";
  lamports: U64String;
  tokensBurned: U64String;
  swapSignature: string | null;
  burnSignature: string | null;
  ts: number;
}

export interface PayoutEvent {
  id: string;
  wallet: Address;
  /** Total sent: holder rewards plus creator earnings. */
  lamports: U64String;
  holderLamports: U64String;
  /** Creator earnings in this payout (coins whose creator fees justi.fun pays). */
  creatorLamports: U64String;
  signature: string;
  ts: number;
}

export interface CreatorClaimEvent {
  mint: Address;
  wallet: Address;
  lamports: U64String;
  signature: string;
  ts: number;
}

export interface WebhookTestEvent {
  webhookId: string;
  message: string;
}

export interface EventMap {
  trade: TradeEvent;
  "launch.created": LaunchCreatedEvent;
  "coin.graduated": CoinGraduatedEvent;
  buyback: BuybackEvent;
  burn: BurnEvent;
  payout: PayoutEvent;
  "creator.claim": CreatorClaimEvent;
  "webhook.test": WebhookTestEvent;
}

export type EventType = keyof EventMap;

/** A webhook delivery body: `{ id, type, createdAt, data }`. Dedupe on `id`. */
export type WebhookEvent = { [K in EventType]: { id: string; type: K; createdAt: number; data: EventMap[K] } }[EventType];

/** WebSocket channels. `trades:<mint>` limits trades to one coin. */
export type Channel = "launches" | "trades" | "graduations" | "burns" | `trades:${string}`;

/** One event from the WebSocket. */
export type StreamEvent = {
  [K in "trade" | "launch.created" | "coin.graduated" | "burn"]: { type: "event"; channel: Channel; event: K; id: string; ts: number; data: EventMap[K] };
}["trade" | "launch.created" | "coin.graduated" | "burn"];
