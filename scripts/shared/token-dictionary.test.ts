import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { findBannedPrefix, findCategoryPrefix } from '../lints/token-dictionary.js';

import { BANNED_PREFIXES, TOKEN_DICTIONARY } from './token-dictionary.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '../../packages/css/src/config/tokens');

function findScssFiles(dir: string): string[] {
  const { readdirSync } = require('node:fs');
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findScssFiles(fullPath));
    } else if (entry.name.endsWith('.scss')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('TOKEN_DICTIONARY', () => {
  it('has no duplicate prefixes', () => {
    const prefixes = TOKEN_DICTIONARY.map((c) => c.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it('every entry has a non-empty prefix and description', () => {
    for (const cat of TOKEN_DICTIONARY) {
      expect(cat.prefix).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });

  it('scales arrays have no duplicates when present', () => {
    for (const cat of TOKEN_DICTIONARY) {
      if (cat.scales) {
        expect(new Set(cat.scales).size).toBe(cat.scales.length);
      }
    }
  });
});

describe('BANNED_PREFIXES', () => {
  it('every banned prefix maps to a dictionary category', () => {
    const prefixes = new Set(TOKEN_DICTIONARY.map((c) => c.prefix));
    for (const replacement of Object.values(BANNED_PREFIXES)) {
      expect(prefixes.has(replacement)).toBe(true);
    }
  });

  it('no banned prefix overlaps with a valid dictionary prefix', () => {
    const prefixes = new Set(TOKEN_DICTIONARY.map((c) => c.prefix));
    for (const banned of Object.keys(BANNED_PREFIXES)) {
      expect(prefixes.has(banned)).toBe(false);
    }
  });
});

describe('findCategoryPrefix', () => {
  it('matches exact prefix', () => {
    expect(findCategoryPrefix('unit')).toBe('unit');
    expect(findCategoryPrefix('color')).toBe('color');
  });

  it('matches prefix with suffix', () => {
    expect(findCategoryPrefix('color-primary')).toBe('color');
    expect(findCategoryPrefix('font-weight-bold')).toBe('font-weight');
    expect(findCategoryPrefix('z-index-modal')).toBe('z-index');
  });

  it('uses longest matching prefix (font-weight over font)', () => {
    expect(findCategoryPrefix('font-weight-bold')).toBe('font-weight');
    expect(findCategoryPrefix('font-size-lg')).toBe('font-size');
    expect(findCategoryPrefix('font-sans')).toBe('font');
  });

  it('uses longest matching prefix (body-sm over body)', () => {
    expect(findCategoryPrefix('body-sm-size')).toBe('body-sm');
    expect(findCategoryPrefix('body-weight')).toBe('body');
  });

  it('returns undefined for unknown prefixes', () => {
    expect(findCategoryPrefix('unknown-token')).toBeUndefined();
    expect(findCategoryPrefix('foo')).toBeUndefined();
  });
});

describe('findBannedPrefix', () => {
  it('detects banned CSS var names', () => {
    const hit = findBannedPrefix('weight-bold');
    expect(hit).toEqual({ banned: 'weight', replacement: 'font-weight' });
  });

  it('detects banned SCSS var names', () => {
    const hit = findBannedPrefix('leading-sm');
    expect(hit).toEqual({ banned: 'leading', replacement: 'line-height' });
  });

  it('detects tracking -> letter-spacing', () => {
    const hit = findBannedPrefix('tracking-caps');
    expect(hit).toEqual({ banned: 'tracking', replacement: 'letter-spacing' });
  });

  it('returns undefined for valid names', () => {
    expect(findBannedPrefix('font-weight-bold')).toBeUndefined();
    expect(findBannedPrefix('color-primary')).toBeUndefined();
  });
});

describe('dictionary completeness', () => {
  it('every --ui-* definition in config/tokens/ matches a dictionary category', () => {
    const unmatchedTokens: string[] = [];

    for (const file of findScssFiles(TOKENS_DIR)) {
      const content = readFileSync(file, 'utf-8');
      const relPath = file.replace(`${TOKENS_DIR}/`, '');
      const defPattern = /--ui-([\w-]+)\s*:/g;

      for (let match = defPattern.exec(content); match !== null; match = defPattern.exec(content)) {
        const tokenName = match[1];
        if (!findCategoryPrefix(tokenName)) {
          unmatchedTokens.push(`${relPath}: --ui-${tokenName}`);
        }
      }
    }

    expect(unmatchedTokens).toEqual([]);
  });
});
