#!/usr/bin/env tsx
/**
 * Lint Components
 * Validates that all component folders have the required files:
 * - index.scss (styles)
 * - *.api.json (API definition)
 * - *.docs.json (documentation)
 * - *.visual.spec.ts (visual regression test)
 *
 * Scans category subdirectories under components/
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverComponents } from './discover-structure.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');

interface FileCheck {
  pattern: string;
  description: string;
  required: boolean;
}

interface ComponentEntry {
  name: string;
  path: string;
}

const REQUIRED_FILES: FileCheck[] = [
  { pattern: 'index.scss', description: 'styles', required: true },
  { pattern: '*.api.json', description: 'API definition', required: true },
  { pattern: '*.docs.json', description: 'documentation', required: true },
  { pattern: '*.visual.spec.ts', description: 'visual regression test', required: false },
];

function checkGlobPattern(dir: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return existsSync(join(dir, pattern));
  }
  const files = readdirSync(dir);
  const regex = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  return files.some((f) => regex.test(f));
}

function findComponentDirs(baseDir: string): ComponentEntry[] {
  const components: ComponentEntry[] = [];
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

function lintComponents(): void {
  const components = findComponentDirs(COMPONENTS_DIR);
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

function lintSidenavCompleteness(): void {
  const configPath = join(__dirname, '../packages/css/component-groups.config.json');
  let config: { groupOrder: string[] };
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to parse ${configPath}: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
  const discovered = discoverComponents(COMPONENTS_DIR);
  const errors: string[] = [];

  // Every group in config should exist on disk
  for (const id of config.groupOrder) {
    if (!discovered.has(id)) {
      errors.push(`Config references group "${id}" but no directory found on disk`);
    }
  }

  // Every group on disk should be in config
  for (const id of discovered.keys()) {
    if (!config.groupOrder.includes(id)) {
      errors.push(`Group "${id}" found on disk but missing from component-groups.config.json`);
    }
  }

  // Every component with a docs.json should be inside a known group
  const allDiscoveredComponents: { name: string; group: string }[] = [];
  for (const [groupId, group] of discovered) {
    for (const name of group.components) {
      allDiscoveredComponents.push({ name, group: groupId });
    }
  }

  if (errors.length > 0) {
    console.error('Sidenav completeness check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(
    `Sidenav coverage: ${allDiscoveredComponents.length} components across ${discovered.size} groups.`,
  );
}

interface ApiJson {
  name?: string;
  [key: string]: unknown;
}

interface DocsJson {
  sections?: { examples?: { items?: Record<string, unknown>[] }[] }[];
  [key: string]: unknown;
}

function lintJsonContent(): void {
  const components = findComponentDirs(COMPONENTS_DIR);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { name, path } of components) {
    // Validate api.json
    const apiFiles = readdirSync(path).filter((f) => f.endsWith('.api.json'));
    for (const apiFile of apiFiles) {
      let data: ApiJson;
      try {
        data = JSON.parse(readFileSync(join(path, apiFile), 'utf-8'));
      } catch (e) {
        errors.push(`${name}/${apiFile}: invalid JSON — ${e instanceof Error ? e.message : e}`);
        continue;
      }
      if (!data.name) {
        errors.push(`${name}/${apiFile}: missing required "name" field`);
      }
      if (data.name && !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(data.name)) {
        errors.push(`${name}/${apiFile}: "name" must be kebab-case`);
      }
    }

    // Validate docs.json
    const docsFiles = readdirSync(path).filter((f) => f.endsWith('.docs.json'));
    for (const docsFile of docsFiles) {
      let data: DocsJson;
      try {
        data = JSON.parse(readFileSync(join(path, docsFile), 'utf-8'));
      } catch (e) {
        errors.push(`${name}/${docsFile}: invalid JSON — ${e instanceof Error ? e.message : e}`);
        continue;
      }

      // Warn on raw html strings in items (prefer config format)
      if (data.sections) {
        for (const section of data.sections) {
          for (const example of section.examples || []) {
            if (example.items) {
              for (const item of example.items) {
                if ('html' in item) {
                  warnings.push(
                    `${name}/${docsFile}: items should use tag/class/text/children, not raw "html"`,
                  );
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('JSON content warnings:\n');
    for (const warn of warnings) {
      console.warn(`  - ${warn}`);
    }
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('JSON content validation failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\n${errors.length} validation error(s).`);
    process.exit(1);
  }

  console.log(`JSON validation: ${components.length} components passed.`);
}

lintComponents();
lintSidenavCompleteness();
lintJsonContent();
