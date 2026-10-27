// Next.js (App Router) routes. Copy each handler into its own file.
//
// 1) app/api/justi/webhook/route.ts: receive justi.fun webhooks.
//    Read the raw body with req.text() before parsing, or the signature will not match.
// 2) app/api/justi/swap/route.ts: build a swap for the connected wallet on your server
//    (keeps your API key off the client). The browser signs it with the wallet and posts it back.
import { Justi, parseWebhook, JustiError } from "@justifun/sdk";

const justi = new Justi({ apiKey: process.env.JUSTI_API_KEY });

// app/api/justi/webhook/route.ts
export async function POST_webhook(req: Request): Promise<Response> {
  const raw = await req.text();
  try {
    const event = await parseWebhook(raw, req.headers.get("justi-signature"), process.env.JUSTI_WEBHOOK_SECRET!);
    switch (event.type) {
      case "launch.created":
        console.log("new coin", event.data.ticker, event.data.mint);
        break;
      case "trade":
        console.log(event.data.side, event.data.solLamports, "lamports of", event.data.mint);
        break;
      case "coin.graduated":
        console.log("graduated to DAMM v2", event.data.dammPool);
        break;
    }
    return new Response("ok"); // any 2xx; dedupe on event.id, order is not guaranteed
  } catch {
    return new Response("bad signature", { status: 400 });
  }
}

// app/api/justi/swap/route.ts
export async function POST_swap(req: Request): Promise<Response> {
  const { mint, wallet, side, amount, signedTransaction, swapId } = (await req.json()) as {
    mint?: string; wallet?: string; side?: "buy" | "sell"; amount?: string; signedTransaction?: string; swapId?: string;
  };
  try {
    if (signedTransaction && swapId) {
      // step 2: relay the signed transaction
      return Response.json(await justi.submitSwap({ swapId, transaction: signedTransaction }));
    }
    // step 1: build an unsigned transaction for the wallet to sign
    const built = await justi.buildSwap({ mint: mint!, wallet: wallet!, side: side!, amount: amount!, slippageBps: 1000 });
    return Response.json({ swapId: built.swapId, transaction: built.transaction, quote: built.quote });
  } catch (e) {
    const err = e instanceof JustiError ? e : new JustiError("internal", "Something went wrong.");
    return Response.json({ error: { code: err.code, message: err.message } }, { status: err.status || 500 });
  }
}

// In the browser (wallet adapter):
//   const { swapId, transaction } = await post("/api/justi/swap", { mint, wallet: publicKey.toBase58(), side: "buy", amount: "50000000" });
//   const tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
//   const signed = await signTransaction(tx);
//   await post("/api/justi/swap", { swapId, signedTransaction: Buffer.from(signed.serialize()).toString("base64") });
// Or let the SDK do it in the browser: new Justi({ VersionedTransaction }).buy({ mint, sol: 0.05, signer: wallet })
