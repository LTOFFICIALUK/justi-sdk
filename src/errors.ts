import type { Error as ApiErrorBody } from "./gen/types.js";

export type ErrorCode = ApiErrorBody["error"]["code"] | "network" | "timeout" | "bad_response" | "signer";

/** Rate limit headers of the last response. */
export interface RateLimitInfo {
  /** Bucket size (burst). */
  limit: number | null;
  /** Requests left now. */
  remaining: number | null;
  /** Seconds until the bucket is full again. */
  reset: number | null;
  policy: string | null;
}

/** Every failed call throws a JustiError. `message` is plain language and safe to show to users. */
export class JustiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown>;
  /** Seconds to wait before retrying (429 and some 503s). */
  readonly retryAfter: number | null;
  readonly rateLimit: RateLimitInfo | null;

  constructor(code: ErrorCode, message: string, status = 0, details: Record<string, unknown> = {}, retryAfter: number | null = null, rateLimit: RateLimitInfo | null = null) {
    super(message);
    this.name = "JustiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
    this.rateLimit = rateLimit;
  }

  /** For `slippage` errors: the slippage the API suggests for a retry. */
  get suggestSlippageBps(): number | null {
    const v = this.details.suggestSlippageBps;
    return typeof v === "number" ? v : null;
  }
}

export const isJustiError = (e: unknown): e is JustiError => e instanceof JustiError;
