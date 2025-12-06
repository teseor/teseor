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
 * Generate test file content using docs.json sections for doc-like layout
 */
function generateTestFile(api, docsPath) {
  // Read CSS at generation time and embed in test
  const tokensCss = readFileSync(join(ROOT, 'packages/tokens/dist/index.css'), 'utf-8');
  const componentCss = readFileSync(join(ROOT, 'packages/css/dist/index.css'), 'utf-8');

  // Read docs.json for structured sections
  let docs = null;
  try {
    docs = JSON.parse(readFileSync(docsPath, 'utf-8'));
  } catch {
    // Fall back to auto-generated if no docs.json
  }

  // Escape backticks and ${} in CSS for template literal
  const escapeCss = (css) => css.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  // Title case helper
  const titleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Generate HTML sections from docs.json
  const generateSections = () => {
    if (!docs?.sections) {
      // Fallback: generate from API modifiers
      return generateVariations(api).map((v) => ({
        title: v.label,
        items: [{ classes: v.classes, text: v.label, disabled: v.disabled }],
      }));
    }
    return docs.sections;
  };

  const sections = generateSections();

  const testContent = `import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for ${api.name}
 * Auto-generated from ${api.name}.api.json and ${api.name}.docs.json
 */

const tokensCss = \`${escapeCss(tokensCss)}\`;
const componentCss = \`${escapeCss(componentCss)}\`;

const sections = ${JSON.stringify(sections, null, 2)};

test.describe('${api.name} visual regression', () => {
  test('all variations', async ({ page }) => {
    const html = \`<!DOCTYPE html>
<html>
<head>
  <style>\${tokensCss}</style>
  <style>\${componentCss}</style>
  <style>
    body {
      margin: 0;
      padding: 48px;
      background-color: #fff;
      background-image:
        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      font-family: var(--ui-font-sans);
    }
    .doc-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--ui-color-text);
    }
    .doc-description {
      font-size: 14px;
      color: var(--ui-color-text-muted);
      margin-bottom: 40px;
    }
    .doc-section {
      margin-bottom: 32px;
    }
    .doc-section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ui-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .doc-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    .doc-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 120px;
    }
    .doc-label {
      font-size: 12px;
      color: var(--ui-color-text-muted);
    }
  </style>
</head>
<body>
  <h1 class="doc-title">${titleCase(api.name)}</h1>
  <p class="doc-description">${api.description}</p>

  \${sections.map(section => \`
    <div class="doc-section">
      <h2 class="doc-section-title">\${section.title}</h2>
      \${section.examples ? section.examples.map(example => \`
        <div class="doc-row">
          \${example.items.map(item => \`
            <\${item.tag || '${api.element}'}
              class="\${item.class || ''}"
              \${item.attrs?.disabled !== undefined ? 'disabled' : ''}
            >\${item.text}</${api.element}>
          \`).join('')}
        </div>
      \`).join('') : ''}
    </div>
  \`).join('')}
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
    const docsPath = apiPath.replace('.api.json', '.docs.json');
    const testContent = generateTestFile(api, docsPath);

    const testPath = apiPath.replace('.api.json', '.visual.spec.ts');
    writeFileSync(testPath, testContent);

    console.log(`  Generated: ${relative(ROOT, testPath)}`);
  }

  console.log('\\nDone!');
}

main();
