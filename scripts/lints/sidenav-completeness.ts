import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { discoverComponents } from '../discover-structure.js';

export function lintSidenavCompleteness(componentsDir: string, configPath: string): void {
  let config: { groupOrder: string[] };
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to parse ${configPath}: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
  const discovered = discoverComponents(componentsDir);
  const errors: string[] = [];

  for (const id of config.groupOrder) {
    if (!discovered.has(id)) {
      errors.push(`Config references group "${id}" but no directory found on disk`);
    }
  }

  for (const id of discovered.keys()) {
    if (!config.groupOrder.includes(id)) {
      errors.push(`Group "${id}" found on disk but missing from component-groups.config.json`);
    }
  }

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
