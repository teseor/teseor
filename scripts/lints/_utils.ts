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

export function findDocsHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...findDocsHtmlFiles(fullPath));
    } else if (entry.name === 'docs.html' || entry.name.endsWith('.docs.html')) {
      results.push(fullPath);
    }
  }
  return results;
}
