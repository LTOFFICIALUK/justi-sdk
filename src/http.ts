import { JustiError, type RateLimitInfo } from "./errors.js";
import type { RequestOptions, Requester } from "./gen/client.js";

export interface HttpOptions {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Default 45000 (submits can wait up to 25 s on the server). */
  timeoutMs?: number;
  /** Retries for GET requests on 429, 502, 503 and network errors. Default 2. POSTs are never retried. */
  retries?: number;
  userAgent?: string;
  onRateLimit?: (info: RateLimitInfo) => void;
}

const num = (v: string | null): number | null => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

export const readRateLimit = (h: Headers): RateLimitInfo => ({
  limit: num(h.get("ratelimit-limit")),
  remaining: num(h.get("ratelimit-remaining")),
  reset: num(h.get("ratelimit-reset")),
  policy: h.get("ratelimit-policy"),
});

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new JustiError("timeout", "The request was cancelled."));
    });
  });

export const queryString = (query: Record<string, unknown> | undefined): string => {
  if (!query) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
};

const jsonBody = (body: unknown) => JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? v.toString() : v));

export const makeRequester = (o: HttpOptions): Requester => {
  const base = o.baseUrl.replace(/\/+$/, "");
  const doFetch = o.fetch ?? ((...a: Parameters<typeof fetch>) => globalThis.fetch(...a));
  const retries = o.retries ?? 2;
  const timeoutMs = o.timeoutMs ?? 45_000;

  return async <R>(method: string, path: string, query: Record<string, unknown> | undefined, body: unknown, opts: RequestOptions | undefined): Promise<R> => {
    const url = base + path + queryString(query);
    const headers: Record<string, string> = { accept: "application/json", ...(opts?.headers ?? {}) };
    if (o.apiKey && !headers.authorization && !headers.Authorization) headers.authorization = `Bearer ${o.apiKey}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    if (o.userAgent && typeof window === "undefined") headers["user-agent"] = o.userAgent;

    for (let attempt = 0; ; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      const onAbort = () => ctl.abort();
      opts?.signal?.addEventListener("abort", onAbort);
      let res: Response;
      try {
        res = await doFetch(url, { method, headers, body: body === undefined ? undefined : jsonBody(body), signal: ctl.signal });
      } catch (err) {
        clearTimeout(timer);
        opts?.signal?.removeEventListener("abort", onAbort);
        if (opts?.signal?.aborted) throw new JustiError("timeout", "The request was cancelled.");
        const timedOut = ctl.signal.aborted;
        if (method === "GET" && attempt < retries) {
          await sleep(400 * 2 ** attempt, opts?.signal);
          continue;
        }
        throw new JustiError(timedOut ? "timeout" : "network", timedOut ? `No answer from the API within ${timeoutMs} ms.` : `Could not reach the API: ${err instanceof Error ? err.message : String(err)}`);
      }
      clearTimeout(timer);
      opts?.signal?.removeEventListener("abort", onAbort);
      const rl = readRateLimit(res.headers);
      if (rl.limit !== null) o.onRateLimit?.(rl);
      const text = await res.text();
      let parsed: unknown = undefined;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        /* handled below */
      }
      if (res.ok) {
        if (parsed === undefined) throw new JustiError("bad_response", "The API sent a response that is not JSON.", res.status);
        return parsed as R;
      }
      const retryAfter = num(res.headers.get("retry-after"));
      if (method === "GET" && attempt < retries && [429, 502, 503].includes(res.status)) {
        await sleep(Math.min(retryAfter !== null ? retryAfter * 1000 : 500 * 2 ** attempt, 10_000), opts?.signal);
        continue;
      }
      const e = (parsed as { error?: { code?: string; message?: string; details?: Record<string, unknown> } } | undefined)?.error;
      if (e?.code) throw new JustiError(e.code as JustiError["code"], e.message ?? "Request failed.", res.status, e.details ?? {}, retryAfter, rl);
      throw new JustiError(res.status >= 500 ? "upstream_error" : "bad_response", `The API answered ${res.status}.`, res.status, {}, retryAfter, rl);
    }
  };
};
