#!/usr/bin/env node
/**
 * Generate Visual Specs
 * Creates missing *.visual.spec.ts files for components
 * Supports category subdirectories (e.g., actions/button)
 */

import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');

function generateVisualSpec(name, depth) {
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

function findComponentDirs(baseDir, depth = 0) {
  const components = [];
  const entries = readdirSync(baseDir).filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    return statSync(join(baseDir, name)).isDirectory();
  });

  for (const entry of entries) {
    const entryPath = join(baseDir, entry);
    if (existsSync(join(entryPath, 'index.scss'))) {
      components.push({ name: entry, path: entryPath, depth });
    } else {
      components.push(...findComponentDirs(entryPath, depth + 1));
    }
  }
  return components;
}

function findMissingSpecs() {
  const components = findComponentDirs(COMPONENTS_DIR);
  return components.filter(({ name, path }) => !existsSync(join(path, `${name}.visual.spec.ts`)));
}

function generateMissingSpecs(dryRun = false) {
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
