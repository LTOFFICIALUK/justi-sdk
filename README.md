# @justifun/sdk

TypeScript SDK for [justi.fun](https://justi.fun), a fair Solana launchpad on Meteora.
Launch a coin, quote, buy and sell, read coins and trades, stream live events and verify webhooks.

- Zero runtime dependencies. Works in Node 18+, browsers, Bun, Deno and edge runtimes.
- ESM and CommonJS builds with full types, generated from the live [OpenAPI spec](https://api.justi.fun/v1/openapi.json).
- Signs with a Keypair, a secret key, a browser wallet adapter, or your own signer. Keys never leave your process.

Docs: https://docs.justi.fun

```sh
npm install @justifun/sdk
```

> Package name: `@justifun/sdk` needs the `justifun` npm org. Until it exists the same code is published as `justi-sdk`; swap the import name and nothing else changes.

## Build a launchpad feature on Solana

Add "launch a coin" to a bot, a wallet or a trading app in about ten lines. The server builds the
create transaction with the same rules as the site (fee tiers, the launch block fee, the 15%
dev buy cap, the copy rule). Your code signs it locally and the API sends it privately through Jito.

```ts
import { Justi, keypairSigner } from "@justifun/sdk";
import { readFileSync } from "node:fs";

const justi = new Justi(); // new Justi({ apiKey }) for higher limits
const wallet = keypairSigner(JSON.parse(readFileSync("wallet.json", "utf8")));

const coin = await justi.launch({
  signer: wallet,
  name: "Kurumi",
  ticker: "KURUMI",
  image: "https://example.com/kurumi.png", // https URL, data URL or bytes
  mode: "holders", // creator | holders | split
  devBuySol: 0.1,
});
console.log(coin.status, coin.url); // live https://justi.fun/coin/...JUST
```

## Trade

```ts
const q = await justi.quote({ mint, side: "buy", sol: 0.5 });
console.log(q.expectedOut, q.fee.pct, q.route); // route: curve before graduation, damm after

const buy = await justi.buy({ mint, sol: 0.5, signer: wallet, slippageBps: 800 });
const sell = await justi.sell({ mint, tokens: "250000", signer: wallet });
```

`buy` and `sell` build the transaction on the server (fresh quote, simulated, compute limit set from the
simulation), sign it, submit it and poll until `confirmed`, `failed` or `expired`. A trade that fails on
chain returns `status: "failed"` with `error.code` (for example `slippage` with `suggestSlippageBps`).
Pass `dryRun: true` to get the signed transaction without sending it.

## Read

```ts
const page = await justi.listCoins({ sort: "volume24h", limit: 20 });
for await (const c of justi.coins({ status: "curve" })) console.log(c.ticker, c.marketCapSol);
const coin = await justi.getCoin(mint); // metadata, safety facts, curve, graduation, launch block fee
const { trades, nextCursor } = await justi.listTrades(mint, { limit: 50 });
const candles = await justi.getCandles(mint, { tf: "1m" });
const protocol = await justi.getProtocol(); // program, the 20 configs, fee claimer: tag justi coins
```

Every API operation is a method named by its `operationId` (`getQuote`, `buildSwap`, `submitSwap`,
`buildLaunch`, `submitLaunch`, `getLaunch`, `createWebhook`, `listHolders`, `getWalletRewards`, ...).

## Live events

```ts
const sub = justi.subscribe(["launches", `trades:${mint}`], (e) => {
  if (e.event === "trade") console.log(e.data.side, e.data.solLamports, e.data.signature);
  if (e.event === "launch.created") console.log("new coin", e.data.ticker, e.data.mint);
});
// sub.add("graduations"); sub.remove("launches"); sub.close();
```

Reconnects with backoff and resubscribes on its own. Channels: `launches`, `trades`, `trades:<mint>`,
`graduations`, `burns`. Node 18 and 20 have no global WebSocket: pass `{ WebSocket }` from the `ws` package.

## Webhooks

```ts
import { parseWebhook } from "@justifun/sdk";

// Next.js route handler. Use the raw body, not a parsed object.
export async function POST(req: Request) {
  const event = await parseWebhook(await req.text(), req.headers.get("justi-signature"), process.env.JUSTI_WEBHOOK_SECRET!);
  if (event.type === "launch.created") console.log(event.data.mint);
  return new Response("ok");
}
```

`verifyWebhook(rawBody, header, secret)` returns a boolean if you prefer. Signatures older than 5 minutes are refused.

## Signers

| You have | Pass |
|---|---|
| `Keypair` from @solana/web3.js | `signer: keypair` |
| 64-byte secret key or a solana-keygen JSON array | `keypairSigner(bytesOrArray)` |
| Browser wallet (wallet adapter, Phantom, Solflare, Backpack) | `new Justi({ VersionedTransaction })`, then `signer: wallet` |
| KMS, MPC or hardware key that signs raw bytes | `messageSigner(publicKey, (msg) => sign(msg))` |
| Anything else | an object `{ publicKey: string, signTransaction(bytes) => bytes }` |

For a vanity mint, generate the keypair yourself and pass `mintSigner`. Only the public key is sent.

## API keys

Not required. A key raises rate limits and attributes your swaps and launches to you. Get a free key by signing a message with any wallet:

```ts
const { key } = await justi.createApiKey({ wallet: keypair, label: "my bot" }); // shown once
```

Partner keys (higher limits): ask on X at [@justifun](https://x.com/justifun).

## Errors

Every failed call throws `JustiError` with `code`, `status`, `message` (plain language, safe to show),
`details`, and `retryAfter` on 429. GET requests retry 429/502/503 twice by default. POSTs never retry.

## Development

```sh
npm install
npm run spec:pull   # refresh openapi.json from the live API
npm run gen         # regenerate src/gen from openapi.json
npm test            # unit tests (node --test)
npm run test:live   # JUSTI_API=... RPC_URL=... reads, quotes, builds and simulates (never sends)
npm run build       # dist/esm + dist/cjs
```

Examples: [examples/node-launch.ts](examples/node-launch.ts), [examples/telegram-buy-bot.ts](examples/telegram-buy-bot.ts), [examples/nextjs-route.ts](examples/nextjs-route.ts).

## License

MIT
