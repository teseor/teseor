#!/usr/bin/env tsx
/**
 * Generate SCSS index files for layout and components from directory structure.
 * Run before build to keep indexes in sync with filesystem.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverComponents, discoverPrimitives } from './discover-structure.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '../packages/css/src');
const LAYOUT_DIR = join(SRC_DIR, 'layout');
const COMPONENTS_DIR = join(SRC_DIR, 'components');

// Generate layout/index.scss
const primitives: string[] = discoverPrimitives(LAYOUT_DIR);
const layoutContent = `${primitives.map((name: string) => `@forward './${name}';`).join('\n')}\n`;
writeFileSync(join(LAYOUT_DIR, 'index.scss'), layoutContent);
console.log(`layout/index.scss: ${primitives.length} primitives`);

// Generate components/index.scss
const groups = discoverComponents(COMPONENTS_DIR);
const componentLines: string[] = [];
for (const [groupName, group] of groups) {
  for (const name of group.components) {
    componentLines.push(`@forward './${groupName}/${name}/index';`);
  }
}
const componentsContent = `${componentLines.join('\n')}\n`;
writeFileSync(join(COMPONENTS_DIR, 'index.scss'), componentsContent);
console.log(`components/index.scss: ${componentLines.length} components`);
