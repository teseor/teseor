import { readFileSync } from 'node:fs';

import { extractTokenVars, isHardcodedFallback } from '../shared/lint-helpers.js';

import { findScssFiles } from './_utils.js';

export function lintTokenFallbacks(srcDir: string): void {
  const scssFiles = findScssFiles(srcDir);
  const errors: string[] = [];

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');
    if (relPath.startsWith('config/')) continue;
    if (relPath.startsWith('debug/')) continue;

    const vars = extractTokenVars(content);
    for (const { token, fallback, index } of vars) {
      if (isHardcodedFallback(fallback)) {
        const line = content.substring(0, index).split('\n').length;
        errors.push(
          `${relPath}:${line}: var(--ui-${token}) has hardcoded fallback "${fallback}" — use SCSS variable reference`,
        );
      }
    }
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
