#!/usr/bin/env node
/**
 * Lint Components
 * Validates that all component folders have the required files:
 * - index.scss (styles)
 * - *.api.json (API definition)
 * - *.docs.json (documentation)
 * - *.visual.spec.ts (visual regression test)
 *
 * Scans category subdirectories under 04-components/
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/04-components');

const REQUIRED_FILES = [
  { pattern: 'index.scss', description: 'styles', required: true },
  { pattern: '*.api.json', description: 'API definition', required: true },
  { pattern: '*.docs.json', description: 'documentation', required: true },
  { pattern: '*.visual.spec.ts', description: 'visual regression test', required: false },
];

function checkGlobPattern(dir, pattern) {
  if (!pattern.includes('*')) {
    return existsSync(join(dir, pattern));
  }
  const files = readdirSync(dir);
  const regex = new RegExp(`^${pattern.replace('.', '\\.').replace('*', '.*')}$`);
  return files.some((f) => regex.test(f));
}

function findComponentDirs(baseDir) {
  const components = [];
  const entries = readdirSync(baseDir).filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    return statSync(join(baseDir, name)).isDirectory();
  });

  for (const entry of entries) {
    const entryPath = join(baseDir, entry);
    // If dir has index.scss, it's a component
    if (existsSync(join(entryPath, 'index.scss'))) {
      components.push({ name: entry, path: entryPath });
    } else {
      // Category dir - scan children
      const children = readdirSync(entryPath).filter((name) => {
        if (name.startsWith('.')) return false;
        return statSync(join(entryPath, name)).isDirectory();
      });
      for (const child of children) {
        components.push({ name: child, path: join(entryPath, child) });
      }
    }
  }
  return components;
}

function lintComponents() {
  const components = findComponentDirs(COMPONENTS_DIR);
  const errors = [];
  const warnings = [];

  for (const { name, path } of components) {
    const missing = [];
    const optional = [];

    for (const { pattern, description, required } of REQUIRED_FILES) {
      if (!checkGlobPattern(path, pattern)) {
        if (required) {
          missing.push({ pattern, description });
        } else {
          optional.push({ pattern, description });
        }
      }
    }

    if (missing.length > 0) {
      errors.push({ component: name, missing });
    }
    if (optional.length > 0) {
      warnings.push({ component: name, optional });
    }
  }

  if (warnings.length > 0) {
    console.warn('Component completeness warnings:\n');
    for (const { component, optional } of warnings) {
      console.warn(`  ${component}/`);
      for (const { pattern, description } of optional) {
        console.warn(`    - missing ${pattern} (${description})`);
      }
    }
    console.warn(`\n${warnings.length} component(s) missing optional files.\n`);
  }

  if (errors.length > 0) {
    console.error('Component completeness check failed:\n');
    for (const { component, missing } of errors) {
      console.error(`  ${component}/`);
      for (const { pattern, description } of missing) {
        console.error(`    - missing ${pattern} (${description})`);
      }
    }
    console.error(`\n${errors.length} component(s) incomplete.`);
    console.error('Run: pnpm new:component <name> to scaffold new components');
    process.exit(1);
  }

  console.log(`All ${components.length} components have required files.`);
}

lintComponents();
