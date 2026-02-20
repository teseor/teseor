import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractBareTokenVars } from '../shared/lint-helpers.js';

import { findScssFiles } from './_utils.js';

export function lintBareTokenVars(srcDir: string): void {
  const errors: string[] = [];
  const componentScssFiles = findScssFiles(join(srcDir, 'components'));

  for (const file of componentScssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const bareVars = extractBareTokenVars(content);
    for (const { token, index } of bareVars) {
      const line = content.substring(0, index).split('\n').length;
      errors.push(
        `${relPath}:${line}: var(--ui-${token}) has no fallback — add SCSS variable reference e.g. var(--ui-${token}, #{t.$...})`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Bare token variable check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} bare token var(s) found in components. Every var(--ui-*) in components must have a fallback.`,
    );
    process.exit(1);
  }

  console.log(`Bare token vars: ${componentScssFiles.length} component SCSS files passed.`);
}
