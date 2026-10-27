// Launch a coin from a Node script.
//   KEYPAIR=~/.config/solana/id.json IMAGE=./coin.png npx tsx examples/node-launch.ts
// The keypair pays the rent, network fees and any dev buy, and becomes the creator.
import { readFileSync } from "node:fs";
import { Justi, keypairSigner } from "@justifun/sdk";

const secret = Uint8Array.from(JSON.parse(readFileSync(process.env.KEYPAIR!, "utf8")) as number[]);
const justi = new Justi({ apiKey: process.env.JUSTI_API_KEY }); // the key is optional

const result = await justi.launch({
  signer: keypairSigner(secret),
  name: "Cattleaxe",
  ticker: "CAXE",
  description: "one axe. one herd.",
  image: new Uint8Array(readFileSync(process.env.IMAGE!)), // or an https URL
  mode: "split", // creator | holders | split
  creatorBps: 50, // 0.50% to the creator, plus 0.5% to holders in split mode
  devBuySol: 0.1, // optional, capped at 15% of supply
  xUrl: "https://x.com/cattleaxe",
});

console.log(result.status, result.mint, result.url);
