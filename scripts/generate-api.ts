#!/usr/bin/env tsx
// Generates *.api.json from SCSS annotations and token patterns.
// Run: pnpm generate:api
// Dry-run (check only): pnpm generate:api -- --check

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findComponentDirs } from './shared/find-components.js';
import {
  type ApiJson,
  normalizeForComparison,
  parseScssContent,
  serializeApi,
} from './shared/scss-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'packages/css/src/components');
const LAYOUT_DIR = join(ROOT, 'packages/css/src/layout');

// --- Main parser (thin wrapper with file I/O) ---

function parseScss(filePath: string, isLayout: boolean): ApiJson {
  const content = readFileSync(filePath, 'utf-8');
  const dir = dirname(filePath);
  const folderName = basename(dir);
  return parseScssContent(content, folderName, isLayout);
}

// --- Main ---

function findAllScssFiles(): { path: string; isLayout: boolean }[] {
  const files: { path: string; isLayout: boolean }[] = [];

  const componentDirs = findComponentDirs(COMPONENTS_DIR);
  for (const { path } of componentDirs) {
    const scssPath = join(path, 'index.scss');
    files.push({ path: scssPath, isLayout: false });
  }

  const layoutDirs = findComponentDirs(LAYOUT_DIR);
  for (const { path } of layoutDirs) {
    const scssPath = join(path, 'index.scss');
    files.push({ path: scssPath, isLayout: true });
  }

  return files;
}

function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const verbose = args.includes('--verbose');

  const files = findAllScssFiles();
  let generated = 0;
  let unchanged = 0;
  let updated = 0;
  const stale: string[] = [];

  for (const { path: scssPath, isLayout } of files) {
    try {
      const api = parseScss(scssPath, isLayout);
      const dir = dirname(scssPath);
      const apiPath = join(dir, `${api.name}.api.json`);

      const newContent = serializeApi(api);

      let existing = '';
      try {
        existing = readFileSync(apiPath, 'utf-8');
      } catch {
        // File doesn't exist yet
      }

      if (
        normalizeForComparison(JSON.parse(newContent)) ===
        normalizeForComparison(JSON.parse(existing || '{}'))
      ) {
        unchanged++;
        if (verbose) {
          console.log(`  unchanged: ${relative(ROOT, apiPath)}`);
        }
      } else {
        if (checkOnly) {
          stale.push(relative(ROOT, apiPath));
        } else {
          writeFileSync(apiPath, newContent);
          updated++;
          console.log(`  updated: ${relative(ROOT, apiPath)}`);
        }
      }
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error processing ${relative(ROOT, scssPath)}: ${msg}`);
    }
  }

  if (checkOnly) {
    if (stale.length > 0) {
      console.error('api.json files are stale:\n');
      for (const f of stale) {
        console.error(`  - ${f}`);
      }
      console.error(`\n${stale.length} file(s) need regeneration. Run: pnpm generate:api`);
      process.exit(1);
    }
    console.log(`API sync check: ${generated} files up to date.`);
  } else {
    if (updated > 0) {
      try {
        execSync('biome format --write "packages/css/src"', {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: ROOT,
        });
      } catch {
        // biome format is best-effort
      }
    }
    console.log(`\nGenerated ${generated} API files (${updated} updated, ${unchanged} unchanged).`);
  }
}

main();
