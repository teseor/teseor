#!/usr/bin/env node
/**
 * Generate Visual Specs
 * Creates missing *.visual.spec.ts files for components
 */

import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/04-components');

function generateVisualSpec(name) {
  return `import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

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

function findMissingSpecs() {
  const components = readdirSync(COMPONENTS_DIR).filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    const fullPath = join(COMPONENTS_DIR, name);
    return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'index.scss'));
  });

  const missing = [];
  for (const name of components) {
    const specPath = join(COMPONENTS_DIR, name, `${name}.visual.spec.ts`);
    if (!existsSync(specPath)) {
      missing.push(name);
    }
  }

  return missing;
}

function generateMissingSpecs(dryRun = false) {
  const missing = findMissingSpecs();

  if (missing.length === 0) {
    console.log('All components have visual specs.');
    return;
  }

  console.log(`Found ${missing.length} components without visual specs:\n`);

  for (const name of missing) {
    const specPath = join(COMPONENTS_DIR, name, `${name}.visual.spec.ts`);

    if (dryRun) {
      console.log(`  Would create: ${name}/${name}.visual.spec.ts`);
    } else {
      writeFileSync(specPath, generateVisualSpec(name));
      console.log(`  Created: ${name}/${name}.visual.spec.ts`);
    }
  }

  if (!dryRun) {
    console.log(`\nGenerated ${missing.length} visual spec files.`);
  }
}

const dryRun = process.argv.includes('--dry-run');
generateMissingSpecs(dryRun);
