#!/usr/bin/env node
/**
 * Lint Components
 * Validates that all component folders have the required files:
 * - index.scss (styles)
 * - *.api.json (API definition)
 * - *.docs.json (documentation)
 * - *.visual.spec.ts (visual regression test)
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

function lintComponents() {
  const components = readdirSync(COMPONENTS_DIR).filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    const fullPath = join(COMPONENTS_DIR, name);
    return statSync(fullPath).isDirectory();
  });

  const errors = [];
  const warnings = [];

  for (const component of components) {
    const componentDir = join(COMPONENTS_DIR, component);
    const missing = [];
    const optional = [];

    for (const { pattern, description, required } of REQUIRED_FILES) {
      if (!checkGlobPattern(componentDir, pattern)) {
        if (required) {
          missing.push({ pattern, description });
        } else {
          optional.push({ pattern, description });
        }
      }
    }

    if (missing.length > 0) {
      errors.push({ component, missing });
    }
    if (optional.length > 0) {
      warnings.push({ component, optional });
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
