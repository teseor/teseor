import { readFileSync } from 'node:fs';
import postcssScss from 'postcss-scss';
import { findScssFiles } from './_utils.js';

const TOKEN_VAR_RE = /var\(--ui-([\w-]+)\s*,/g;

// Check if a fallback value is a hardcoded literal instead of a SCSS reference
function isHardcodedFallback(fallback: string): boolean {
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

// Extract the fallback portion from a var() expression using balanced parens
function extractFallback(value: string, startAfterComma: number): string | null {
  let depth = 1;
  let pos = startAfterComma;
  while (pos < value.length && depth > 0) {
    if (value[pos] === '(') depth++;
    else if (value[pos] === ')') depth--;
    if (depth > 0) pos++;
  }
  if (depth !== 0) return null;
  return value.substring(startAfterComma, pos).trim();
}

export function lintTokenFallbacks(srcDir: string): void {
  const scssFiles = findScssFiles(srcDir);
  const errors: string[] = [];

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');
    if (relPath.startsWith('config/')) continue;
    if (relPath.startsWith('debug/')) continue;

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;
      const value = decl.value;

      for (const match of value.matchAll(TOKEN_VAR_RE)) {
        const token = match[1];
        const commaPos = (match.index ?? 0) + match[0].length;
        const fallback = extractFallback(value, commaPos);
        if (fallback && isHardcodedFallback(fallback)) {
          errors.push(
            `${relPath}:${line}: var(--ui-${token}) has hardcoded fallback "${fallback}" — use SCSS variable reference`,
          );
        }
      }
    });
  }

  if (errors.length > 0) {
    console.error('Hardcoded token fallback check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} hardcoded fallback(s) found. Use #{t.$variable} instead of literal values.`,
    );
    process.exit(1);
  }

  console.log(`Token fallbacks: ${scssFiles.length} SCSS files passed.`);
}
