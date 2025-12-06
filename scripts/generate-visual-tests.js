#!/usr/bin/env node
/**
 * Generate Visual Tests
 * Creates Playwright visual test files from component API definitions
 * Tests load CSS directly without needing a dev server
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSS_PKG = join(ROOT, 'packages/css/src');
const PREFIX = 'ui-';

/**
 * Find all api.json files
 */
function findApiFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (
      stat.isDirectory() &&
      !entry.startsWith('.') &&
      entry !== 'node_modules' &&
      entry !== 'dist'
    ) {
      findApiFiles(fullPath, files);
    } else if (entry.endsWith('.api.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Generate all modifier combinations from API
 */
function generateVariations(api) {
  const variations = [];
  const base = `${PREFIX}${api.baseClass}`;

  // Default state
  variations.push({ name: 'default', classes: [base], label: 'Default' });

  // Each enum modifier value
  for (const [modName, mod] of Object.entries(api.modifiers || {})) {
    if (mod.values) {
      for (const value of mod.values) {
        variations.push({
          name: value,
          classes: [base, `${base}--${value}`],
          label: value,
        });
      }
    } else if (mod.type === 'boolean') {
      variations.push({
        name: modName,
        classes: [base, `${base}--${modName}`],
        label: modName,
      });
    }
  }

  // Disabled state
  variations.push({ name: 'disabled', classes: [base], label: 'Disabled', disabled: true });

  return variations;
}

/**
 * Generate test file content - single snapshot with all variations
 * CSS is embedded at generation time (no runtime file reads)
 */
function generateTestFile(api) {
  const variations = generateVariations(api);

  // Read CSS at generation time and embed in test
  const tokensCss = readFileSync(join(ROOT, 'packages/tokens/dist/index.css'), 'utf-8');
  const componentCss = readFileSync(join(ROOT, 'packages/css/dist/index.css'), 'utf-8');

  // Escape backticks and ${} in CSS for template literal
  const escapeCss = (css) => css.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  const testContent = `import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for ${api.name}
 * Auto-generated from ${api.name}.api.json
 */

const tokensCss = \`${escapeCss(tokensCss)}\`;
const componentCss = \`${escapeCss(componentCss)}\`;

test.describe('${api.name} visual regression', () => {
  test('all variations', async ({ page }) => {
    const variations = ${JSON.stringify(variations, null, 6)};

    const html = \`<!DOCTYPE html>
<html>
<head>
  <style>\${tokensCss}</style>
  <style>\${componentCss}</style>
</head>
<body style="margin: 0; padding: 48px; background: #fff;">
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 32px;">
    \${variations.map(v => \`
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
        <span style="font-size: 12px; color: #666;">\${v.label}</span>
        <${api.element} class="\${v.classes.join(' ')}" \${v.disabled ? 'disabled' : ''}>\${v.label}</${api.element}>
      </div>
    \`).join('')}
  </div>
</body>
</html>\`;

    await page.setContent(html);
    await expect(page.locator('body')).toHaveScreenshot('${api.name}-all-variations.png');
  });
});
`;

  return testContent;
}

/**
 * Main function
 */
function main() {
  console.log('Generating visual tests from API definitions...\\n');

  const apiFiles = findApiFiles(CSS_PKG);

  if (apiFiles.length === 0) {
    console.log('No .api.json files found.');
    return;
  }

  for (const apiPath of apiFiles) {
    const relativePath = relative(ROOT, apiPath);
    console.log(`Processing: ${relativePath}`);

    const api = JSON.parse(readFileSync(apiPath, 'utf-8'));
    const testContent = generateTestFile(api);

    const testPath = apiPath.replace('.api.json', '.visual.spec.ts');
    writeFileSync(testPath, testContent);

    console.log(`  Generated: ${relative(ROOT, testPath)}`);
  }

  console.log('\\nDone!');
}

main();
