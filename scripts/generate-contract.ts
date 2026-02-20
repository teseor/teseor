#!/usr/bin/env tsx
// Generates TypeScript contract files from api.json annotations.
// Run: pnpm generate:contract

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Types matching api.json schema ---

interface ModifierDef {
  values?: string[];
  type?: 'boolean';
}

interface ElementDef {
  modifiers?: Record<string, ModifierDef>;
}

interface RelatedComponent {
  name: string;
  modifiers?: Record<string, ModifierDef>;
  elements?: Record<string, ElementDef>;
}

interface ApiJson {
  name: string;
  type?: string;
  modifiers?: Record<string, ModifierDef>;
  elements?: Record<string, ElementDef>;
  relatedComponents?: RelatedComponent[];
}

// --- Paths ---

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSS_SRC = join(ROOT, 'packages/css/src');
const GENERATED_DIR = join(ROOT, 'packages/contract/src/generated');

const HEADER =
  "// Auto-generated from api.json. Do not edit — run: pnpm generate:contract\nimport { cx } from '../cx';";

// --- Naming helpers ---

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function kebabToPascal(str: string): string {
  const camel = kebabToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// --- Template helpers ---

function typeAlias(pascal: string, key: string, values: string[]): string {
  const name = `${pascal}${kebabToPascal(key)}`;
  return `export type ${name} = ${values.map((v) => `'${v}'`).join(' | ')};`;
}

function propsInterface(pascal: string, modifiers: Record<string, ModifierDef>): string {
  const fields = Object.entries(modifiers).map(([key, def]) => {
    const prop = kebabToCamel(key);
    if (def.values) return `  ${prop}?: ${pascal}${kebabToPascal(key)};`;
    return `  ${prop}?: boolean;`;
  });
  return `export interface ${pascal}Props {\n${fields.join('\n')}\n}`;
}

function modifierMapping(modifiers: Record<string, ModifierDef>, indent: string): string {
  return Object.keys(modifiers)
    .map((key) => {
      const prop = kebabToCamel(key);
      const k = key === prop ? key : `'${key}'`;
      return `${indent}${k}: props.${prop},`;
    })
    .join('\n');
}

function cxCall(block: string, modifiers: Record<string, ModifierDef>, indent: string): string {
  const map = modifierMapping(modifiers, `${indent}  `);
  return [
    `${indent}if (!props) return cx('${block}');`,
    `${indent}return cx('${block}', {`,
    map,
    `${indent}});`,
  ].join('\n');
}

// --- Element generation ---

function elementTypes(componentPascal: string, elements: Record<string, ElementDef>): string {
  const sections: string[] = [];
  for (const [elName, elDef] of Object.entries(elements)) {
    if (!elDef.modifiers || Object.keys(elDef.modifiers).length === 0) continue;
    const fullPascal = `${componentPascal}${kebabToPascal(elName)}`;
    for (const [key, def] of Object.entries(elDef.modifiers)) {
      if (def.values) sections.push(typeAlias(fullPascal, key, def.values));
    }
    sections.push(propsInterface(fullPascal, elDef.modifiers));
  }
  return sections.join('\n\n');
}

function elementMethods(
  componentName: string,
  componentPascal: string,
  elements: Record<string, ElementDef>,
  indent = '    ',
): string {
  const inner = `${indent}  `;
  return Object.entries(elements)
    .map(([elName, elDef]) => {
      const fnName = kebabToCamel(elName);
      const block = `${componentName}__${elName}`;
      const hasMods = elDef.modifiers && Object.keys(elDef.modifiers).length > 0;

      if (!hasMods) return `${indent}${fnName}: (): string => cx('${block}'),`;

      const fullPascal = `${componentPascal}${kebabToPascal(elName)}`;
      return `${indent}${fnName}: (props?: ${fullPascal}Props): string => {
${cxCall(block, elDef.modifiers!, inner)}
${indent}},`;
    })
    .join('\n');
}

// --- Component generation (single block) ---

function generateBlock(
  name: string,
  modifiers: Record<string, ModifierDef> | undefined,
  elements: Record<string, ElementDef> | undefined,
  pascal: string,
  camel: string,
): string {
  const sections: string[] = [];
  const hasMods = modifiers && Object.keys(modifiers).length > 0;
  const hasEls = elements && Object.keys(elements).length > 0;

  // Type aliases for enum modifiers
  if (hasMods) {
    const aliases = Object.entries(modifiers)
      .filter(([, def]) => def.values)
      .map(([key, def]) => typeAlias(pascal, key, def.values!));
    if (aliases.length) sections.push(aliases.join('\n'));
    sections.push(propsInterface(pascal, modifiers));
  }

  // Element types
  if (hasEls) {
    const elTypes = elementTypes(pascal, elements);
    if (elTypes) sections.push(elTypes);
  }

  // Main function
  if (hasEls) {
    const elMethods = elementMethods(name, pascal, elements);
    if (hasMods) {
      const mainFn = `  (props?: ${pascal}Props): string => {\n${cxCall(name, modifiers, '    ')}\n  },`;
      sections.push(
        `export const ${camel} = Object.assign(\n${mainFn}\n  {\n${elMethods}\n  },\n);`,
      );
    } else {
      const inlinedMethods = elementMethods(name, pascal, elements, '  ');
      sections.push(
        `export const ${camel} = Object.assign((): string => cx('${name}'), {\n${inlinedMethods}\n});`,
      );
    }
  } else if (hasMods) {
    sections.push(
      `export function ${camel}(props?: ${pascal}Props): string {\n${cxCall(name, modifiers, '  ')}\n}`,
    );
  } else {
    sections.push(`export function ${camel}(): string {\n  return cx('${name}');\n}`);
  }

  return sections.join('\n\n');
}

// --- Full file generation ---

function generateComponentFile(api: ApiJson, standaloneNames: Set<string>): string {
  const sections: string[] = [HEADER];

  sections.push(
    generateBlock(
      api.name,
      api.modifiers,
      api.elements,
      kebabToPascal(api.name),
      kebabToCamel(api.name),
    ),
  );

  if (api.relatedComponents) {
    for (const rel of api.relatedComponents) {
      if (standaloneNames.has(rel.name)) continue;
      sections.push(
        generateBlock(
          rel.name,
          rel.modifiers,
          rel.elements,
          kebabToPascal(rel.name),
          kebabToCamel(rel.name),
        ),
      );
    }
  }

  return `${sections.join('\n\n')}\n`;
}

function generateIndex(fileNames: string[]): string {
  const stem = (f: string) => f.replace('.ts', '');
  const exports = fileNames
    .sort((a, b) => stem(a).localeCompare(stem(b)))
    .map((f) => `export * from './${stem(f)}';`);
  return `// Auto-generated — run: pnpm generate:contract\n${exports.join('\n')}\n`;
}

// --- File discovery ---

function findApiJsonFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name === 'api.json') files.push(fullPath);
    }
  }
  walk(CSS_SRC);
  return files.sort();
}

// --- Main ---

function main(): void {
  const apiFiles = findApiJsonFiles();
  mkdirSync(GENERATED_DIR, { recursive: true });

  // First pass: collect standalone names to skip duplicate relatedComponents
  const allApis: ApiJson[] = [];
  const standaloneNames = new Set<string>();
  let skipped = 0;

  for (const filePath of apiFiles) {
    const api: ApiJson = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (api.type === 'utility') {
      skipped++;
      continue;
    }
    allApis.push(api);
    standaloneNames.add(api.name);
  }

  // Second pass: generate files
  const generatedFiles: string[] = [];

  for (const api of allApis) {
    const fileName = `${api.name}.ts`;
    writeFileSync(join(GENERATED_DIR, fileName), generateComponentFile(api, standaloneNames));
    generatedFiles.push(fileName);
    console.log(`  generated: ${fileName}`);
  }

  writeFileSync(join(GENERATED_DIR, 'index.ts'), generateIndex(generatedFiles));

  console.log(`\nGenerated ${allApis.length} contract files (${skipped} utilities skipped).`);
}

main();
