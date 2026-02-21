// Ensures scripts import workspace packages by name, not relative paths.
// Prevents: import { foo } from '../../packages/docgen/src/index.js'
// Correct:  import { foo } from '@teseor/docgen'

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CROSS_PACKAGE_IMPORT = /^\s*import\s.*from\s+['"]\.\.\/.*packages\//;

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      results.push(...collectTsFiles(p));
    } else if (p.endsWith('.ts') || p.endsWith('.js')) {
      results.push(p);
    }
  }
  return results;
}

export function lintPackageBoundaries(scriptsDir: string): void {
  const files = collectTsFiles(scriptsDir);
  const errors: string[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (CROSS_PACKAGE_IMPORT.test(lines[i])) {
        const rel = relative(process.cwd(), filePath);
        errors.push(`  ${rel}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`Package boundaries: ${errors.length} cross-package relative import(s):`);
    for (const error of errors) {
      console.error(error);
    }
    console.error('\nUse workspace package names instead (e.g., @teseor/docgen).');
    process.exit(1);
  }

  console.log(`Package boundaries: ${files.length} script files passed.`);
}
