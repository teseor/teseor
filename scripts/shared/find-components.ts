import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface ComponentEntry {
  name: string;
  path: string;
  depth: number;
}

export function findComponentDirs(baseDir: string, depth = 0): ComponentEntry[] {
  const components: ComponentEntry[] = [];
  const entries = readdirSync(baseDir).filter((name) => {
    if (name.startsWith('.') || name === 'index.scss') return false;
    return statSync(join(baseDir, name)).isDirectory();
  });

  for (const entry of entries) {
    const entryPath = join(baseDir, entry);
    if (existsSync(join(entryPath, 'index.scss'))) {
      components.push({ name: entry, path: entryPath, depth });
    } else {
      components.push(...findComponentDirs(entryPath, depth + 1));
    }
  }
  return components;
}
