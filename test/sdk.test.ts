import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, verify as nodeVerify, createPublicKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  Justi,
  JustiError,
  base58Decode,
  base58Encode,
  fromRaw,
  keypairSigner,
  messageSigner,
  signatureStatus,
  toRaw,
  toSigner,
  txLayout,
  txSignature,
  verifyWebhook,
  parseWebhook,
  apiKeyMessage,
  walletSigner,
} from "../src/index.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/webhook-delivery.json", import.meta.url), "utf8"));

const makeTx = (payer: PublicKey, extraSigner?: PublicKey) => {
  const ixs = [SystemProgram.transfer({ fromPubkey: payer, toPubkey: Keypair.generate().publicKey, lamports: 1000 })];
  if (extraSigner) ixs.push(SystemProgram.transfer({ fromPubkey: extraSigner, toPubkey: payer, lamports: 1 }));
  const msg = new TransactionMessage({ payerKey: payer, recentBlockhash: base58Encode(new Uint8Array(32).fill(7)), instructions: ixs }).compileToV0Message();
  return new VersionedTransaction(msg);
};

const ed25519Ok = (pub: Uint8Array, msg: Uint8Array, sig: Uint8Array) => {
  const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pub)]);
  return nodeVerify(null, msg, createPublicKey({ key: spki, format: "der", type: "spki" }), sig);
};

test("base58 matches @solana/web3.js both ways", () => {
  for (let i = 0; i < 50; i++) {
    const pk = Keypair.generate().publicKey;
    assert.equal(base58Encode(pk.toBytes()), pk.toBase58());
    assert.deepEqual(Buffer.from(base58Decode(pk.toBase58())), Buffer.from(pk.toBytes()));
  }
  assert.equal(base58Encode(new Uint8Array([0, 0, 1])), "112");
  assert.deepEqual([...base58Decode("112")], [0, 0, 1]);
  assert.throws(() => base58Decode("0OIl"));
});

test("toRaw / fromRaw are exact", () => {
  assert.equal(toRaw("1.5", 9), 1_500_000_000n);
  assert.equal(toRaw(0.1, 9), 100_000_000n);
  assert.equal(toRaw("0.000000001", 9), 1n);
  assert.equal(toRaw("0.0000000019", 9), 1n, "extra digits are cut, never rounded up");
  assert.equal(toRaw(1e-7, 9), 100n);
  assert.equal(toRaw("1000000", 6), 1_000_000_000_000n);
  assert.equal(toRaw(2n, 6), 2_000_000n);
  assert.throws(() => toRaw("-1", 9));
  assert.throws(() => toRaw("abc", 9));
  assert.equal(fromRaw(1_500_000_000n, 9), "1.5");
  assert.equal(fromRaw("1000000000000000", 6), "1000000000");
  assert.equal(fromRaw(1n, 6), "0.000001");
});

test("txLayout reads signer slots of a v0 transaction", () => {
  const a = Keypair.generate();
  const b = Keypair.generate();
  const bytes = makeTx(a.publicKey, b.publicKey).serialize();
  const l = txLayout(bytes);
  assert.equal(l.version, 0);
  assert.equal(l.signatureCount, 2);
  assert.deepEqual(l.signers, [a.publicKey.toBase58(), b.publicKey.toBase58()]);
  assert.deepEqual(signatureStatus(bytes).map((s) => s.signed), [false, false]);
  assert.equal(txSignature(bytes), null);
});

test("keypairSigner signs exactly like web3.js (ed25519 is deterministic)", async () => {
  const a = Keypair.generate();
  const b = Keypair.generate();
  const tx = makeTx(a.publicKey, b.publicKey);
  const raw = tx.serialize();
  let ours = await keypairSigner(a).signTransaction(raw);
  ours = await keypairSigner(b.secretKey).signTransaction(ours);
  tx.sign([a, b]);
  assert.deepEqual(Buffer.from(ours), Buffer.from(tx.serialize()));
  assert.equal(txSignature(ours), base58Encode(tx.signatures[0]));
  assert.deepEqual(signatureStatus(ours).map((s) => s.signed), [true, true]);
  const back = VersionedTransaction.deserialize(ours);
  assert.ok(ed25519Ok(a.publicKey.toBytes(), back.message.serialize(), back.signatures[0]));
  // the input array is not mutated
  assert.equal(signatureStatus(raw)[0].signed, false);
});

test("keypairSigner accepts a solana-keygen JSON array", async () => {
  const a = Keypair.generate();
  const s = keypairSigner(Array.from(a.secretKey));
  assert.equal(s.publicKey, a.publicKey.toBase58());
});

test("signing for a key that is not a signer fails clearly", async () => {
  const a = Keypair.generate();
  const raw = makeTx(a.publicKey).serialize();
  await assert.rejects(keypairSigner(Keypair.generate()).signTransaction(raw), /is not a signer/);
});

test("walletSigner goes through the wallet's signTransaction with a VersionedTransaction", async () => {
  const a = Keypair.generate();
  const wallet = {
    publicKey: a.publicKey,
    calls: 0,
    async signTransaction<T>(tx: T): Promise<T> {
      this.calls++;
      assert.ok(tx instanceof VersionedTransaction);
      (tx as VersionedTransaction).sign([a]);
      return tx;
    },
  };
  const s = walletSigner(wallet, VersionedTransaction);
  assert.equal(s.publicKey, a.publicKey.toBase58());
  const signed = await s.signTransaction(makeTx(a.publicKey).serialize());
  assert.equal(wallet.calls, 1);
  assert.equal(signatureStatus(signed)[0].signed, true);
  assert.throws(() => toSigner(wallet), /VersionedTransaction/);
  assert.equal(toSigner(wallet, VersionedTransaction).publicKey, a.publicKey.toBase58());
});

test("messageSigner places a raw ed25519 signature", async () => {
  const a = Keypair.generate();
  const inner = keypairSigner(a);
  const raw = makeTx(a.publicKey).serialize();
  const s = messageSigner(a.publicKey.toBase58(), async (m) => {
    const signed = await inner.signTransaction(raw);
    assert.deepEqual(Buffer.from(m), Buffer.from(raw.subarray(txLayout(raw).messageAt)));
    return signed.subarray(1, 65);
  });
  const out = await s.signTransaction(raw);
  assert.equal(signatureStatus(out)[0].signed, true);
});

test("verifyWebhook accepts a real captured delivery and rejects tampering", async () => {
  const t = Number(/t=(\d+)/.exec(fixture.signature)![1]);
  assert.equal(await verifyWebhook(fixture.body, fixture.signature, fixture.secret, { now: t + 10 }), true);
  assert.equal(await verifyWebhook(new TextEncoder().encode(fixture.body), fixture.signature, fixture.secret, { now: t }), true);
  assert.equal(await verifyWebhook(fixture.body + " ", fixture.signature, fixture.secret, { now: t }), false);
  assert.equal(await verifyWebhook(fixture.body, fixture.signature, "whsec_wrong", { now: t }), false);
  assert.equal(await verifyWebhook(fixture.body, fixture.signature, fixture.secret, { now: t + 301 }), false, "stale");
  assert.equal(await verifyWebhook(fixture.body, "", fixture.secret), false);
  assert.equal(await verifyWebhook(fixture.body, "t=abc,v1=00", fixture.secret), false);
  const ev = await parseWebhook(fixture.body, fixture.signature, fixture.secret, { now: t });
  assert.equal(ev.type, "webhook.test");
  await assert.rejects(parseWebhook(fixture.body, fixture.signature, "x", { now: t }), JustiError);
  assert.equal(await Justi.verifyWebhook(fixture.body, fixture.signature, fixture.secret, { now: t }), true);
});

test("verifyWebhook matches a node:crypto HMAC and accepts any of several v1 values", async () => {
  const secret = "whsec_test";
  const body = '{"id":"evt_1","type":"trade","createdAt":1,"data":{}}';
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  assert.equal(await verifyWebhook(body, `t=${t},v1=${v1}`, secret), true);
  assert.equal(await verifyWebhook(body, `t=${t},v1=${"0".repeat(64)},v1=${v1}`, secret), true);
  assert.equal(await verifyWebhook(body, `t=${t},v1=${v1.slice(0, 62)}`, secret), false);
});

type Call = { method: string; url: string; headers: Record<string, string>; body: unknown };
const fakeFetch = (handler: (c: Call) => { status: number; body: unknown; headers?: Record<string, string> }) => {
  const calls: Call[] = [];
  const f = (async (url: string, init: RequestInit) => {
    const c: Call = { method: init.method!, url, headers: init.headers as Record<string, string>, body: init.body ? JSON.parse(init.body as string) : undefined };
    calls.push(c);
    const r = handler(c);
    return new Response(typeof r.body === "string" ? r.body : JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json", ...(r.headers ?? {}) } });
  }) as unknown as typeof fetch;
  return { f, calls };
};

test("client: query strings, auth header, path encoding, rate limit info", async () => {
  const { f, calls } = fakeFetch(() => ({ status: 200, body: { tokens: [], total: 0, nextCursor: null }, headers: { "ratelimit-limit": "200", "ratelimit-remaining": "199", "ratelimit-reset": "1", "ratelimit-policy": "200;w=20" } }));
  const j = new Justi({ baseUrl: "https://api.example/", apiKey: "jf_live_x", fetch: f });
  await j.listCoins({ sort: "volume24h", limit: 5, q: "cat & dog" });
  assert.equal(calls[0].url, "https://api.example/v1/tokens?sort=volume24h&limit=5&q=cat%20%26%20dog");
  assert.equal(calls[0].headers.authorization, "Bearer jf_live_x");
  assert.deepEqual(j.rateLimit, { limit: 200, remaining: 199, reset: 1, policy: "200;w=20" });
  await j.listTrades("Mint111", { side: "buy" });
  assert.equal(calls[1].url, "https://api.example/v1/tokens/Mint111/trades?side=buy");
});

test("client: errors become JustiError with code, details and retryAfter", async () => {
  const { f } = fakeFetch(() => ({ status: 400, body: { error: { code: "slippage", message: "Price moved.", details: { suggestSlippageBps: 1500 } } } }));
  const j = new Justi({ fetch: f });
  const e = await j.quote({ mint: "M", side: "buy", sol: 0.1 }).catch((x) => x);
  assert.ok(e instanceof JustiError);
  assert.equal(e.code, "slippage");
  assert.equal(e.status, 400);
  assert.equal(e.suggestSlippageBps, 1500);
});

test("client: GET retries 429 using Retry-After, POST never retries", async () => {
  let n = 0;
  const { f, calls } = fakeFetch((c) => {
    if (c.method === "GET" && n++ === 0) return { status: 429, body: { error: { code: "rate_limited", message: "Slow down." } }, headers: { "retry-after": "0" } };
    if (c.method === "POST") return { status: 503, body: { error: { code: "unavailable", message: "Off." } } };
    return { status: 200, body: { ok: true } };
  });
  const j = new Justi({ fetch: f });
  assert.deepEqual(await j.getStatus(), { ok: true });
  assert.equal(calls.length, 2);
  await assert.rejects(j.buildSwap({ mint: "M", wallet: "W", side: "buy", amount: "1" }), (e: JustiError) => e.code === "unavailable");
  assert.equal(calls.length, 3);
});

test("quote converts decimal SOL and tokens to raw amounts", async () => {
  const { f, calls } = fakeFetch(() => ({ status: 200, body: {} }));
  const j = new Justi({ fetch: f });
  await j.quote({ mint: "M", side: "buy", sol: 0.25 });
  await j.quote({ mint: "M", side: "sell", tokens: "1500.5" });
  await j.quote({ mint: "M", side: "sell", amount: 42n });
  assert.match(calls[0].url, /amount=250000000(&|$)/);
  assert.match(calls[1].url, /amount=1500500000(&|$)/);
  assert.match(calls[2].url, /amount=42(&|$)/);
  await assert.rejects(j.quote({ mint: "M", side: "buy" }), /Pass sol or amount/);
});

test("launch: builds, signs with wallet and custom mint, submits, waits until live", async () => {
  const wallet = Keypair.generate();
  const mint = Keypair.generate();
  const launchId = "0b7c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d";
  let submitted: string | null = null;
  let polls = 0;
  const { f, calls } = fakeFetch((c) => {
    if (c.url.endsWith("/v1/launches") && c.method === "POST") {
      const b = c.body as Record<string, unknown>;
      assert.equal(b.wallet, wallet.publicKey.toBase58());
      assert.equal(b.mint, mint.publicKey.toBase58());
      assert.equal(b.devBuyLamports, "100000000");
      assert.match(String(b.image), /^data:image\/png;base64,/);
      const tx = makeTx(wallet.publicKey, mint.publicKey);
      return {
        status: 201,
        body: {
          launchId,
          mint: mint.publicKey.toBase58(),
          signers: [
            { pubkey: wallet.publicKey.toBase58(), role: "payer", signed: false },
            { pubkey: mint.publicKey.toBase58(), role: "mint", signed: false },
          ],
          transaction: Buffer.from(tx.serialize()).toString("base64"),
        },
      };
    }
    if (c.url.endsWith(`/v1/launches/${launchId}/submit`)) {
      submitted = (c.body as { transaction: string }).transaction;
      return { status: 200, body: { status: "submitted", mint: mint.publicKey.toBase58(), signature: "sig" } };
    }
    if (c.url.endsWith(`/v1/launches/${launchId}`)) {
      polls++;
      return { status: 200, body: { status: polls > 1 ? "live" : "submitted", signature: "sig", error: null } };
    }
    return { status: 404, body: { error: { code: "not_found", message: "no" } } };
  });
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const j = new Justi({ fetch: f });
  const r = await j.launch({ signer: wallet, mintSigner: mint, name: "Kurumi Desk", ticker: "KDSK", image: png, mode: "creator", creatorBps: 100, devBuySol: 0.1 });
  assert.equal(r.status, "live");
  assert.equal(r.url, `https://justi.fun/coin/${mint.publicKey.toBase58()}`);
  const tx = VersionedTransaction.deserialize(Buffer.from(submitted!, "base64"));
  assert.ok(ed25519Ok(wallet.publicKey.toBytes(), tx.message.serialize(), tx.signatures[0]));
  assert.ok(ed25519Ok(mint.publicKey.toBytes(), tx.message.serialize(), tx.signatures[1]));
  assert.equal(calls.filter((c) => c.method === "GET").length, 2);
});

test("launch: refuses when a required signer is missing, and dryRun never submits", async () => {
  const wallet = Keypair.generate();
  const mint = Keypair.generate();
  const tx = makeTx(wallet.publicKey, mint.publicKey);
  const { f, calls } = fakeFetch(() => ({
    status: 201,
    body: { launchId: "x", mint: mint.publicKey.toBase58(), signers: [{ pubkey: wallet.publicKey.toBase58(), role: "payer", signed: false }, { pubkey: mint.publicKey.toBase58(), role: "mint", signed: false }], transaction: Buffer.from(tx.serialize()).toString("base64") },
  }));
  const j = new Justi({ fetch: f });
  await assert.rejects(j.launch({ signer: wallet, name: "Ab", ticker: "AB", image: "https://x.example/a.png", mode: "holders" }), /needs a signature/);
  const r = await j.launch({ signer: wallet, mintSigner: mint, name: "Ab", ticker: "AB", image: "https://x.example/a.png", mode: "holders", dryRun: true });
  assert.equal(r.status, "signed");
  assert.ok(r.signature);
  assert.equal(calls.length, 2, "two builds, no submit");
});

test("buy: build, sign, submit, poll until confirmed", async () => {
  const wallet = Keypair.generate();
  const swapId = "1b7c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d";
  let polls = 0;
  const { f, calls } = fakeFetch((c) => {
    if (c.url.endsWith("/v1/swap")) {
      assert.deepEqual(c.body, { mint: "M", wallet: wallet.publicKey.toBase58(), side: "buy", amount: "50000000", slippageBps: 800, jitoTipLamports: "100000" });
      return { status: 200, body: { swapId, route: "curve", quote: {}, transaction: Buffer.from(makeTx(wallet.publicKey).serialize()).toString("base64") } };
    }
    if (c.url.endsWith("/v1/submit")) return { status: 200, body: { swapId, status: "submitted", signature: "s", route: "curve", error: null } };
    polls++;
    return { status: 200, body: { swapId, status: "confirmed", signature: "s", route: "curve", error: null } };
  });
  const j = new Justi({ fetch: f });
  const r = await j.buy({ mint: "M", sol: "0.05", signer: wallet, slippageBps: 800, jitoTipLamports: 100000 });
  assert.equal(r.status, "confirmed");
  assert.equal(polls, 1);
  assert.equal(calls.length, 3);
});

test("apiKeyMessage is the exact text the server checks", async () => {
  assert.equal(apiKeyMessage("W", "my bot", 1700000000), "justi.fun api key\nwallet: W\nlabel: my bot\ntime: 1700000000");
  const kp = Keypair.generate();
  const { f, calls } = fakeFetch(() => ({ status: 201, body: { key: "jf_live_x", record: {}, message: "ok" } }));
  await new Justi({ fetch: f }).createApiKey({ wallet: kp, label: "my bot" });
  const b = calls[0].body as { wallet: string; ts: number; signature: string; label: string };
  assert.equal(b.wallet, kp.publicKey.toBase58());
  assert.ok(ed25519Ok(kp.publicKey.toBytes(), new TextEncoder().encode(apiKeyMessage(b.wallet, b.label, b.ts)), base58Decode(b.signature)));
});
