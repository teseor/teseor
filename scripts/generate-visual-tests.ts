#!/usr/bin/env tsx
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

interface ApiModifier {
  values?: string[];
  type?: string;
}

interface ComponentApi {
  name: string;
  baseClass: string;
  element: string;
  description: string;
  modifiers?: Record<string, ApiModifier>;
}

interface Variation {
  name: string;
  classes: string[];
  label: string;
  disabled?: boolean;
}

function findApiFiles(dir: string, files: string[] = []): string[] {
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

function generateVariations(api: ComponentApi): Variation[] {
  const variations: Variation[] = [];
  const base = `${PREFIX}${api.baseClass}`;

  variations.push({ name: 'default', classes: [base], label: 'Default' });

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

  variations.push({ name: 'disabled', classes: [base], label: 'Disabled', disabled: true });

  return variations;
}

function generateTestFile(api: ComponentApi, docsPath: string): string {
  const componentCss = readFileSync(join(ROOT, 'packages/css/dist/index.css'), 'utf-8');

  let docs: { sections?: unknown[] } | null = null;
  try {
    docs = JSON.parse(readFileSync(docsPath, 'utf-8'));
  } catch {
    // Fall back to auto-generated if no docs.json
  }

  const escapeCss = (css: string): string => css.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const titleCase = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

  const generateSections = (): unknown[] => {
    if (!docs?.sections) {
      return generateVariations(api).map((v) => ({
        title: v.label,
        items: [{ classes: v.classes, text: v.label, disabled: v.disabled }],
      }));
    }
    return docs.sections;
  };

  const sections = generateSections();

  return `import { test, expect } from '@playwright/test';

const componentCss = \`${escapeCss(componentCss)}\`;

const sections = ${JSON.stringify(sections, null, 2)};

test.describe('${api.name} visual regression', () => {
  test('all variations', async ({ page }) => {
    const html = \`<!DOCTYPE html>
<html>
<head>
  <style>\${componentCss}</style>
  <style>
    body {
      margin: 0;
      padding: 48px;
      background-color: #fff;
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
    await expect(page.locator('body')).toHaveScreenshot('${api.name}-preview.png');
  });
});
`;
}

function main(): void {
  console.log('Generating visual tests from API definitions...\n');

  const apiFiles = findApiFiles(CSS_PKG);

  if (apiFiles.length === 0) {
    console.log('No .api.json files found.');
    return;
  }

  for (const apiPath of apiFiles) {
    const relativePath = relative(ROOT, apiPath);
    console.log(`Processing: ${relativePath}`);

    const api = JSON.parse(readFileSync(apiPath, 'utf-8')) as ComponentApi;
    const docsPath = apiPath.replace('.api.json', '.docs.json');
    const testContent = generateTestFile(api, docsPath);

    const testPath = apiPath.replace('.api.json', '.visual.spec.ts');
    writeFileSync(testPath, testContent);

    console.log(`  Generated: ${relative(ROOT, testPath)}`);
  }

  console.log('\nDone!');
}

main();
