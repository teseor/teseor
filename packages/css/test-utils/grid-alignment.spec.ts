import { readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { test } from '@playwright/test';
import { generateHtmlFromHtmlDoc, loadHtmlDoc, setupVisualTest, validateGridRhythm } from '.';

const COMPONENTS_DIR = resolve(__dirname, '../src/components');

// Known grid rhythm issues tracked in separate issues
const SKIP_COMPONENTS = [
  'data-list', // 1px borders cause off-grid heights (#179)
  'spinner', // CSS var resolution issue (#154)
  'spacer', // no intrinsic height by design
];

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

const docsFiles = findDocsFiles(COMPONENTS_DIR);

for (const { name, path } of docsFiles) {
  test(`${name} aligns to vertical grid`, async ({ page }) => {
    test.skip(SKIP_COMPONENTS.includes(name), `${name} has known grid issues`);
    const doc = loadHtmlDoc(path);
    const apiRef = doc.frontmatter.api ? String(doc.frontmatter.api) : './api.json';
    const apiPath = resolve(join(path, '..'), apiRef);
    const html = generateHtmlFromHtmlDoc(doc, apiPath);
    await setupVisualTest(page, { html });
    await validateGridRhythm(page, name);
  });
}
