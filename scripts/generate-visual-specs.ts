#!/usr/bin/env tsx
/**
 * Generate Visual Specs
 * Creates missing *.visual.spec.ts files for components
 * Supports category subdirectories (e.g., actions/button)
 */

import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type ComponentEntry, findComponentDirs } from './shared/find-components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');

function generateVisualSpec(name: string, depth: number): string {
  const testingImport = `${'../'.repeat(depth + 1)}testing`;
  return `import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '${testingImport}';

const DOCS_PATH = resolve(__dirname, '${name}.docs.json');

test.describe('${name} visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, '${name}');
    await saveForLostPixel(page, '${name}');
    await expect(page.locator('body')).toHaveScreenshot('${name}.visual.png');
  });
});
`;
}

function findMissingSpecs(): ComponentEntry[] {
  const components = findComponentDirs(COMPONENTS_DIR);
  return components.filter(({ name, path }) => !existsSync(join(path, `${name}.visual.spec.ts`)));
}

function generateMissingSpecs(dryRun = false): void {
  const missing = findMissingSpecs();

  if (missing.length === 0) {
    console.log('All components have visual specs.');
    return;
  }

  console.log(`Found ${missing.length} components without visual specs:\n`);

  for (const { name, path, depth } of missing) {
    const specPath = join(path, `${name}.visual.spec.ts`);
    const relPath = relative(COMPONENTS_DIR, specPath);

    if (dryRun) {
      console.log(`  Would create: ${relPath}`);
    } else {
      writeFileSync(specPath, generateVisualSpec(name, depth));
      console.log(`  Created: ${relPath}`);
    }
  }

  if (!dryRun) {
    console.log(`\nGenerated ${missing.length} visual spec files.`);
  }
}

const dryRun = process.argv.includes('--dry-run');
generateMissingSpecs(dryRun);
