// Live check against a running justi API (default: a local server). Never sends a transaction.
//   JUSTI_API=http://localhost:8151 RPC_URL=... MINT=<curve coin> WALLET=<funded wallet> npm run test:live
// Reads coins, quotes, builds a swap and a launch through the SDK and simulates both with
// simulateTransaction (sigVerify false). Also creates a self-serve key and opens the WebSocket.
import { readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { Justi, JustiError, base64Decode, base64Encode, placeSignature, signatureStatus, type TransactionSigner } from "../src/index.js";

const API = process.env.JUSTI_API || "http://localhost:8151";
const RPC = process.env.RPC_URL;
const WALLET = process.env.WALLET || "BRV3sXDm7bae36qRNCMVSx2y1znGAz1UqoiS52TProzj";
const IMAGE = process.env.IMAGE;
let failures = 0;
const ok = (name: string, cond: unknown, extra: unknown = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}`, typeof extra === "string" ? extra : JSON.stringify(extra));
};

// Stands in for a wallet we do not hold the key of: fills its slot with a placeholder so the
// transaction can be simulated with sigVerify false. A real integration passes a Keypair or wallet.
const placeholderSigner = (publicKey: string): TransactionSigner => ({
  publicKey,
  async signTransaction(tx) {
    return placeSignature(tx, publicKey, new Uint8Array(64).fill(1));
  },
});

const simulate = async (b64: string) => {
  if (!RPC) return null;
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "simulateTransaction", params: [b64, { encoding: "base64", sigVerify: false, replaceRecentBlockhash: false, commitment: "processed" }] }),
  });
  const j = (await r.json()) as { result?: { value: { err: unknown; unitsConsumed?: number; logs?: string[] } }; error?: unknown };
  return j.result?.value ?? { err: j.error, unitsConsumed: 0, logs: [] };
};

const justi = new Justi({ baseUrl: API });

const protocol = await justi.getProtocol();
ok("getProtocol", protocol.dbcProgram === "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN" && protocol.configs.length === 20, { configs: protocol.configs.length, feeClaimer: protocol.feeClaimer });
const pad = await justi.getPad();
ok("getPad", pad.tiers.length === 20, { window: pad.sniperWindow });
ok("getStatus", !!(await justi.getStatus()));
const page = await justi.listCoins({ sort: "volume24h", limit: 5 });
ok("listCoins", page.tokens.length > 0, { total: page.total, first: page.tokens[0]?.ticker });
let count = 0;
for await (const _c of justi.coins({ limit: 3 })) count++;
ok("coins() iterates every page", count === page.total, { count });
const curve = page.tokens.find((t) => t.status === "curve") ?? page.tokens[0];
const MINT = process.env.MINT || curve.mint;
const coin = await justi.getCoin(MINT);
ok("getCoin", coin.mint === MINT, { ticker: coin.ticker, status: coin.status, priceSol: coin.priceSol });
const trades = await justi.listTrades(MINT, { limit: 5 });
ok("listTrades", Array.isArray(trades.trades), { n: trades.trades.length });
const candles = await justi.getCandles(MINT, { tf: "1m", limit: 10 });
ok("getCandles", Array.isArray(candles.candles), { n: candles.candles.length });
ok("listHolders", Array.isArray((await justi.listHolders(MINT, { limit: 5 })).holders));
ok("getPlatformStats", !!(await justi.getPlatformStats()));
ok("getTokenList", (await justi.getTokenList()).tokens.length === page.total);

const qb = await justi.quote({ mint: MINT, side: "buy", sol: 0.05 });
ok("quote buy 0.05 SOL", BigInt(qb.expectedOut) > 0n, { route: qb.route, expectedOut: qb.expectedOut, feePct: qb.fee.pct, impact: qb.priceImpactPct });
const qs = await justi.quote({ mint: MINT, side: "sell", tokens: 100000 });
ok("quote sell 100k tokens", BigInt(qs.expectedOut) > 0n, { route: qs.route, expectedOut: qs.expectedOut });
const bad = await justi.getCoin("So11111111111111111111111111111111111111112").catch((e) => e);
ok("unknown coin is a JustiError not_found", bad instanceof JustiError && bad.code === "not_found", { code: bad.code, status: bad.status });

// Swap through the SDK's buy() path (build, sign, no send) then simulate.
const buy = await justi.buy({ mint: MINT, sol: 0.01, signer: placeholderSigner(WALLET), slippageBps: 1000, dryRun: true });
const sb = await simulate(buy.transaction);
ok("buy dryRun built + signed", buy.status === "built" && signatureStatus(base64Decode(buy.transaction))[0].signed, { route: buy.route, swapId: buy.swapId, bytes: base64Decode(buy.transaction).length });
if (sb) ok("buy simulates on mainnet", sb.err === null, { err: sb.err, units: sb.unitsConsumed });

// Launch through the SDK's launch() path with a custom mint key held locally (never sent), then simulate.
const mintKp = Keypair.generate();
const img = IMAGE ? new Uint8Array(readFileSync(IMAGE)) : "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
const launch = await justi.launch({
  signer: placeholderSigner(WALLET),
  mintSigner: mintKp,
  name: "Swordope Desk",
  ticker: "SWDK",
  description: "sdk live check. never sent.",
  image: img,
  mode: "split",
  creatorBps: 50,
  devBuySol: 0.02,
  dryRun: true,
});
const lb = base64Decode(launch.transaction);
ok("launch dryRun built + every slot signed", launch.status === "signed" && signatureStatus(lb).every((s) => s.signed), { mint: launch.mint, tier: launch.built.tier, signers: launch.built.signers, bytes: lb.length, devBuyPct: launch.built.devBuyPctOfSupply });
ok("custom mint used", launch.mint === mintKp.publicKey.toBase58());
const sl = await simulate(launch.transaction);
if (sl) ok("launch simulates on mainnet", sl.err === null, { err: sl.err, units: sl.unitsConsumed, logs: sl.err ? sl.logs?.slice(-6) : undefined });

// Self-serve API key with a fresh wallet, then use it.
const kp = Keypair.generate();
try {
  const created = await justi.createApiKey({ wallet: kp, label: "sdk live check" });
  ok("createApiKey (wallet signature)", created.key.startsWith("jf_live_"), { tier: created.record.tier, prefix: created.record.prefix });
  const keyed = new Justi({ baseUrl: API, apiKey: created.key });
  const me = await keyed.getMyKey();
  ok("getMyKey with the new key", me.key.prefix === created.record.prefix, { limit: keyed.rateLimit });
  ok("listWebhooks with the new key", Array.isArray((await keyed.listWebhooks()).webhooks));
  await keyed.revokeMyKey();
  const after = await keyed.getMyKey().catch((e) => e);
  ok("revoked key answers 401", after instanceof JustiError && after.status === 401, { code: after.code });
} catch (e) {
  ok("createApiKey", false, String(e));
}

// WebSocket: connect, get welcome, wait briefly for live trades.
await new Promise<void>((resolve) => {
  let events = 0;
  const sub = justi.subscribe(["trades", "launches"], (e) => {
    events++;
    if (events === 1) console.log("     first event", e.event, e.channel, (e.data as { signature?: string }).signature?.slice(0, 12));
  }, {
    onOpen: (w) => ok("subscribe: welcome", w.type === "welcome", { tier: w.tier, heartbeatSec: w.heartbeatSec }),
    onError: (err) => console.log("     ws error", err),
  });
  setTimeout(() => {
    ok("subscribe: connected", sub.connected, { eventsIn20s: events });
    sub.close();
    resolve();
  }, Number(process.env.WS_WAIT_MS || 20000));
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
void base64Encode;
