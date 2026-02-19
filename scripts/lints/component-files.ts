import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { findComponentDirs } from '../shared/find-components.js';

interface FileCheck {
  pattern: string;
  description: string;
  required: boolean;
}

const REQUIRED_FILES: FileCheck[] = [
  { pattern: 'index.scss', description: 'styles', required: true },
  { pattern: 'api.json', description: 'API definition', required: true },
  { pattern: 'docs.html', description: 'documentation', required: true },
];

function checkGlobPattern(dir: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return existsSync(join(dir, pattern));
  }
  const files = readdirSync(dir);
  const regex = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  return files.some((f) => regex.test(f));
}

export function lintComponents(componentsDir: string): void {
  const components = findComponentDirs(componentsDir);
  const errors: { component: string; missing: { pattern: string; description: string }[] }[] = [];
  const warnings: { component: string; optional: { pattern: string; description: string }[] }[] =
    [];

  for (const { name, path } of components) {
    const missing: { pattern: string; description: string }[] = [];
    const optional: { pattern: string; description: string }[] = [];

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
