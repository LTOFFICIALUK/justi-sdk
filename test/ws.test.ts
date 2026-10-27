import { test } from "node:test";
import assert from "node:assert/strict";
import { Justi } from "../src/index.js";
import type { StreamEvent } from "../src/index.js";

// A scripted WebSocket stand-in: records what the client sends and lets the test drive the server side.
class FakeSocket {
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  constructor(public url: string) {
    FakeSocket.all.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.({});
      this.push({ type: "welcome", channels: ["launches"], heartbeatSec: 20, tier: "anon", maxSubscriptions: 20, ts: 1 });
    });
  }
  push(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
  send(d: string) {
    this.sent.push(JSON.parse(d));
  }
  close(code = 1000, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }
}

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

test("subscribe: sends subscribe after welcome, delivers events, resubscribes after a drop", async () => {
  FakeSocket.all = [];
  const j = new Justi({ baseUrl: "https://api.example", apiKey: "jf_live_k" });
  const got: StreamEvent[] = [];
  const sub = j.subscribe(["launches", "trades:So11111111111111111111111111111111111111112"], (e) => got.push(e), { WebSocket: FakeSocket as never, maxBackoffMs: 20 });
  await tick();
  const s1 = FakeSocket.all[0];
  assert.equal(s1.url, "wss://api.example/v1/ws?key=jf_live_k");
  assert.deepEqual(s1.sent[0], { op: "subscribe", channels: ["launches", "trades:So11111111111111111111111111111111111111112"] });
  s1.push({ type: "event", channel: "launches", event: "launch.created", id: "evt_1", ts: 2, data: { mint: "M" } });
  s1.push({ type: "heartbeat", ts: 3 });
  assert.equal(got.length, 1);
  assert.equal(got[0].event, "launch.created");
  sub.add("graduations");
  assert.deepEqual(s1.sent[1], { op: "subscribe", channels: ["graduations"] });
  sub.remove("launches");
  assert.deepEqual(s1.sent[2], { op: "unsubscribe", channels: ["launches"] });
  // drop: the client reconnects and subscribes to what it still wants
  s1.close(1006, "gone");
  await tick(40);
  assert.equal(FakeSocket.all.length, 2);
  assert.deepEqual(FakeSocket.all[1].sent[0], { op: "subscribe", channels: ["trades:So11111111111111111111111111111111111111112", "graduations"] });
  assert.equal(sub.connected, true);
  sub.close();
  await tick(40);
  assert.equal(FakeSocket.all.length, 2, "no reconnect after close()");
});

test("subscribe: does not reconnect after a policy close (1008)", async () => {
  FakeSocket.all = [];
  const closes: boolean[] = [];
  const sub = new Justi({ baseUrl: "http://localhost:1" }).subscribe(["trades"], () => {}, { WebSocket: FakeSocket as never, maxBackoffMs: 10, onClose: (c) => closes.push(c.willReconnect) });
  await tick();
  assert.equal(FakeSocket.all[0].url, "ws://localhost:1/v1/ws");
  FakeSocket.all[0].close(1008, "flood");
  await tick(30);
  assert.deepEqual(closes, [false]);
  assert.equal(FakeSocket.all.length, 1);
  sub.close();
});
