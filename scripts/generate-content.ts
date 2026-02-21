#!/usr/bin/env tsx
// Generates content.yml from api.json for components missing one.
// Run: pnpm generate:content
// Dry-run (check only): pnpm generate:content -- --check

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findComponentDirs } from './shared/find-components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'packages/css/src/components');
const SHARED_PATH = join(ROOT, 'packages/css/src/content/shared.yml');

const AUTO_PREFIX = '$auto';

interface ApiModifier {
  type?: 'boolean';
  values?: string[];
  visibility?: 'internal';
}

interface ApiJson {
  name: string;
  modifiers: Record<string, ApiModifier>;
}

function loadSharedKeys(): Set<string> {
  const raw = readFileSync(SHARED_PATH, 'utf-8');
  const keys = new Set<string>();
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s{2}(\w[\w-]*):/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function loadApiJson(componentPath: string): ApiJson | null {
  const apiPath = join(componentPath, 'api.json');
  if (!existsSync(apiPath)) return null;
  return JSON.parse(readFileSync(apiPath, 'utf-8'));
}

function toTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function sectionKeyFromModifier(mod: string): string {
  return mod.replace(/-/g, '_');
}

function generateContentYaml(api: ApiJson, sharedKeys: Set<string>): string {
  const lines: string[] = [];
  lines.push(`description: ${AUTO_PREFIX} ${toTitleCase(api.name)} component.`);
  lines.push('');
  lines.push('sections:');

  const modifiers = Object.entries(api.modifiers).filter(
    ([, def]) => def.visibility !== 'internal',
  );

  for (const [modName, modDef] of modifiers) {
    const key = sectionKeyFromModifier(modName);
    lines.push(`  ${key}:`);
    lines.push(`    modifier: ${modName}`);

    if (modDef.type !== 'boolean') {
      lines.push('    layout: row');
    }

    if (modName === 'variant' || modName === 'state') {
      lines.push('    include_default: true');
    }

    if (sharedKeys.has(modName)) {
      lines.push(`    description: $shared.${modName}`);
    } else {
      lines.push(`    description: ${AUTO_PREFIX} ${toTitleCase(modName)} modifier.`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function mergeExistingContent(
  existing: string,
  api: ApiJson,
  sharedKeys: Set<string>,
): { yaml: string; changed: boolean } {
  // Find modifiers already covered in existing content
  const coveredModifiers = new Set<string>();
  const modifierPattern = /^\s+modifier:\s+(.+)$/gm;
  let match = modifierPattern.exec(existing);
  while (match) {
    coveredModifiers.add(match[1].trim());
    match = modifierPattern.exec(existing);
  }

  // Find missing modifiers
  const modifiers = Object.entries(api.modifiers).filter(
    ([, def]) => def.visibility !== 'internal',
  );
  const missing = modifiers.filter(([name]) => !coveredModifiers.has(name));

  if (missing.length === 0) return { yaml: existing, changed: false };

  // Append missing sections
  const lines: string[] = [];
  let content = existing.trimEnd();

  for (const [modName, modDef] of missing) {
    const key = sectionKeyFromModifier(modName);
    lines.push('');
    lines.push(`  ${key}:`);
    lines.push(`    modifier: ${modName}`);

    if (modDef.type !== 'boolean') {
      lines.push('    layout: row');
    }

    if (modName === 'variant' || modName === 'state') {
      lines.push('    include_default: true');
    }

    if (sharedKeys.has(modName)) {
      lines.push(`    description: $shared.${modName}`);
    } else {
      lines.push(`    description: ${AUTO_PREFIX} ${toTitleCase(modName)} modifier.`);
    }
  }

  content += lines.join('\n');
  content += '\n';
  return { yaml: content, changed: true };
}

function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const verbose = args.includes('--verbose');

  const sharedKeys = loadSharedKeys();
  const components = findComponentDirs(COMPONENTS_DIR);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const stale: string[] = [];

  for (const { name, path: compPath } of components) {
    const api = loadApiJson(compPath);
    if (!api) {
      if (verbose) console.log(`  skip (no api.json): ${name}`);
      continue;
    }

    const contentPath = join(compPath, 'content.yml');
    const exists = existsSync(contentPath);

    if (!exists) {
      const yaml = generateContentYaml(api, sharedKeys);
      if (checkOnly) {
        stale.push(relative(ROOT, contentPath));
      } else {
        writeFileSync(contentPath, yaml);
        console.log(`  created: ${relative(ROOT, contentPath)}`);
        created++;
      }
    } else {
      const existing = readFileSync(contentPath, 'utf-8');
      const { yaml, changed } = mergeExistingContent(existing, api, sharedKeys);
      if (changed) {
        if (checkOnly) {
          stale.push(relative(ROOT, contentPath));
        } else {
          writeFileSync(contentPath, yaml);
          console.log(`  updated: ${relative(ROOT, contentPath)}`);
          updated++;
        }
      } else {
        unchanged++;
        if (verbose) console.log(`  unchanged: ${relative(ROOT, contentPath)}`);
      }
    }
  }

  if (checkOnly) {
    if (stale.length > 0) {
      console.error('Content files are stale:\n');
      for (const f of stale) {
        console.error(`  - ${f}`);
      }
      console.error(`\n${stale.length} file(s) need regeneration. Run: pnpm generate:content`);
      process.exit(1);
    }
    console.log(`Content sync check: ${components.length} components up to date.`);
  } else {
    console.log(
      `\nGenerated content: ${created} created, ${updated} updated, ${unchanged} unchanged.`,
    );
  }
}

main();
