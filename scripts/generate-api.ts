#!/usr/bin/env tsx
// Generates *.api.json from SCSS annotations and token patterns.
// Run: pnpm generate:api
// Dry-run (check only): pnpm generate:api -- --check

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findComponentDirs } from './shared/find-components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'packages/css/src/components');
const LAYOUT_DIR = join(ROOT, 'packages/css/src/layout');

// --- Types ---

interface CssVar {
  name: string;
  default: string;
  description?: string;
}

interface Modifier {
  type?: 'boolean';
  values?: string[];
}

interface ElementDef {
  modifiers?: Record<string, Modifier>;
}

interface RelatedComponent {
  name: string;
  modifiers?: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
}

interface ApiJson {
  $schema: string;
  name: string;
  element: string;
  modifiers: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
  relatedComponents?: RelatedComponent[];
  cssVars: CssVar[];
}

// --- Balanced extraction ---

function extractBalanced(content: string, start: number, open: string, close: string): string {
  let depth = 0;
  let pos = start;
  while (pos < content.length) {
    if (content[pos] === open) depth++;
    else if (content[pos] === close) {
      depth--;
      if (depth === 0) return content.substring(start, pos + 1);
    }
    pos++;
  }
  return content.substring(start, pos);
}

// --- Default value extraction ---
// From: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}))
// Returns: "var(--ui-row-2)"
// From: var(--ui-avatar-radius, 50%)
// Returns: "50%"
// From: var(--ui-avatar-size, calc(#{t.$unit} * 5))
// Returns: "calc(var(--ui-unit) * 5)"

function extractDefault(fullExpr: string, varName: string): string {
  // Find the comma after the var name
  const prefix = `var(${varName},`;
  const idx = fullExpr.indexOf(prefix);
  if (idx === -1) return '';

  const afterComma = idx + prefix.length;
  // Extract the fallback part with balanced parens
  let depth = 1; // inside the outer var(
  let pos = afterComma;
  while (pos < fullExpr.length && depth > 0) {
    if (fullExpr[pos] === '(') depth++;
    else if (fullExpr[pos] === ')') depth--;
    if (depth > 0) pos++;
  }

  let fallback = fullExpr.substring(afterComma, pos).trim();

  // If fallback is var(--ui-X, #{t.$Y}) -> extract var(--ui-X)
  const innerVarMatch = fallback.match(/^var\((--ui-[\w-]+)/);
  if (innerVarMatch) {
    return `var(${innerVarMatch[1]})`;
  }

  // Strip SCSS fallbacks inside var() expressions: var(--ui-row, #{t.$row}) -> var(--ui-row)
  fallback = fallback.replace(/var\((--ui-[\w-]+),\s*[^)]*\)/g, 'var($1)');

  // Convert remaining SCSS interpolation #{t.$foo} -> var(--ui-foo)
  fallback = convertScssToVar(fallback);

  // If fallback is a raw SCSS ref — convert to var()
  const scssRef = fallback.match(/^#\{t\.\$([\w-]+)\}$/);
  if (scssRef) {
    return `var(--ui-${scssRef[1]})`;
  }

  return fallback;
}

// Convert SCSS interpolation #{t.$foo-bar} to var(--ui-foo-bar)
function convertScssToVar(s: string): string {
  return s.replace(/#\{t\.\$([\w-]+)\}/g, (_match, name) => `var(--ui-${name})`);
}

// --- Extract @layer block content ---

function extractLayerContent(content: string, layerName: string): string {
  const parts: string[] = [];
  let searchFrom = 0;
  while (searchFrom < content.length) {
    const idx = content.indexOf(`@layer ${layerName}`, searchFrom);
    if (idx === -1) break;
    const braceStart = content.indexOf('{', idx);
    if (braceStart === -1) break;
    const block = extractBalanced(content, braceStart, '{', '}');
    // Strip outer braces
    parts.push(block.slice(1, -1));
    searchFrom = braceStart + block.length;
  }
  return parts.join('\n');
}

// --- CSS var extraction ---

function extractCssVars(content: string, componentName: string): CssVar[] {
  const vars: CssVar[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  let pendingDesc: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for @desc annotation
    const descMatch = line.match(/\/\/\s*@desc\s+(.+)/);
    if (descMatch) {
      pendingDesc = descMatch[1].trim();
      continue;
    }

    // Match var(--ui-{componentName}-*) pattern in token declarations
    const varPattern = new RegExp(`var\\(--ui-${escapeRegex(componentName)}-([\\w-]+)`, 'g');
    for (const match of line.matchAll(varPattern)) {
      const varName = `--ui-${componentName}-${match[1]}`;
      if (seen.has(varName)) {
        pendingDesc = undefined;
        continue;
      }
      seen.add(varName);

      // Extract the full expression from this line for default parsing
      const lineContent = line.trim();
      // Find the full var(...) expression containing this token
      const fullExprStart = lineContent.indexOf(`var(${varName}`);
      if (fullExprStart === -1) {
        pendingDesc = undefined;
        continue;
      }
      const fullExpr = extractBalanced(lineContent, fullExprStart, '(', ')');
      const defaultVal = extractDefault(fullExpr, varName);

      const cssVar: CssVar = { name: varName, default: defaultVal };
      if (pendingDesc) {
        cssVar.description = pendingDesc;
      }

      vars.push(cssVar);
      pendingDesc = undefined;
    }

    // Reset desc if this line isn't blank and isn't a desc/comment
    if (pendingDesc && line.trim() !== '' && !line.trim().startsWith('//')) {
      // Only reset if we didn't consume it
      if (!line.includes(`var(--ui-${componentName}-`)) {
        pendingDesc = undefined;
      }
    }
  }

  return vars;
}

// --- Modifier extraction ---

function extractModifiers(content: string, componentName: string): Record<string, Modifier> {
  const modifiers: Record<string, Modifier> = {};
  const lines = content.split('\n');
  const escaped = escapeRegex(componentName);
  const pseudoClasses = new Set(['hover', 'focus', 'active', 'disabled']);

  let currentGroup: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // @modifier annotation — supports:
    // // @modifier size           (enum, values from class patterns)
    // // @modifier size xs, sm    (enum, explicit values)
    // // @modifier boolean icon   (boolean)
    const modAnnotation = line.match(/\/\/\s*@modifier\s+(boolean\s+)?([\w-]+)\s*(.*)/);
    if (modAnnotation) {
      const isBoolean = !!modAnnotation[1];
      const name = modAnnotation[2];
      const explicitValues = modAnnotation[3]?.trim();

      if (isBoolean) {
        modifiers[name] = { type: 'boolean' };
        currentGroup = null;
      } else {
        currentGroup = name;
        if (!modifiers[currentGroup]) {
          modifiers[currentGroup] = { values: [] };
        }
        // Parse explicit comma-separated values if provided
        if (explicitValues) {
          const values = explicitValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          if (values.length > 0) {
            modifiers[currentGroup].values = values;
            currentGroup = null; // values already set, don't scan further
          }
        }
      }
      continue;
    }

    // Class pattern: .component--value { or .component--value::pseudo {
    const classMatch = line.match(new RegExp(`\\.${escaped}--([\\w-]+)[\\s:{,]`));
    // Nested pattern: &--value { or &--value::pseudo {
    const nestedMatch = line.match(/&--([\w-]+)[\s:{,]/);

    const value = classMatch ? classMatch[1] : nestedMatch ? nestedMatch[1] : null;

    if (value && currentGroup && !pseudoClasses.has(value)) {
      const vals = modifiers[currentGroup].values;
      if (vals) {
        if (!vals.includes(value)) {
          vals.push(value);
        }
      }
    }
  }

  // Clean up empty groups
  for (const [key, mod] of Object.entries(modifiers)) {
    if (mod.values && mod.values.length === 0) {
      delete modifiers[key];
    }
  }

  return modifiers;
}

// --- Element extraction from styles layer ---

function extractElements(
  content: string,
  componentName: string,
): Record<string, ElementDef> | undefined {
  const elements: Record<string, ElementDef> = {};
  const escaped = escapeRegex(componentName);

  // Strategy 1: Direct class patterns .component__element and .component__element--mod
  const directPattern = new RegExp(`\\.${escaped}__([\\w][\\w-]*)`, 'g');
  for (const match of content.matchAll(directPattern)) {
    const rawName = match[1];
    const modSplit = rawName.match(/^([\w-]+?)--([\w-]+)$/);
    if (modSplit) {
      const [, elemName, modName] = modSplit;
      if (!elements[elemName]) elements[elemName] = {};
      if (!elements[elemName].modifiers) elements[elemName].modifiers = {};
      elements[elemName].modifiers![modName] = { type: 'boolean' };
    } else {
      if (!elements[rawName]) elements[rawName] = {};
    }
  }

  // Strategy 2: Nested SCSS &__element blocks with nested &--modifier
  const nestedElemPattern = /&__([\w][\w-]*)\s*\{/g;
  for (const match of content.matchAll(nestedElemPattern)) {
    const elemName = match[1];
    if (!elements[elemName]) elements[elemName] = {};

    // Extract the block content after this match to find &--modifier inside
    const blockStart = content.indexOf('{', match.index! + match[0].length - 1);
    if (blockStart === -1) continue;
    const block = extractBalanced(content, blockStart, '{', '}');
    const innerModPattern = /&--([\w-]+)\s*[{,]/g;
    for (const modMatch of block.matchAll(innerModPattern)) {
      const modName = modMatch[1];
      if (['hover', 'focus', 'active', 'disabled'].includes(modName)) continue;
      if (!elements[elemName].modifiers) elements[elemName].modifiers = {};
      elements[elemName].modifiers![modName] = { type: 'boolean' };
    }
  }

  if (Object.keys(elements).length === 0) return undefined;
  return elements;
}

// --- Related component extraction ---

function extractRelatedFromAnnotation(content: string): string[] {
  const names: string[] = [];
  const matches = content.matchAll(/\/\/\s*@related\s+(.+)/g);
  for (const match of matches) {
    const parts = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    names.push(...parts);
  }
  return names;
}

function extractRelatedComponents(
  content: string,
  _componentName: string,
  annotatedNames: string[],
): RelatedComponent[] | undefined {
  if (annotatedNames.length === 0) return undefined;

  const related: RelatedComponent[] = [];

  for (const relName of annotatedNames) {
    const escaped = escapeRegex(relName);

    // Extract modifiers for this related component
    const modifiers: Record<string, Modifier> = {};
    const modPattern = new RegExp(`\\.${escaped}--([\\w-]+)\\s*[{,]`, 'g');
    for (const match of content.matchAll(modPattern)) {
      const modName = match[1];
      if (['hover', 'focus', 'active', 'disabled'].includes(modName)) continue;
      modifiers[modName] = { type: 'boolean' };
    }

    // Extract elements for this related component
    const elements: Record<string, ElementDef> = {};
    const elemPattern = new RegExp(`\\.${escaped}__(\\w[\\w-]*)`, 'g');
    const elemMods = new Map<string, Record<string, Modifier>>();

    for (const match of content.matchAll(elemPattern)) {
      const rawName = match[1];
      const modSplit = rawName.match(/^([\w-]+?)--([\w-]+)$/);
      if (modSplit) {
        const [, elemName, modName] = modSplit;
        if (!elemMods.has(elemName)) elemMods.set(elemName, {});
        elemMods.get(elemName)![modName] = { type: 'boolean' };
      } else {
        if (!elements[rawName]) elements[rawName] = {};
      }
    }

    for (const [elemName, mods] of elemMods) {
      if (!elements[elemName]) elements[elemName] = {};
      if (Object.keys(mods).length > 0) {
        elements[elemName].modifiers = mods;
      }
    }

    const comp: RelatedComponent = { name: relName };
    if (Object.keys(modifiers).length > 0) comp.modifiers = modifiers;
    if (Object.keys(elements).length > 0) comp.elements = elements;

    related.push(comp);
  }

  return related.length > 0 ? related : undefined;
}

// --- Main parser ---

function parseScss(filePath: string, isLayout: boolean): ApiJson {
  const content = readFileSync(filePath, 'utf-8');
  const dir = dirname(filePath);
  const folderName = basename(dir);

  // Component name: from annotation or folder name
  const componentMatch = content.match(/\/\/\s*@component\s+([\w-]+)/);
  const name = componentMatch ? componentMatch[1] : folderName;

  // Element: from annotation or default 'div'
  const elementMatch = content.match(/\/\/\s*@element\s+(\w+)/);
  const element = elementMatch ? elementMatch[1] : 'div';

  // Determine token content based on layer structure
  let tokenContent: string;
  let stylesContent: string;

  if (isLayout) {
    // Layout: everything is in @layer primitives
    tokenContent = extractLayerContent(content, 'primitives');
    stylesContent = tokenContent; // same block for elements
  } else {
    tokenContent = extractLayerContent(content, 'components.tokens');
    stylesContent = extractLayerContent(content, 'components.styles');
  }

  // If no layer content found, fall back to full file
  if (!tokenContent) tokenContent = content;
  if (!stylesContent) stylesContent = content;

  // Modifiers: annotations from tokens/primitives layer + full file
  const fullContent = isLayout ? tokenContent : `${tokenContent}\n${stylesContent}`;
  const modifiers = extractModifiers(fullContent, name);

  // CSS vars (from token layer only)
  const cssVars = extractCssVars(tokenContent, name);

  // Elements (from styles/primitives layer)
  const elements = extractElements(isLayout ? tokenContent : stylesContent, name);

  // Related components
  const annotatedRelated = extractRelatedFromAnnotation(content);
  const relatedComponents = extractRelatedComponents(content, name, annotatedRelated);

  const api: ApiJson = {
    $schema:
      'Auto-generated from index.scss annotations. Do not edit manually — run: pnpm generate:api',
    name,
    element,
    modifiers,
    ...(elements ? { elements } : {}),
    ...(relatedComponents ? { relatedComponents } : {}),
    cssVars,
  };

  return api;
}

// --- Serialization ---

function serializeApi(api: ApiJson): string {
  // Custom serialization to match existing format:
  // - cssVars with description: keep description field
  // - cssVars without description: omit description field
  return `${JSON.stringify(api, null, 2)}\n`;
}

// --- Diff utility ---

function normalizeForComparison(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

// --- Main ---

function findAllScssFiles(): { path: string; isLayout: boolean }[] {
  const files: { path: string; isLayout: boolean }[] = [];

  // Components (nested: group/name/index.scss)
  const componentDirs = findComponentDirs(COMPONENTS_DIR);
  for (const { path } of componentDirs) {
    const scssPath = join(path, 'index.scss');
    files.push({ path: scssPath, isLayout: false });
  }

  // Layout (flat: name/index.scss)
  const layoutDirs = findComponentDirs(LAYOUT_DIR);
  for (const { path } of layoutDirs) {
    const scssPath = join(path, 'index.scss');
    files.push({ path: scssPath, isLayout: true });
  }

  return files;
}

function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const verbose = args.includes('--verbose');

  const files = findAllScssFiles();
  let generated = 0;
  let unchanged = 0;
  let updated = 0;
  const stale: string[] = [];

  for (const { path: scssPath, isLayout } of files) {
    try {
      const api = parseScss(scssPath, isLayout);
      const dir = dirname(scssPath);
      const apiPath = join(dir, `${api.name}.api.json`);

      const newContent = serializeApi(api);

      // Compare with existing
      let existing = '';
      try {
        existing = readFileSync(apiPath, 'utf-8');
      } catch {
        // File doesn't exist yet
      }

      if (
        normalizeForComparison(JSON.parse(newContent)) ===
        normalizeForComparison(JSON.parse(existing || '{}'))
      ) {
        unchanged++;
        if (verbose) {
          console.log(`  unchanged: ${relative(ROOT, apiPath)}`);
        }
      } else {
        if (checkOnly) {
          stale.push(relative(ROOT, apiPath));
        } else {
          writeFileSync(apiPath, newContent);
          updated++;
          console.log(`  updated: ${relative(ROOT, apiPath)}`);
        }
      }
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error processing ${relative(ROOT, scssPath)}: ${msg}`);
    }
  }

  if (checkOnly) {
    if (stale.length > 0) {
      console.error('api.json files are stale:\n');
      for (const f of stale) {
        console.error(`  - ${f}`);
      }
      console.error(`\n${stale.length} file(s) need regeneration. Run: pnpm generate:api`);
      process.exit(1);
    }
    console.log(`API sync check: ${generated} files up to date.`);
  } else {
    // Format generated files with biome
    if (updated > 0) {
      try {
        execSync('biome format --write "packages/css/src"', {
          encoding: 'utf-8',
          stdio: 'pipe',
          cwd: ROOT,
        });
      } catch {
        // biome format is best-effort
      }
    }
    console.log(`\nGenerated ${generated} API files (${updated} updated, ${unchanged} unchanged).`);
  }
}

// --- Helpers ---

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
