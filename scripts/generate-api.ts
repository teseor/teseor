#!/usr/bin/env tsx
// Generates *.api.json + types/generated.ts from SCSS via PostCSS AST parser.
// Run: pnpm generate:api
// Dry-run (check only): pnpm generate:api -- --check

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type ApiJson,
  buildTokenMap,
  clearUnmappedTokens,
  generateTypes,
  getUnmappedTokens,
  normalizeForComparison,
  parseScssContent,
  serializeApi,
} from '@teseor/docgen';
import { findComponentDirs } from './shared/find-components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'packages/css/src/components');
const LAYOUT_DIR = join(ROOT, 'packages/css/src/layout');
const VARIABLES_PATH = join(ROOT, 'packages/css/src/config/tokens/_variables.scss');
const TYPES_PATH = join(ROOT, 'packages/css/src/types/generated.ts');

function loadTokenMap(): Map<string, string> {
  const content = readFileSync(VARIABLES_PATH, 'utf-8');
  return buildTokenMap(content);
}

function parseScss(filePath: string, isLayout: boolean, tokenMap: Map<string, string>): ApiJson {
  const content = readFileSync(filePath, 'utf-8');
  const dir = dirname(filePath);
  const folderName = basename(dir);
  return parseScssContent(content, folderName, isLayout, tokenMap);
}

function findAllScssFiles(): { path: string; isLayout: boolean }[] {
  const files: { path: string; isLayout: boolean }[] = [];

  for (const { path } of findComponentDirs(COMPONENTS_DIR)) {
    files.push({ path: join(path, 'index.scss'), isLayout: false });
  }

  for (const { path } of findComponentDirs(LAYOUT_DIR)) {
    files.push({ path: join(path, 'index.scss'), isLayout: true });
  }

  return files;
}

function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const verbose = args.includes('--verbose');

  const tokenMap = loadTokenMap();
  const files = findAllScssFiles();
  const allApis: ApiJson[] = [];
  let generated = 0;
  let unchanged = 0;
  let updated = 0;
  const stale: string[] = [];

  for (const { path: scssPath, isLayout } of files) {
    try {
      const api = parseScss(scssPath, isLayout, tokenMap);
      allApis.push(api);
      const dir = dirname(scssPath);
      const apiPath = join(dir, 'api.json');

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

  // Generate TypeScript types
  const typesContent = generateTypes(allApis);
  let existingTypes = '';
  try {
    existingTypes = readFileSync(TYPES_PATH, 'utf-8');
  } catch {
    // File doesn't exist yet
  }

  const typesChanged = typesContent !== existingTypes;
  if (typesChanged) {
    if (checkOnly) {
      stale.push(relative(ROOT, TYPES_PATH));
    } else {
      writeFileSync(TYPES_PATH, typesContent);
      console.log(`  updated: ${relative(ROOT, TYPES_PATH)}`);
    }
  }

  // Report unmapped tokens so new entries can be added to TOKEN_TYPE_MAP
  const unmapped = getUnmappedTokens();
  if (unmapped.length > 0) {
    console.warn(`\nWarning: ${unmapped.length} token(s) have no type mapping (assigned "other"):`);
    for (const t of unmapped) {
      console.warn(`  - ${t}`);
    }
    console.warn('Add entries to TOKEN_TYPE_MAP in packages/docgen/src/parser.ts');
  }
  clearUnmappedTokens();

  if (checkOnly) {
    if (stale.length > 0) {
      console.error('Generated files are stale:\n');
      for (const f of stale) {
        console.error(`  - ${f}`);
      }
      console.error(`\n${stale.length} file(s) need regeneration. Run: pnpm generate:api`);
      process.exit(1);
    }
    console.log(`API sync check: ${generated} files + types up to date.`);
  } else {
    console.log(
      `\nGenerated ${generated} API files (${updated} updated, ${unchanged} unchanged)${typesChanged ? ' + types' : ''}.`,
    );
  }
}

main();
