import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function findScssFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findScssFiles(fullPath));
    } else if (entry.name.endsWith('.scss')) {
      results.push(fullPath);
    }
  }
  return results;
}
