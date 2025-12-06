#!/usr/bin/env node
/**
 * Validate Docs Script
 * Checks that docs cover all modifiers defined in API
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const PREFIX = 'ui-';

/**
 * Recursively find all .docs.json files
 */
function findDocsFiles(dir, files = []) {
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
      findDocsFiles(fullPath, files);
    } else if (entry.endsWith('.docs.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract all CSS classes from docs examples
 */
function extractClassesFromDocs(doc) {
  const classes = new Set();

  function extractFromItem(item) {
    if (item.class) {
      for (const c of item.class.split(' ')) {
        classes.add(c.trim());
      }
    }
    if (item.children) {
      for (const child of item.children) {
        extractFromItem(child);
      }
    }
  }

  for (const section of doc.sections || []) {
    for (const example of section.examples || []) {
      if (example.items) {
        for (const item of example.items) {
          extractFromItem(item);
        }
      }
    }
  }

  return classes;
}

/**
 * Get all expected CSS classes from API
 */
function getExpectedClasses(api) {
  const classes = new Set();
  const base = `${PREFIX}${api.baseClass}`;
  classes.add(base);

  for (const [name, mod] of Object.entries(api.modifiers || {})) {
    if (mod.type === 'boolean') {
      classes.add(`${base}--${name}`);
    } else if (mod.values) {
      for (const value of mod.values) {
        classes.add(`${base}--${value}`);
      }
    }
  }

  return classes;
}

/**
 * Validate a single docs file against its API
 */
function validateDoc(docsPath) {
  const doc = JSON.parse(readFileSync(docsPath, 'utf-8'));

  if (!doc.api) {
    return { path: docsPath, skipped: true, reason: 'No API reference' };
  }

  const apiPath = join(dirname(docsPath), doc.api);
  let api;
  try {
    api = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch (err) {
    return { path: docsPath, error: `Cannot read API file: ${doc.api}` };
  }

  const docsClasses = extractClassesFromDocs(doc);
  const expectedClasses = getExpectedClasses(api);

  const missing = [...expectedClasses].filter((c) => !docsClasses.has(c));
  const extra = [...docsClasses].filter(
    (c) => c.startsWith(`${PREFIX}${api.baseClass}`) && !expectedClasses.has(c),
  );

  return {
    path: docsPath,
    component: api.name,
    missing,
    extra,
    valid: missing.length === 0 && extra.length === 0,
  };
}

/**
 * Main validation function
 */
function validate() {
  console.log('Validating docs against API definitions...\n');

  const packagesDir = join(ROOT, 'packages');
  const docsFiles = findDocsFiles(packagesDir);

  let hasErrors = false;
  let validated = 0;
  let skipped = 0;

  for (const file of docsFiles) {
    const result = validateDoc(file);
    const relativePath = relative(ROOT, file);

    if (result.skipped) {
      skipped++;
      continue;
    }

    if (result.error) {
      console.log(`[ERROR] ${relativePath}`);
      console.log(`  ${result.error}\n`);
      hasErrors = true;
      continue;
    }

    validated++;

    if (!result.valid) {
      hasErrors = true;
      console.log(`[WARN] ${relativePath}`);

      if (result.missing.length > 0) {
        console.log('  Missing in docs:');
        for (const c of result.missing) {
          console.log(`    - ${c}`);
        }
      }

      if (result.extra.length > 0) {
        console.log('  Not in API (may be intentional):');
        for (const c of result.extra) {
          console.log(`    - ${c}`);
        }
      }

      console.log('');
    } else {
      console.log(`[OK] ${relativePath}`);
    }
  }

  console.log(`\nValidated: ${validated}, Skipped: ${skipped}`);

  if (hasErrors) {
    console.log('\nSome docs have coverage issues.');
    process.exit(1);
  } else {
    console.log('\nAll docs are valid!');
  }
}

validate();
