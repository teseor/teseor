import { readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs, validateGridRhythm } from '.';

const SRC_DIR = resolve(__dirname, '../src');
const SEARCH_DIRS = [join(SRC_DIR, 'components'), join(SRC_DIR, 'layout')];

// Skip grid rhythm: fluid containers, proportion-based, or known border issues
const SKIP_GRID = new Set([
  'app-shell',
  'aspect-ratio',
  'box',
  'center',
  'column',
  'data-list', // 1px borders cause off-grid heights (#179)
  'grid',
  'row',
  'sidebar-nav',
]);

function findDocsFiles(dir: string): Array<{ name: string; path: string }> {
  const results: Array<{ name: string; path: string }> = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findDocsFiles(full));
    } else if (entry === 'docs.html') {
      results.push({ name: basename(dirname(full)), path: full });
    }
  }
  return results;
}

const allDocs = SEARCH_DIRS.flatMap((d) => findDocsFiles(d));

for (const { name, path } of allDocs) {
  test.describe(`${name} visual regression`, () => {
    test('all variations', async ({ page }) => {
      await setupVisualTestFromHtmlDocs(page, path);
      if (!SKIP_GRID.has(name)) {
        await validateGridRhythm(page, name);
      }
      await saveForLostPixel(page, name);
      await expect(page.locator('body')).toHaveScreenshot(`${name}-visual.png`);
    });
  });
}
