import { readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from '@playwright/test';
import { setupVisualTestFromApi, validateGridRhythm } from '.';

const COMPONENTS_DIR = resolve(__dirname, '../src/components');

// Known grid rhythm issues tracked in separate issues
const SKIP_COMPONENTS = [
  'data-list', // 1px borders cause off-grid heights (#179)
  'spinner', // CSS var resolution issue (#154)
  'spacer', // no intrinsic height by design
];

function findApiFiles(dir: string): Array<{ name: string; path: string }> {
  const results: Array<{ name: string; path: string }> = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findApiFiles(full));
    } else if (entry.endsWith('.api.json')) {
      results.push({ name: basename(dirname(full)), path: full });
    }
  }
  return results;
}

const apiFiles = findApiFiles(COMPONENTS_DIR);

for (const { name, path } of apiFiles) {
  test(`${name} aligns to vertical grid`, async ({ page }) => {
    test.skip(SKIP_COMPONENTS.includes(name), `${name} has known grid issues`);
    await setupVisualTestFromApi(page, path);
    await validateGridRhythm(page, name);
  });
}
