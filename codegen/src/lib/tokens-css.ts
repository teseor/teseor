import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TOKENS_CSS = resolve(REPO_ROOT, "packages", "css", "src", "tokens.css");

let cached: Set<string> | null = null;

/** Set of every `--t-*` custom-property name declared in `tokens.css`. */
export async function loadTokensCss(): Promise<Set<string>> {
  if (cached) return cached;
  const text = await readFile(TOKENS_CSS, "utf8");
  const set = new Set<string>();
  for (const match of text.matchAll(/(--t-[A-Za-z0-9_-]+)\s*:/g)) {
    if (match[1] !== undefined) set.add(match[1]);
  }
  cached = set;
  return cached;
}
