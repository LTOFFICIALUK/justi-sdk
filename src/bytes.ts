// Small byte helpers: base58, base64, hex. No dependencies.

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B58_MAP = new Map([...B58].map((c, i) => [c, i]));

export const base58Encode = (bytes: Uint8Array): string => {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
};

export const base58Decode = (text: string): Uint8Array => {
  let zeros = 0;
  while (zeros < text.length && text[zeros] === "1") zeros++;
  const bytes: number[] = [];
  for (let i = zeros; i < text.length; i++) {
    const v = B58_MAP.get(text[i]);
    if (v === undefined) throw new Error(`Not base58: ${JSON.stringify(text[i])}`);
    let carry = v;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[out.length - 1 - i] = bytes[i];
  return out;
};

export const base64Encode = (bytes: Uint8Array): string => {
  if (typeof btoa === "function") {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  return (globalThis as unknown as { Buffer: { from(b: Uint8Array): { toString(e: string): string } } }).Buffer.from(bytes).toString("base64");
};

export const base64Decode = (text: string): Uint8Array => {
  if (typeof atob === "function") {
    const s = atob(text);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  const buf = (globalThis as unknown as { Buffer: { from(t: string, e: string): Uint8Array } }).Buffer.from(text, "base64");
  return new Uint8Array(buf);
};

export const hexEncode = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const hexDecode = (hex: string): Uint8Array | null => {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

export const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

/** Constant-time compare of two byte arrays. */
export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

/**
 * Decimal amount to raw integer units, exactly (no float maths).
 * toRaw("1.5", 9) === 1500000000n, toRaw(0.1, 9) === 100000000n.
 */
export const toRaw = (amount: string | number | bigint, decimals: number): bigint => {
  if (typeof amount === "bigint") return amount * 10n ** BigInt(decimals);
  const text = typeof amount === "number" ? numberText(amount) : amount.trim();
  const m = /^(\d*)(?:\.(\d*))?$/.exec(text);
  if (!m || (m[1] === "" && (m[2] ?? "") === "")) throw new Error(`Not a positive decimal amount: ${JSON.stringify(amount)}`);
  const frac = (m[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  return BigInt(m[1] || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
};

const numberText = (n: number): string => {
  if (!Number.isFinite(n) || n < 0) throw new Error(`Not a positive amount: ${n}`);
  const s = String(n);
  if (!/e/i.test(s)) return s;
  return n.toFixed(20).replace(/\.?0+$/, "");
};

/** Raw integer units to a decimal string, trailing zeros trimmed. fromRaw(1500000000n, 9) === "1.5". */
export const fromRaw = (raw: string | bigint, decimals: number): string => {
  const v = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
};
