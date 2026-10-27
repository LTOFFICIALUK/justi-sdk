// Marks dist/cjs as CommonJS so Node loads it with require().
import { writeFileSync } from "node:fs";
writeFileSync(new URL("../dist/cjs/package.json", import.meta.url), JSON.stringify({ type: "commonjs" }) + "\n");
writeFileSync(new URL("../dist/esm/package.json", import.meta.url), JSON.stringify({ type: "module" }) + "\n");
