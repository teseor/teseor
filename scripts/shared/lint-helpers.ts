// Pure validation functions extracted from lint-components.ts for testability.

export interface TokenVar {
  token: string;
  fallback: string;
  index: number;
}

// Extract var(--ui-*) tokens with balanced parentheses
export function extractTokenVars(content: string): TokenVar[] {
  const results: TokenVar[] = [];
  const prefix = 'var(--ui-';
  let searchFrom = 0;

  while (searchFrom < content.length) {
    const start = content.indexOf(prefix, searchFrom);
    if (start === -1) break;

    const tokenStart = start + prefix.length;
    const commaIdx = content.indexOf(',', tokenStart);
    if (commaIdx === -1) {
      searchFrom = tokenStart;
      continue;
    }
    const token = content.substring(tokenStart, commaIdx);
    if (!/^[\w-]+$/.test(token)) {
      searchFrom = tokenStart;
      continue;
    }

    let depth = 1;
    let pos = commaIdx + 1;
    while (pos < content.length && depth > 0) {
      if (content[pos] === '(') depth++;
      else if (content[pos] === ')') depth--;
      if (depth > 0) pos++;
    }
    if (depth !== 0) {
      searchFrom = tokenStart;
      continue;
    }
    const fallback = content.substring(commaIdx + 1, pos).trim();
    results.push({ token, fallback, index: start });
    searchFrom = commaIdx + 1;
  }
  return results;
}

// Check if a fallback value is a hardcoded literal instead of a SCSS reference
export function isHardcodedFallback(fallback: string): boolean {
  const trimmed = fallback.trim();
  if (trimmed.startsWith('#{')) return false;
  if (trimmed.startsWith('var(')) return false;
  if (trimmed.startsWith('$')) return false;
  if (/^[a-z-]+$/i.test(trimmed)) return false;
  if (trimmed === '0') return false;
  if (/^\d+%$/.test(trimmed)) return false;
  if (trimmed.includes('#{')) return false;
  if (/^\d/.test(trimmed)) return true;
  if (/^(rgb|hsl|oklch|lab|lch|color)\(/i.test(trimmed)) return true;
  if (/^#[0-9a-f]/i.test(trimmed)) return true;
  return false;
}
