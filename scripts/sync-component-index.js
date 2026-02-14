#!/usr/bin/env node
/**
 * Sync Component Index
 * Regenerates packages/css/src/04-components/index.scss based on existing folders
 * Supports category subdirectories (e.g., actions/button, forms/input)
 */

import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/04-components');
const INDEX_PATH = join(COMPONENTS_DIR, 'index.scss');

function findComponents(baseDir) {
  const components = [];
  const entries = readdirSync(baseDir)
    .filter((name) => {
      if (name.startsWith('.') || name === 'index.scss') return false;
      return statSync(join(baseDir, name)).isDirectory();
    })
    .sort();

  for (const entry of entries) {
    const entryPath = join(baseDir, entry);
    if (existsSync(join(entryPath, 'index.scss'))) {
      // Direct component
      components.push(relative(baseDir, entryPath));
    } else {
      // Category dir - scan children
      const children = readdirSync(entryPath)
        .filter((name) => {
          if (name.startsWith('.')) return false;
          const childPath = join(entryPath, name);
          return statSync(childPath).isDirectory() && existsSync(join(childPath, 'index.scss'));
        })
        .sort();
      for (const child of children) {
        components.push(relative(baseDir, join(entryPath, child)));
      }
    }
  }
  return components;
}

const components = findComponents(COMPONENTS_DIR);
const content = `${components.map((name) => `@forward './${name}/index';`).join('\n')}\n`;

writeFileSync(INDEX_PATH, content);
console.log(`Updated index.scss with ${components.length} components`);
