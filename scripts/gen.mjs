// Generates src/gen/types.ts and src/gen/client.ts from the justi.fun OpenAPI spec.
// Usage: node scripts/gen.mjs [path-or-url]   (default: ./openapi.json)
// Run `npm run spec:pull` first to refresh openapi.json from the live API.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || join(root, "openapi.json");
const spec = src.startsWith("http") ? await (await fetch(src)).json() : JSON.parse(readFileSync(src, "utf8"));

const SKIP_TAGS = new Set(["Admin"]);
const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ident = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
const doc = (text, pad) => {
  if (!text) return "";
  const t = String(text).replace(/\*\//g, "*\\/");
  return `${pad}/** ${t} */\n`;
};

const ts = (s, pad = "") => {
  if (!s || Object.keys(s).length === 0) return "unknown";
  if (s.$ref) return s.$ref.split("/").pop();
  if (s.anyOf || s.oneOf) {
    const parts = [...new Set((s.anyOf || s.oneOf).map((x) => ts(x, pad)))];
    return parts.length === 1 ? parts[0] : parts.map((p) => (p.includes("=>") ? `(${p})` : p)).join(" | ");
  }
  if ("const" in s) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  const type = Array.isArray(s.type) ? s.type : [s.type];
  if (type.length > 1) return type.map((t) => ts({ ...s, type: t }, pad)).join(" | ");
  switch (type[0]) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const inner = ts(s.items || {}, pad);
      return /[|&]/.test(inner) ? `Array<${inner}>` : `${inner}[]`;
    }
    case "object":
    case undefined: {
      const props = s.properties || {};
      const keys = Object.keys(props);
      const req = new Set(s.required || []);
      const ap = s.additionalProperties;
      if (keys.length === 0) {
        if (ap && typeof ap === "object") return `Record<string, ${ts(ap, pad)}>`;
        return "Record<string, unknown>";
      }
      const inner = pad + "  ";
      let out = "{\n";
      for (const k of keys) {
        const p = props[k];
        const d = p.description || (p.$ref && spec.components.schemas[p.$ref.split("/").pop()]?.description);
        out += doc(d, inner);
        out += `${inner}${ident(k)}${req.has(k) ? "" : "?"}: ${ts(p, inner)};\n`;
      }
      if (ap && typeof ap === "object" && Object.keys(ap).length) out += `${inner}[key: string]: ${ts(ap, inner)};\n`;
      return out + pad + "}";
    }
  }
  return "unknown";
};

let types = `// Generated from the justi.fun OpenAPI spec (${spec.info.title} ${spec.info.version}). Do not edit.\n// Regenerate with \`npm run gen\`.\n\n`;
for (const [name, schema] of Object.entries(spec.components.schemas)) {
  types += doc(schema.description, "");
  const t = ts(schema);
  types += t.startsWith("{") ? `export interface ${name} ${t}\n\n` : `export type ${name} = ${t};\n\n`;
}

const ops = [];
for (const [path, item] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(item)) {
    if (!["get", "post", "patch", "delete", "put"].includes(method)) continue;
    if ((op.tags || []).some((t) => SKIP_TAGS.has(t))) continue;
    const okCode = Object.keys(op.responses).find((c) => c.startsWith("2"));
    const content = op.responses[okCode]?.content || {};
    if (!content["application/json"]) continue; // images and the SSE stream have their own helpers
    const params = op.parameters || [];
    const pathParams = params.filter((p) => p.in === "path");
    const query = params.filter((p) => p.in === "query");
    const body = op.requestBody?.content?.["application/json"]?.schema;
    const sec = op.security || [];
    const auth = sec.length === 0 ? "none" : sec.some((x) => Object.keys(x).length === 0) ? "optional" : "required";
    const id = op.operationId;
    const P = pascal(id);
    const resSchema = content["application/json"].schema;
    let resType = ts(resSchema);
    if (!resSchema.$ref) {
      types += `/** Response of ${id}. */\nexport type ${P}Response = ${resType};\n\n`;
      resType = `${P}Response`;
    }
    let queryType = null;
    if (query.length) {
      queryType = `${P}Query`;
      const obj = { type: "object", properties: {}, required: [] };
      for (const q of query) {
        obj.properties[q.name] = { ...q.schema, description: q.description || q.schema?.description };
        if (q.required) obj.required.push(q.name);
      }
      // query values may also be passed as numbers where the spec wants decimal strings
      types += `/** Query parameters of ${id}. */\nexport interface ${queryType} ${ts(obj).replace(/: U64String;/g, ": U64String | number | bigint;")}\n\n`;
    }
    let bodyType = null;
    if (body) {
      if (body.$ref) bodyType = body.$ref.split("/").pop();
      else {
        bodyType = `${P}Body`;
        types += `/** Request body of ${id}. */\nexport interface ${bodyType} ${ts(body)}\n\n`;
      }
    }
    ops.push({ id, method: method.toUpperCase(), path, pathParams: pathParams.map((p) => p.name), queryType, queryRequired: query.some((q) => q.required), bodyType, resType, auth, summary: op.summary, description: op.description, rateClass: op["x-rate-class"], tag: op.tags?.[0] });
  }
}

let client = `// Generated from the justi.fun OpenAPI spec (${spec.info.title} ${spec.info.version}). Do not edit.\n// Regenerate with \`npm run gen\`.\n\nimport type * as T from "./types.js";\n\n`;
client += `export interface RequestOptions {\n  /** Abort the request. */\n  signal?: AbortSignal;\n  /** Extra headers for this call. */\n  headers?: Record<string, string>;\n}\n\n`;
client += `export type Requester = <R>(method: string, path: string, query: Record<string, unknown> | undefined, body: unknown, opts: RequestOptions | undefined) => Promise<R>;\n\n`;
client += `/** Every public operation, one method each, named by operationId. */\nexport class JustiApi {\n  protected readonly _req: Requester;\n  constructor(req: Requester) {\n    this._req = req;\n  }\n`;
for (const o of ops) {
  const args = [];
  for (const p of o.pathParams) args.push(`${p}: string`);
  if (o.bodyType) args.push(`body: T.${o.bodyType}`);
  if (o.queryType) args.push(`query${o.queryRequired ? "" : "?"}: T.${o.queryType}`);
  args.push("opts?: RequestOptions");
  let path = "`" + o.path.replace(/\{(\w+)\}/g, (_, n) => "${encodeURIComponent(" + n + ")}") + "`";
  const lines = [o.summary + "."];
  if (o.description) lines.push("", o.description);
  lines.push("", `\`${o.method} ${o.path}\`, rate class \`${o.rateClass}\`, ${o.auth === "required" ? "API key required" : o.auth === "none" ? "no auth" : "API key optional"}.`);
  client += `\n  /**\n${lines.map((l) => `   * ${l}`.trimEnd()).join("\n")}\n   */\n`;
  client += `  ${o.id}(${args.join(", ")}): Promise<T.${o.resType}> {\n`;
  client += `    return this._req<T.${o.resType}>("${o.method}", ${path}, ${o.queryType ? "query as unknown as Record<string, unknown> | undefined" : "undefined"}, ${o.bodyType ? "body" : "undefined"}, opts);\n  }\n`;
}
client += `}\n\n/** Operation index: method, path, auth and rate class per operationId. */\nexport const operations = ${JSON.stringify(Object.fromEntries(ops.map((o) => [o.id, { method: o.method, path: o.path, auth: o.auth, rateClass: o.rateClass, tag: o.tag, summary: o.summary }])), null, 2)} as const;\n\nexport type OperationId = keyof typeof operations;\n`;

mkdirSync(join(root, "src/gen"), { recursive: true });
writeFileSync(join(root, "src/gen/types.ts"), types);
writeFileSync(join(root, "src/gen/client.ts"), client);
console.log(`generated ${Object.keys(spec.components.schemas).length} schemas, ${ops.length} operations from ${spec.info.title} ${spec.info.version}`);
