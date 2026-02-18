#!/usr/bin/env tsx
// Throwaway script to rename colocated files from {name}.ext to generic names.
// Renames: {name}.api.json -> api.json, {name}.docs.html -> docs.html,
//          {name}.visual.spec.ts -> visual.spec.ts, {name}-visual.png -> visual.png
// Skips directories with multiple docs files (config/guides/).

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'packages/css/src');

function walk(dir: string): string[] {
  const dirs: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      dirs.push(full);
      dirs.push(...walk(full));
    }
  }
  return dirs;
}

function gitMv(from: string, to: string): void {
  const relFrom = relative(ROOT, from);
  const relTo = relative(ROOT, to);
  console.log(`  ${relFrom} -> ${relTo}`);
  execSync(`git mv "${from}" "${to}"`, { cwd: ROOT });
}

const allDirs = walk(SRC);
let count = 0;

for (const dir of allDirs) {
  const files = readdirSync(dir);

  // api.json
  const apiFiles = files.filter((f) => f.endsWith('.api.json'));
  if (apiFiles.length === 1 && apiFiles[0] !== 'api.json') {
    gitMv(join(dir, apiFiles[0]), join(dir, 'api.json'));
    count++;
  }

  // docs.html — skip dirs with multiple docs files
  const docsFiles = files.filter((f) => f.endsWith('.docs.html'));
  if (docsFiles.length === 1 && docsFiles[0] !== 'docs.html') {
    gitMv(join(dir, docsFiles[0]), join(dir, 'docs.html'));
    count++;
  }

  // visual.spec.ts
  const specFiles = files.filter((f) => f.endsWith('.visual.spec.ts'));
  if (specFiles.length === 1 && specFiles[0] !== 'visual.spec.ts') {
    gitMv(join(dir, specFiles[0]), join(dir, 'visual.spec.ts'));
    count++;
  }

  // *-visual.png
  const pngFiles = files.filter((f) => f.endsWith('-visual.png'));
  if (pngFiles.length === 1 && pngFiles[0] !== 'visual.png') {
    gitMv(join(dir, pngFiles[0]), join(dir, 'visual.png'));
    count++;
  }
}

console.log(`\nRenamed ${count} files.`);
