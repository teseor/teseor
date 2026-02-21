import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcssScss from 'postcss-scss';

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

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    root.walkDecls(/^--ui-/, (decl) => {
      const tokenName = decl.prop.replace('--ui-', '');
      if (!findCategoryPrefix(tokenName)) {
        const line = decl.source?.start?.line ?? 0;
        errors.push(
          `${relPath}:${line}: --ui-${tokenName} has unknown category prefix — add to token-dictionary.ts`,
        );
      }
    });
  }

  // 2. Check for banned legacy prefixes across all SCSS
  const appFiles = existsSync(appsDir) ? findScssFiles(appsDir) : [];
  const allFiles = [...findScssFiles(srcDir), ...appFiles];

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;

      // Check --ui-* in prop and value
      const combined = `${decl.prop} ${decl.value}`;
      const cssVarPattern = /--ui-([\w-]+)/g;
      for (const match of combined.matchAll(cssVarPattern)) {
        const hit = findBannedPrefix(match[1]);
        if (hit) {
          errors.push(
            `${relPath}:${line}: "--ui-${hit.banned}-*" is banned — use --ui-${hit.replacement}-*`,
          );
        }
      }

      // Check $scss-variable references in value
      const scssVarPattern = /\$([\w-]+)/g;
      for (const match of decl.value.matchAll(scssVarPattern)) {
        const hit = findBannedPrefix(match[1]);
        if (hit) {
          errors.push(
            `${relPath}:${line}: "$${hit.banned}-*" is banned — use $${hit.replacement}-*`,
          );
        }
      }
    });
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
