// WebSocket client for /v1/ws with auto-reconnect and resubscribe.
import type { Channel, StreamEvent } from "./events.js";

/** The parts of the WebSocket API this client uses (browser, Bun, Deno, Node 22+, or the `ws` package). */
export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: { code: number; reason: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}
export type WebSocketCtor = new (url: string) => WebSocketLike;

export interface SubscribeOptions {
  /** WebSocket class. Default: globalThis.WebSocket (Node 22+, browsers, Bun, Deno). On Node 18/20 pass `WebSocket` from the `ws` package. */
  WebSocket?: WebSocketCtor;
  /** Reconnect after a drop. Default true. */
  reconnect?: boolean;
  /** Longest wait between reconnect attempts in ms. Default 30000. */
  maxBackoffMs?: number;
  onOpen?: (welcome: Welcome) => void;
  onClose?: (info: { code: number; reason: string; willReconnect: boolean }) => void;
  /** Server `error` messages and socket errors. The subscription keeps running. */
  onError?: (err: { code: string; message: string }) => void;
}

export interface Welcome {
  type: "welcome";
  channels: string[];
  heartbeatSec: number;
  tier: string;
  maxSubscriptions: number;
  ts: number;
}

export interface Subscription {
  /** Adds channels (also kept across reconnects). */
  add(...channels: Channel[]): void;
  /** Removes channels. */
  remove(...channels: Channel[]): void;
  /** Channels this subscription wants. */
  readonly channels: Channel[];
  /** true while the socket is open. */
  readonly connected: boolean;
  /** Closes the socket and stops reconnecting. */
  close(): void;
}

const OPEN = 1;

export const openSubscription = (url: string, channels: Channel[], onEvent: (e: StreamEvent) => void, opts: SubscribeOptions = {}): Subscription => {
  const Ctor = opts.WebSocket ?? (globalThis as { WebSocket?: WebSocketCtor }).WebSocket;
  if (!Ctor) throw new Error("No WebSocket in this runtime. Pass one: subscribe(channels, onEvent, { WebSocket }) with `ws` on Node 18/20.");
  const want = new Set<Channel>(channels);
  const maxBackoff = opts.maxBackoffMs ?? 30_000;
  let ws: WebSocketLike | null = null;
  let closed = false;
  let attempt = 0;
  let open = false;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatSec = 20;

  const send = (msg: unknown) => {
    if (ws && ws.readyState === OPEN) ws.send(JSON.stringify(msg));
  };
  const arm = () => {
    if (watchdog) clearTimeout(watchdog);
    // No message (event or heartbeat) for 2.5 heartbeats: the link is dead, reconnect.
    watchdog = setTimeout(() => ws?.close(4000, "heartbeat timeout"), heartbeatSec * 2500);
  };

  const connect = () => {
    if (closed) return;
    const sock = new Ctor(url);
    ws = sock;
    sock.onopen = () => {
      attempt = 0;
      open = true;
      arm();
    };
    sock.onmessage = (ev) => {
      arm();
      let msg: { type?: string; [k: string]: unknown };
      try {
        msg = JSON.parse(typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer));
      } catch {
        return;
      }
      if (msg.type === "welcome") {
        heartbeatSec = Number(msg.heartbeatSec) || 20;
        arm();
        if (want.size) send({ op: "subscribe", channels: [...want] });
        opts.onOpen?.(msg as unknown as Welcome);
      } else if (msg.type === "event") {
        onEvent(msg as unknown as StreamEvent);
      } else if (msg.type === "error") {
        opts.onError?.({ code: String(msg.code), message: String(msg.message) });
      }
    };
    sock.onerror = () => {
      opts.onError?.({ code: "socket_error", message: "WebSocket error." });
    };
    sock.onclose = (ev) => {
      open = false;
      if (watchdog) clearTimeout(watchdog);
      // 1008 = policy (flooding), 4001/401-like refusals: do not hammer the server.
      const willReconnect = !closed && opts.reconnect !== false && ev.code !== 1008;
      opts.onClose?.({ code: ev.code, reason: ev.reason, willReconnect });
      if (!willReconnect) return;
      const base = Math.min(maxBackoff, 500 * 2 ** attempt++);
      retryTimer = setTimeout(connect, base / 2 + Math.random() * (base / 2));
    };
  };
  connect();

  return {
    add(...chs) {
      const fresh = chs.filter((c) => !want.has(c));
      fresh.forEach((c) => want.add(c));
      if (fresh.length) send({ op: "subscribe", channels: fresh });
    },
    remove(...chs) {
      const gone = chs.filter((c) => want.delete(c));
      if (gone.length) send({ op: "unsubscribe", channels: gone });
    },
    get channels() {
      return [...want];
    },
    get connected() {
      return open;
    },
    close() {
      closed = true;
      if (watchdog) clearTimeout(watchdog);
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close(1000, "client closed");
    },
  };
};
