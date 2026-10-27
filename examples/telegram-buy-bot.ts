// A small chat bot that buys on justi.fun with its own hot wallet.
// Uses the Telegram Bot API with plain fetch (long polling). Commands:
//   /quote <mint> <sol>    /buy <mint> <sol>    /coin <mint>
//   BOT_TOKEN=... KEYPAIR=./bot-wallet.json ALLOWED_CHAT=<your chat id> npx tsx examples/telegram-buy-bot.ts
// Keep the hot wallet small and lock the bot to your own chat id.
import { readFileSync } from "node:fs";
import { Justi, JustiError, keypairSigner, fromRaw } from "@justifun/sdk";

const TG = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const allowed = process.env.ALLOWED_CHAT;
const wallet = keypairSigner(Uint8Array.from(JSON.parse(readFileSync(process.env.KEYPAIR!, "utf8")) as number[]));
const justi = new Justi({ apiKey: process.env.JUSTI_API_KEY });

const reply = (chatId: number, text: string) =>
  fetch(`${TG}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }) });

const handle = async (chatId: number, text: string) => {
  const [cmd, mint, sol] = text.trim().split(/\s+/);
  if (cmd === "/coin" && mint) {
    const c = await justi.getCoin(mint);
    return reply(chatId, `$${c.ticker} ${c.name}\nprice ${c.priceSol} SOL\nmcap ${c.marketCapSol.toFixed(1)} SOL\ncurve ${c.curveProgressPct.toFixed(1)}%`);
  }
  if (cmd === "/quote" && mint && sol) {
    const q = await justi.quote({ mint, side: "buy", sol });
    return reply(chatId, `${sol} SOL buys about ${fromRaw(q.expectedOut, 6)} tokens (min ${fromRaw(q.minOut, 6)}). Fee ${q.fee.pct.toFixed(2)}%, route ${q.route}.`);
  }
  if (cmd === "/buy" && mint && sol) {
    const r = await justi.buy({ mint, sol, signer: wallet, slippageBps: 1000 });
    if (r.status === "confirmed") return reply(chatId, `Bought. https://solscan.io/tx/${r.signature}`);
    return reply(chatId, `Status ${r.status}${r.error ? `: ${r.error.message}` : ""}`);
  }
  return reply(chatId, "Commands: /coin <mint>, /quote <mint> <sol>, /buy <mint> <sol>");
};

let offset = 0;
for (;;) {
  const res = await fetch(`${TG}/getUpdates?timeout=30&offset=${offset}`).then((r) => r.json() as Promise<{ result: { update_id: number; message?: { chat: { id: number }; text?: string } }[] }>);
  for (const u of res.result ?? []) {
    offset = u.update_id + 1;
    const m = u.message;
    if (!m?.text || (allowed && String(m.chat.id) !== allowed)) continue;
    await handle(m.chat.id, m.text).catch((e) => reply(m.chat.id, e instanceof JustiError ? e.message : "Something went wrong."));
  }
}
