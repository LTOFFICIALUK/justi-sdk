// Webhook signature check. Header: `Justi-Signature: t=<unix>,v1=<hex>`,
// v1 = HMAC-SHA256(secret, "<t>.<raw body>").
import { bytesEqual, hexDecode, utf8 } from "./bytes.js";
import { hmacSha256 } from "./crypto.js";
import { JustiError } from "./errors.js";
import type { WebhookEvent } from "./events.js";

export interface VerifyOptions {
  /** Largest allowed clock difference in seconds. Default 300. */
  toleranceSec?: number;
  /** Override "now" (unix seconds), for tests. */
  now?: number;
}

const parseHeader = (header: string) => {
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t" && /^\d+$/.test(v)) t = Number(v);
    if (k === "v1") v1.push(v);
  }
  return { t, v1 };
};

/**
 * true when `signatureHeader` is a valid signature of `rawBody` with `secret` and the
 * timestamp is fresh. Pass the raw request body exactly as received (string or bytes),
 * never a re-serialized JSON object.
 */
export const verifyWebhook = async (rawBody: string | Uint8Array, signatureHeader: string | null | undefined, secret: string, opts: VerifyOptions = {}): Promise<boolean> => {
  if (!signatureHeader || !secret) return false;
  const { t, v1 } = parseHeader(signatureHeader);
  if (t === null || v1.length === 0) return false;
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - t) > (opts.toleranceSec ?? 300)) return false;
  const body = typeof rawBody === "string" ? utf8(rawBody) : rawBody;
  const prefix = utf8(`${t}.`);
  const signed = new Uint8Array(prefix.length + body.length);
  signed.set(prefix, 0);
  signed.set(body, prefix.length);
  const expected = await hmacSha256(secret, signed);
  return v1.some((h) => {
    const got = hexDecode(h);
    return !!got && bytesEqual(got, expected);
  });
};

/** Verifies and parses a delivery. Throws JustiError("signature_invalid") when the check fails. */
export const parseWebhook = async (rawBody: string | Uint8Array, signatureHeader: string | null | undefined, secret: string, opts: VerifyOptions = {}): Promise<WebhookEvent> => {
  if (!(await verifyWebhook(rawBody, signatureHeader, secret, opts))) throw new JustiError("signature_invalid", "The webhook signature does not match.", 400);
  const text = typeof rawBody === "string" ? rawBody : new TextDecoder().decode(rawBody);
  return JSON.parse(text) as WebhookEvent;
};
