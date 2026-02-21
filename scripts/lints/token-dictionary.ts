import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BANNED_PREFIXES, TOKEN_DICTIONARY } from '../shared/token-dictionary.js';

import { findScssFiles } from './_utils.js';

// Sort prefixes longest-first for greedy matching
const SORTED_PREFIXES = TOKEN_DICTIONARY.map((c) => c.prefix).sort((a, b) => b.length - a.length);

export function findCategoryPrefix(tokenName: string): string | undefined {
  return SORTED_PREFIXES.find((p) => tokenName === p || tokenName.startsWith(`${p}-`));
}

export function findBannedPrefix(
  name: string,
): { banned: string; replacement: string } | undefined {
  for (const [banned, replacement] of Object.entries(BANNED_PREFIXES)) {
    if (name === banned || name.startsWith(`${banned}-`)) {
      return { banned, replacement };
    }
  }
  return undefined;
}

export function lintTokenDictionary(srcDir: string, appsDir: string): void {
  const errors: string[] = [];
  const rootDir = join(srcDir, '../..');
  const tokensDir = join(srcDir, 'config/tokens');

  // 1. Validate --ui-* definitions in config/tokens/ against dictionary
  for (const file of findScssFiles(tokensDir)) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');
    const defPattern = /--ui-([\w-]+)\s*:/g;

    for (let match = defPattern.exec(content); match !== null; match = defPattern.exec(content)) {
      const tokenName = match[1];
      if (!findCategoryPrefix(tokenName)) {
        const line = content.substring(0, match.index).split('\n').length;
        errors.push(
          `${relPath}:${line}: --ui-${tokenName} has unknown category prefix — add to token-dictionary.ts`,
        );
      }
    }
  }

  // 2. Check for banned legacy prefixes across all SCSS
  const appFiles = existsSync(appsDir) ? findScssFiles(appsDir) : [];
  const allFiles = [...findScssFiles(srcDir), ...appFiles];

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');

    // Check --ui-* references and definitions
    const cssVarPattern = /--ui-([\w-]+)/g;
    for (
      let match = cssVarPattern.exec(content);
      match !== null;
      match = cssVarPattern.exec(content)
    ) {
      const hit = findBannedPrefix(match[1]);
      if (hit) {
        const line = content.substring(0, match.index).split('\n').length;
        errors.push(
          `${relPath}:${line}: "--ui-${hit.banned}-*" is banned — use --ui-${hit.replacement}-*`,
        );
      }
    }

    // Check $scss-variable references
    const scssVarPattern = /\$([\w-]+)/g;
    for (
      let match = scssVarPattern.exec(content);
      match !== null;
      match = scssVarPattern.exec(content)
    ) {
      const hit = findBannedPrefix(match[1]);
      if (hit) {
        const line = content.substring(0, match.index).split('\n').length;
        errors.push(`${relPath}:${line}: "$${hit.banned}-*" is banned — use $${hit.replacement}-*`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Token dictionary validation failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} token dictionary error(s). See scripts/shared/token-dictionary.ts for allowed categories.`,
    );
    process.exit(1);
  }

  console.log(`Token dictionary: ${allFiles.length} SCSS files passed.`);
}
