import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VARIABLES_PATH = join(__dirname, '../../../packages/tokens/src/_variables.scss');

/**
 * Parse _variables.scss and extract token values
 * @returns {Map<string, string>} Map of token name to value (e.g., "row-2" -> "2rem")
 */
export function parseTokens() {
  const content = readFileSync(VARIABLES_PATH, 'utf-8');
  const tokens = new Map();

  // Match: $token-name: value; or $token-name: value; // comment
  const pattern = /^\$([a-z0-9-]+):\s*([^;]+);/gm;

  for (const match of content.matchAll(pattern)) {
    const name = match[1];
    const value = match[2].trim();
    tokens.set(name, value);
  }

  return tokens;
}

/**
 * Resolve a default token reference to its value
 * @param {string} defaultVal - Token reference like "--row-2" or "transparent"
 * @param {Map<string, string>} tokens - Token map from parseTokens()
 * @returns {string} Resolved value or "-" if not found
 */
export function resolveToken(defaultVal, tokens) {
  // Literal values (transparent, calc, etc.)
  if (!defaultVal.startsWith('--')) {
    return defaultVal;
  }

  // Token reference: --row-2 -> row-2 -> lookup
  const tokenName = defaultVal.slice(2);
  return tokens.get(tokenName) || '-';
}
