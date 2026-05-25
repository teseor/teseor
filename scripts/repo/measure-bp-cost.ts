#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { brotliCompressSync } from "node:zlib";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const COMPONENTS_DIR = resolve(REPO_ROOT, "packages/css/dist/components");

// Strip `@media (--<bp>) { ... }` blocks (balanced-brace match) so the
// brotli delta between "with breakpoints" and "without" is the share of
// compressed bytes attributable to per-breakpoint emission.
function stripBreakpointBlocks(text: string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    const next = text.indexOf("@media (--", i);
    if (next < 0) {
      parts.push(text.slice(i));
      break;
    }
    parts.push(text.slice(i, next));
    const openBrace = text.indexOf("{", next);
    if (openBrace < 0) {
      parts.push(text.slice(next));
      break;
    }
    let depth = 1;
    let j = openBrace + 1;
    while (j < text.length && depth > 0) {
      const ch = text[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      j++;
    }
    i = j;
  }
  return parts.join("");
}

function brotliSize(text: string): number {
  return brotliCompressSync(Buffer.from(text, "utf8")).byteLength;
}

type Row = { name: string; brotli: number; bpShare: number; bpPct: number };

function main(): void {
  const files = readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith(".css"))
    .sort();
  const rows: Row[] = [];
  for (const file of files) {
    const path = resolve(COMPONENTS_DIR, file);
    const text = readFileSync(path, "utf8");
    const stripped = stripBreakpointBlocks(text);
    const full = brotliSize(text);
    const minus = brotliSize(stripped);
    const delta = full - minus;
    rows.push({
      name: `@teseor/css/components/${file}`,
      brotli: full,
      bpShare: delta,
      bpPct: full === 0 ? 0 : Math.round((delta / full) * 1000) / 10,
    });
  }
  console.log(JSON.stringify(rows));
}

main();
