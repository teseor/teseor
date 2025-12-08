#!/usr/bin/env node
/**
 * Sync Component Index
 * Regenerates packages/css/src/04-components/index.scss based on existing folders
 * Run after creating new components or as part of build
 */

import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/04-components');
const INDEX_PATH = join(COMPONENTS_DIR, 'index.scss');

const components = readdirSync(COMPONENTS_DIR)
  .filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    const fullPath = join(COMPONENTS_DIR, name);
    return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'index.scss'));
  })
  .sort();

const content = `${components.map((name) => `@forward './${name}/index';`).join('\n')}\n`;

writeFileSync(INDEX_PATH, content);
console.log(`Updated index.scss with ${components.length} components`);
