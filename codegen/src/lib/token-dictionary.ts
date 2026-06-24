import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TOKENS_PATH = resolve(REPO_ROOT, "specs", "_tokens.yaml");

export type TokenDictionary = {
  /** Canonical short-form names (`bg`, `pad-x`, `radius`, …). */
  canonical: Set<string>;
  /** Longhand → canonical map (`background → bg`, `borderRadius → radius`). */
  synonyms: Map<string, string>;
};

type RawShape = {
  tokens?: Record<string, { description?: string }>;
  synonyms?: Record<string, string>;
};

let cached: TokenDictionary | null = null;

export async function loadTokenDictionary(): Promise<TokenDictionary> {
  if (cached) return cached;
  const text = await readFile(TOKENS_PATH, "utf8");
  const raw = parseYaml(text) as RawShape;
  cached = {
    canonical: new Set(Object.keys(raw.tokens ?? {})),
    synonyms: new Map(Object.entries(raw.synonyms ?? {})),
  };
  return cached;
}
