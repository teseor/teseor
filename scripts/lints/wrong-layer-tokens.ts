import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractWrongLayerTokens } from '../shared/lint-helpers.js';

import { findScssFiles } from './_utils.js';

export function lintWrongLayerTokens(srcDir: string): void {
  const errors: string[] = [];

  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap((d) => findScssFiles(d));

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const wrongTokens = extractWrongLayerTokens(content);
    for (const { varName, index } of wrongTokens) {
      const line = content.substring(0, index).split('\n').length;
      errors.push(
        `${relPath}:${line}: ${varName} defined in styles layer — move to @layer components.tokens`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Wrong-layer token definition check failed:\n');
    const byFile = new Map<string, number>();
    for (const err of errors) {
      const file = err.split(':')[0];
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }
    for (const [file, count] of byFile) {
      console.error(`  ${file} (${count})`);
    }
    console.error(
      `\n${errors.length} token definition(s) in ${byFile.size} files. Move --_ definitions to @layer components.tokens.`,
    );
    process.exit(1);
  } else {
    console.log(`Wrong-layer tokens: ${scssFiles.length} SCSS files passed.`);
  }
}
