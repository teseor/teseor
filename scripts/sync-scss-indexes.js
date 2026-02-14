#!/usr/bin/env node
/**
 * Generate SCSS index files for 03-layout and 04-components from directory structure.
 * Run before build to keep indexes in sync with filesystem.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverComponents, discoverPrimitives } from './discover-structure.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../packages/css/src');
const LAYOUT_DIR = join(SRC_DIR, '03-layout');
const COMPONENTS_DIR = join(SRC_DIR, '04-components');

// Generate 03-layout/index.scss
const primitives = discoverPrimitives(LAYOUT_DIR);
const layoutContent = `${primitives.map((name) => `@forward './${name}';`).join('\n')}\n`;
writeFileSync(join(LAYOUT_DIR, 'index.scss'), layoutContent);
console.log(`03-layout/index.scss: ${primitives.length} primitives`);

// Generate 04-components/index.scss
const groups = discoverComponents(COMPONENTS_DIR);
const componentLines = [];
for (const [groupName, group] of groups) {
  for (const name of group.components) {
    componentLines.push(`@forward './${groupName}/${name}/index';`);
  }
}
const componentsContent = `${componentLines.join('\n')}\n`;
writeFileSync(join(COMPONENTS_DIR, 'index.scss'), componentsContent);
console.log(`04-components/index.scss: ${componentLines.length} components`);
