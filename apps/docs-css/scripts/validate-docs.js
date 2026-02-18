#!/usr/bin/env node
/**
 * Validate Docs Script
 * Checks that docs cover all modifiers defined in API
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeT, parseHtmlDocFile, renderHtmlSection } from '../lib/html-doc-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const PREFIX = 'ui-';

/**
 * Recursively find all docs files (.docs.html)
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
    } else if (entry === 'docs.html' || entry.endsWith('.docs.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract CSS classes from an HTML string
 */
function extractFromHtml(html) {
  const classes = new Set();
  const regex = /class="([^"]+)"/g;
  let match = regex.exec(html);
  while (match !== null) {
    for (const c of match[1].split(' ')) {
      const cls = c.trim();
      // Skip Nunjucks template syntax
      if (cls && !cls.includes('{%') && !cls.includes('{{')) {
        classes.add(cls);
      }
    }
    match = regex.exec(html);
  }
  return classes;
}

/**
 * Extract all CSS classes from HTML doc sections (rendered through Nunjucks)
 */
function extractClassesFromHtmlDoc(docsPath) {
  const classes = new Set();
  const { frontmatter, sections } = parseHtmlDocFile(docsPath);

  // Load API (defaults to ./api.json if not specified)
  let api = null;
  const apiRef = frontmatter.api || './api.json';
  const apiPath = join(dirname(docsPath), apiRef);
  try {
    api = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch {
    // api not found
  }

  const labels = frontmatter.labels || {};
  const t = makeT();

  for (const section of sections) {
    const rendered = renderHtmlSection(section.rawHtml, { api, labels, t });
    for (const c of extractFromHtml(rendered)) {
      classes.add(c);
    }
  }

  return classes;
}

/**
 * Get all expected CSS classes from API
 */
export function getExpectedClasses(api) {
  const classes = new Set();

  // Handle utility type (standalone classes)
  if (api.type === 'utility' && api.utilities) {
    for (const util of api.utilities) {
      classes.add(`${PREFIX}${util}`);
    }
    return classes;
  }

  const base = `${PREFIX}${api.name}`;
  classes.add(base);

  // Add block-level modifiers
  for (const [name, mod] of Object.entries(api.modifiers || {})) {
    if (mod.type === 'boolean') {
      classes.add(`${base}--${name}`);
    } else if (mod.values) {
      for (const value of mod.values) {
        classes.add(`${base}--${value}`);
      }
    }
  }

  // Add elements and their modifiers
  for (const [elementName, element] of Object.entries(api.elements || {})) {
    classes.add(`${base}__${elementName}`);
    // Element modifiers
    for (const [modName, mod] of Object.entries(element.modifiers || {})) {
      if (mod.type === 'boolean') {
        classes.add(`${base}__${elementName}--${modName}`);
      } else if (mod.values) {
        for (const value of mod.values) {
          classes.add(`${base}__${elementName}--${value}`);
        }
      }
    }
  }

  // Add sub-elements (simple string array)
  for (const name of api.subElements || []) {
    classes.add(`${base}__${name}`);
  }

  // Add related components (e.g., avatar-group for avatar)
  for (const related of api.relatedComponents || []) {
    if (typeof related === 'string') {
      classes.add(`${PREFIX}${related}`);
    } else if (related.name) {
      // Complex related component with its own modifiers/elements
      const relatedBase = `${PREFIX}${related.name}`;
      classes.add(relatedBase);
      // Related component modifiers
      for (const [modName, mod] of Object.entries(related.modifiers || {})) {
        if (mod.type === 'boolean') {
          classes.add(`${relatedBase}--${modName}`);
        } else if (mod.values) {
          for (const value of mod.values) {
            classes.add(`${relatedBase}--${value}`);
          }
        }
      }
      // Related component elements
      for (const [elemName, elem] of Object.entries(related.elements || {})) {
        classes.add(`${relatedBase}__${elemName}`);
        for (const [elemModName, elemMod] of Object.entries(elem.modifiers || {})) {
          if (elemMod.type === 'boolean') {
            classes.add(`${relatedBase}__${elemName}--${elemModName}`);
          } else if (elemMod.values) {
            for (const value of elemMod.values) {
              classes.add(`${relatedBase}__${elemName}--${value}`);
            }
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Validate a single docs file against its API
 */
function validateDoc(docsPath) {
  const { frontmatter } = parseHtmlDocFile(docsPath);

  if (frontmatter.skipValidation) {
    return { path: docsPath, skipped: true, reason: 'skipValidation flag' };
  }

  const apiRef = frontmatter.api || './api.json';
  const apiPath = join(dirname(docsPath), apiRef);
  let api;
  try {
    api = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch (err) {
    return { path: docsPath, skipped: true, reason: 'No API file found' };
  }

  const docsClasses = extractClassesFromHtmlDoc(docsPath);
  const expectedClasses = getExpectedClasses(api);

  const missing = [...expectedClasses].filter((c) => !docsClasses.has(c));

  let extra;
  if (api.type === 'utility' && api.utilities) {
    extra = [];
  } else {
    extra = [...docsClasses].filter(
      (c) => c.startsWith(`${PREFIX}${api.name}`) && !expectedClasses.has(c),
    );
  }

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
      console.log(`[SKIP] ${relativePath} (${result.reason})`);
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
    console.log('\nDocs coverage gaps found. Fix missing items above.');
    process.exit(1);
  } else {
    console.log('\nAll docs are valid!');
  }
}

// Run only when executed directly (not when imported for tests)
const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  validate();
}
