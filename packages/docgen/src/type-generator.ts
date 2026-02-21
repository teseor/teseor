// Generates TypeScript interfaces and constants from api.json data.
// Automatically extracts shared modifier scales used by 3+ components.

import type { ApiJson, ElementDef, Modifier } from './types.js';

const LINE_WIDTH = 100;
const SHARED_SCALE_THRESHOLD = 3;

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function toCamelCase(kebab: string): string {
  const pascal = toPascalCase(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function propName(name: string): string {
  return name.includes('-') ? `'${name}'` : name;
}

function formatConstArray(declaration: string, items: string[]): string {
  const singleLine = `${declaration} [${items.join(', ')}] as const;`;
  if (singleLine.length <= LINE_WIDTH) return singleLine;

  const lines = [`${declaration} [`, ...items.map((item) => `  ${item},`), '] as const;'];
  return lines.join('\n');
}

function formatUnion(values: string[]): string {
  return values.map((v) => `'${v}'`).join(' | ');
}

// --- Shared scale detection ---

interface SharedScale {
  typeName: string;
  values: string[];
}

function findSharedScales(apis: ApiJson[]): Map<string, SharedScale> {
  // Group by (modifierName, sortedValueSet) → count
  const byGroup = new Map<string, Map<string, { values: string[]; count: number }>>();

  for (const api of apis) {
    for (const [name, mod] of Object.entries(api.modifiers)) {
      if (!mod.values || mod.values.length < 2) continue;
      const sortedKey = JSON.stringify([...mod.values].sort());

      if (!byGroup.has(name)) byGroup.set(name, new Map());
      const inner = byGroup.get(name)!;
      const existing = inner.get(sortedKey);
      if (existing) {
        existing.count++;
      } else {
        inner.set(sortedKey, { values: [...mod.values], count: 1 });
      }
    }
  }

  // For each modifier group name, pick the most common value set (if used 3+ times)
  const result = new Map<string, SharedScale>();
  for (const [name, inner] of byGroup) {
    let best: { sortedKey: string; values: string[]; count: number } | null = null;
    for (const [sortedKey, entry] of inner) {
      if (entry.count >= SHARED_SCALE_THRESHOLD && (!best || entry.count > best.count)) {
        best = { sortedKey, ...entry };
      }
    }
    if (best) {
      result.set(best.sortedKey, {
        typeName: toPascalCase(name),
        values: best.values,
      });
    }
  }

  return result;
}

// --- Code generation ---

function modifierLine(name: string, mod: Modifier, sharedScales: Map<string, SharedScale>): string {
  if (mod.type === 'boolean') {
    return `  ${propName(name)}?: boolean;`;
  }
  if (mod.values && mod.values.length > 0) {
    const sortedKey = JSON.stringify([...mod.values].sort());
    const shared = sharedScales.get(sortedKey);
    if (shared) {
      return `  ${propName(name)}?: ${shared.typeName};`;
    }
    return `  ${propName(name)}?: ${formatUnion(mod.values)};`;
  }
  return `  ${propName(name)}?: boolean;`;
}

function generateModifiersInterface(
  interfaceName: string,
  modifiers: Record<string, Modifier>,
  sharedScales: Map<string, SharedScale>,
): string {
  const entries = Object.entries(modifiers);
  if (entries.length === 0) return '';

  const lines = [`export interface ${interfaceName} {`];
  for (const [name, mod] of entries) {
    lines.push(modifierLine(name, mod, sharedScales));
  }
  lines.push('}');
  return lines.join('\n');
}

function generateElementInterfaces(
  componentPascal: string,
  elements: Record<string, ElementDef>,
  sharedScales: Map<string, SharedScale>,
): string[] {
  const blocks: string[] = [];

  for (const [elemName, elemDef] of Object.entries(elements)) {
    if (!elemDef.modifiers || Object.keys(elemDef.modifiers).length === 0) {
      continue;
    }
    const interfaceName = `${componentPascal}${toPascalCase(elemName)}Modifiers`;
    const block = generateModifiersInterface(interfaceName, elemDef.modifiers, sharedScales);
    if (block) blocks.push(block);
  }

  return blocks;
}

export function generateTypes(apis: ApiJson[]): string {
  const sorted = [...apis].sort((a, b) => a.name.localeCompare(b.name));
  const sharedScales = findSharedScales(sorted);

  const sections: string[] = [
    '// Auto-generated from api.json. Do not edit manually.',
    '// Run: pnpm generate:api',
    '',
  ];

  // Emit shared scale types
  if (sharedScales.size > 0) {
    sections.push('// --- shared modifier scales ---');
    sections.push('');
    const scalesByName = [...sharedScales.values()].sort((a, b) =>
      a.typeName.localeCompare(b.typeName),
    );
    for (const scale of scalesByName) {
      sections.push(`export type ${scale.typeName} = ${formatUnion(scale.values)};`);
    }
    sections.push('');
  }

  for (const api of sorted) {
    const pascal = toPascalCase(api.name);
    const camel = toCamelCase(api.name);
    const modEntries = Object.entries(api.modifiers);

    sections.push(`// --- ${api.name} ---`);
    sections.push('');

    const modInterface = generateModifiersInterface(
      `${pascal}Modifiers`,
      api.modifiers,
      sharedScales,
    );
    if (modInterface) {
      sections.push(modInterface);
      sections.push('');
    }

    if (modEntries.length > 0) {
      const keys = modEntries.map(([name]) => `'${name}'`);
      sections.push(formatConstArray(`export const ${camel}ModifierKeys =`, keys));
      sections.push('');
    }

    sections.push(`export const ${camel}Element = '${api.element}' as const;`);
    sections.push('');

    if (api.elements && Object.keys(api.elements).length > 0) {
      const elemNames = Object.keys(api.elements).map((n) => `'${n}'`);
      sections.push(formatConstArray(`export const ${camel}Elements =`, elemNames));
      sections.push('');

      const elemBlocks = generateElementInterfaces(pascal, api.elements, sharedScales);
      for (const block of elemBlocks) {
        sections.push(block);
        sections.push('');
      }
    }
  }

  return `${sections.join('\n').trimEnd()}\n`;
}
