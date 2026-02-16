// Pure functions for parsing SCSS annotations and token patterns.
// Extracted from generate-api.ts for testability.

// --- Types ---

export interface CssVar {
  name: string;
  default: string;
  description?: string;
}

export interface Modifier {
  type?: 'boolean';
  values?: string[];
}

export interface ElementDef {
  modifiers?: Record<string, Modifier>;
}

export interface RelatedComponent {
  name: string;
  modifiers?: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
}

export interface ApiJson {
  $schema: string;
  name: string;
  element: string;
  modifiers: Record<string, Modifier>;
  elements?: Record<string, ElementDef>;
  relatedComponents?: RelatedComponent[];
  cssVars: CssVar[];
}

// --- Helpers ---

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Balanced extraction ---

export function extractBalanced(
  content: string,
  start: number,
  open: string,
  close: string,
): string {
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

export function extractDefault(fullExpr: string, varName: string): string {
  const prefix = `var(${varName},`;
  const idx = fullExpr.indexOf(prefix);
  if (idx === -1) return '';

  const afterComma = idx + prefix.length;
  let depth = 1;
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

  // Strip SCSS fallbacks inside var() expressions
  fallback = fallback.replace(/var\((--ui-[\w-]+),\s*[^)]*\)/g, 'var($1)');

  // Convert remaining SCSS interpolation
  fallback = convertScssToVar(fallback);

  // If fallback is a raw SCSS ref
  const scssRef = fallback.match(/^#\{t\.\$([\w-]+)\}$/);
  if (scssRef) {
    return `var(--ui-${scssRef[1]})`;
  }

  return fallback;
}

// Convert SCSS interpolation #{t.$foo-bar} to var(--ui-foo-bar)
export function convertScssToVar(s: string): string {
  return s.replace(/#\{t\.\$([\w-]+)\}/g, (_match, name) => `var(--ui-${name})`);
}

// --- Extract @layer block content ---

export function extractLayerContent(content: string, layerName: string): string {
  const parts: string[] = [];
  let searchFrom = 0;
  while (searchFrom < content.length) {
    const idx = content.indexOf(`@layer ${layerName}`, searchFrom);
    if (idx === -1) break;
    const braceStart = content.indexOf('{', idx);
    if (braceStart === -1) break;
    const block = extractBalanced(content, braceStart, '{', '}');
    parts.push(block.slice(1, -1));
    searchFrom = braceStart + block.length;
  }
  return parts.join('\n');
}

// --- CSS var extraction ---

export function extractCssVars(content: string, componentName: string): CssVar[] {
  const vars: CssVar[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  let pendingDesc: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const descMatch = line.match(/\/\/\s*@desc\s+(.+)/);
    if (descMatch) {
      pendingDesc = descMatch[1].trim();
      continue;
    }

    const varPattern = new RegExp(`var\\(--ui-${escapeRegex(componentName)}-([\\w-]+)`, 'g');
    for (const match of line.matchAll(varPattern)) {
      const varName = `--ui-${componentName}-${match[1]}`;
      if (seen.has(varName)) {
        pendingDesc = undefined;
        continue;
      }
      seen.add(varName);

      const lineContent = line.trim();
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

    if (pendingDesc && line.trim() !== '' && !line.trim().startsWith('//')) {
      if (!line.includes(`var(--ui-${componentName}-`)) {
        pendingDesc = undefined;
      }
    }
  }

  return vars;
}

// --- Modifier extraction ---

export function extractModifiers(content: string, componentName: string): Record<string, Modifier> {
  const modifiers: Record<string, Modifier> = {};
  const lines = content.split('\n');
  const escaped = escapeRegex(componentName);
  const pseudoClasses = new Set(['hover', 'focus', 'active', 'disabled']);

  let currentGroup: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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
        if (explicitValues) {
          const values = explicitValues
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          if (values.length > 0) {
            modifiers[currentGroup].values = values;
            currentGroup = null;
          }
        }
      }
      continue;
    }

    const classMatch = line.match(new RegExp(`\\.${escaped}--([\\w-]+)[\\s:{,]`));
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

  for (const [key, mod] of Object.entries(modifiers)) {
    if (mod.values && mod.values.length === 0) {
      delete modifiers[key];
    }
  }

  return modifiers;
}

// --- Element extraction ---

export function extractElements(
  content: string,
  componentName: string,
): Record<string, ElementDef> | undefined {
  const elements: Record<string, ElementDef> = {};
  const escaped = escapeRegex(componentName);

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

  const nestedElemPattern = /&__([\w][\w-]*)\s*\{/g;
  for (const match of content.matchAll(nestedElemPattern)) {
    const elemName = match[1];
    if (!elements[elemName]) elements[elemName] = {};

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

export function extractRelatedFromAnnotation(content: string): string[] {
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

export function extractRelatedComponents(
  content: string,
  _componentName: string,
  annotatedNames: string[],
): RelatedComponent[] | undefined {
  if (annotatedNames.length === 0) return undefined;

  const related: RelatedComponent[] = [];

  for (const relName of annotatedNames) {
    const escaped = escapeRegex(relName);

    const modifiers: Record<string, Modifier> = {};
    const modPattern = new RegExp(`\\.${escaped}--([\\w-]+)\\s*[{,]`, 'g');
    for (const match of content.matchAll(modPattern)) {
      const modName = match[1];
      if (['hover', 'focus', 'active', 'disabled'].includes(modName)) continue;
      modifiers[modName] = { type: 'boolean' };
    }

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

// --- Pure content parser (no file I/O) ---

export function parseScssContent(content: string, folderName: string, isLayout: boolean): ApiJson {
  const componentMatch = content.match(/\/\/\s*@component\s+([\w-]+)/);
  const name = componentMatch ? componentMatch[1] : folderName;

  const elementMatch = content.match(/\/\/\s*@element\s+(\w+)/);
  const element = elementMatch ? elementMatch[1] : 'div';

  let tokenContent: string;
  let stylesContent: string;

  if (isLayout) {
    tokenContent = extractLayerContent(content, 'primitives');
    stylesContent = tokenContent;
  } else {
    tokenContent = extractLayerContent(content, 'components.tokens');
    stylesContent = extractLayerContent(content, 'components.styles');
  }

  if (!tokenContent) tokenContent = content;
  if (!stylesContent) stylesContent = content;

  const fullContent = isLayout ? tokenContent : `${tokenContent}\n${stylesContent}`;
  const modifiers = extractModifiers(fullContent, name);
  const cssVars = extractCssVars(tokenContent, name);
  const elements = extractElements(isLayout ? tokenContent : stylesContent, name);
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

export function serializeApi(api: ApiJson): string {
  return `${JSON.stringify(api, null, 2)}\n`;
}

// --- Diff utility ---

export function normalizeForComparison(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}
