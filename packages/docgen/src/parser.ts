// PostCSS-based SCSS parser. Replaces regex-based scripts/shared/scss-parser.ts.
// Walks the CSS AST to discover BEM selectors, CSS vars, and SCSS annotations.

import postcss, { type Comment, type Declaration, type Rule } from 'postcss';
import postcssScss from 'postcss-scss';
import { resolveDefaultValue } from './token-resolver.js';
import type { ApiJson, CssVar, ElementDef, Modifier, RelatedComponent } from './types.js';

// Block-level pseudo-classes — filtered from modifier extraction.
// Note: 'active' is excluded here because .tabs__tab--active is a real modifier.
// Element-level filtering only skips 'hover' and 'focus'.
const BLOCK_PSEUDO = new Set(['hover', 'focus', 'active', 'disabled']);
const ELEM_PSEUDO = new Set(['hover', 'focus']);

const SCHEMA =
  'Auto-generated from index.scss annotations. Do not edit manually — run: pnpm generate:api';

// --- Helpers ---

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertScssToVar(s: string): string {
  return s.replace(/#\{t\.\$([\w-]+)\}/g, (_m, name) => `--ui-${name}`);
}

// --- Annotation types ---

interface ModifierAnnotation {
  line: number;
  name: string;
  isBoolean: boolean;
  explicitValues: string[];
}

interface Annotations {
  component: string | null;
  element: string | null;
  modifiers: ModifierAnnotation[];
  relatedNames: string[];
  descsByLine: Map<number, string>;
}

// --- Step 1: Parse annotations from SCSS comments ---

function parseAnnotations(root: postcss.Root): Annotations {
  const result: Annotations = {
    component: null,
    element: null,
    modifiers: [],
    relatedNames: [],
    descsByLine: new Map(),
  };

  root.walkComments((comment: Comment) => {
    const text = comment.text.trim();
    const line = comment.source?.start?.line ?? 0;

    const componentMatch = text.match(/^@component\s+([\w-]+)/);
    if (componentMatch) {
      result.component = componentMatch[1];
      return;
    }

    const elementMatch = text.match(/^@element\s+(\w+)/);
    if (elementMatch) {
      result.element = elementMatch[1];
      return;
    }

    const modMatch = text.match(/^@modifier\s+(boolean\s+)?([\w-]+)\s*(.*)/);
    if (modMatch) {
      const isBoolean = !!modMatch[1];
      const name = modMatch[2];
      const valStr = modMatch[3]?.trim() ?? '';
      const explicitValues = valStr
        ? valStr
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      result.modifiers.push({ line, name, isBoolean, explicitValues });
      return;
    }

    const relatedMatch = text.match(/^@related\s+(.+)/);
    if (relatedMatch) {
      const names = relatedMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      result.relatedNames.push(...names);
      return;
    }

    const descMatch = text.match(/^@desc\s+(.+)/);
    if (descMatch) {
      result.descsByLine.set(line, descMatch[1].trim());
    }
  });

  return result;
}

// --- Step 2: Build modifier map ---

function buildModifiers(
  containers: postcss.Container[],
  componentName: string,
  annotations: Annotations,
): Record<string, Modifier> {
  const modifiers: Record<string, Modifier> = {};
  const booleanNames = new Set<string>();
  const pattern = new RegExp(`\\.${esc(componentName)}--(\\w[\\w-]*)`);

  // Build structure from annotations
  const groupAnnotations: { line: number; name: string }[] = [];

  for (const ann of annotations.modifiers) {
    if (ann.isBoolean) {
      modifiers[ann.name] = { type: 'boolean' };
      booleanNames.add(ann.name);
    } else if (ann.explicitValues.length > 0) {
      modifiers[ann.name] = { values: [...ann.explicitValues] };
    } else {
      modifiers[ann.name] = { values: [] };
      groupAnnotations.push({ line: ann.line, name: ann.name });
    }
  }

  // Walk selectors to discover values for groups
  for (const container of containers) {
    container.walkRules((rule: Rule) => {
      for (const sel of rule.selectors ?? [rule.selector]) {
        const match = sel.match(pattern);
        if (!match) continue;

        const value = match[1];
        if (BLOCK_PSEUDO.has(value) || booleanNames.has(value)) continue;
        if (isValueAssigned(modifiers, value)) continue;

        const ruleLine = rule.source?.start?.line ?? 0;
        const group = findGroupForLine(groupAnnotations, ruleLine);
        if (!group) continue;

        const mod = modifiers[group];
        if (mod?.values && !mod.values.includes(value)) {
          mod.values.push(value);
        }
      }
    });
  }

  // Clean up empty groups
  for (const [key, mod] of Object.entries(modifiers)) {
    if (mod.values && mod.values.length === 0) {
      delete modifiers[key];
    }
  }

  return modifiers;
}

function isValueAssigned(modifiers: Record<string, Modifier>, value: string): boolean {
  for (const mod of Object.values(modifiers)) {
    if (mod.values?.includes(value)) return true;
  }
  return false;
}

function findGroupForLine(
  annotations: { line: number; name: string }[],
  ruleLine: number,
): string | null {
  let best: { line: number; name: string } | null = null;
  for (const ann of annotations) {
    if (ann.line <= ruleLine && (!best || ann.line > best.line)) {
      best = ann;
    }
  }
  return best?.name ?? null;
}

// --- Step 3: Extract BEM elements ---

function buildElements(
  containers: postcss.Container[],
  componentName: string,
): Record<string, ElementDef> | undefined {
  const elements: Record<string, ElementDef> = {};
  const elemRe = new RegExp(`\\.${esc(componentName)}__(\\w[\\w-]*)`, 'g');

  for (const container of containers) {
    container.walkRules((rule: Rule) => {
      for (const sel of rule.selectors ?? [rule.selector]) {
        // Find ALL element references in selector.
        // In compound selectors like `.tabs__list > .tabs__tab`,
        // nested &--modifier belongs to the LAST element (the subject).
        const allMatches = [...sel.matchAll(elemRe)];

        if (allMatches.length > 0) {
          for (const m of allMatches) {
            const rawName = m[1];
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

          // Nested modifiers belong to the last (subject) element
          const lastRaw = allMatches[allMatches.length - 1][1];
          if (!lastRaw.includes('--')) {
            collectNestedMods(rule, elements, lastRaw);
          }
          continue;
        }

        const nestedElem = sel.match(/&__([\w][\w-]*)/);
        if (nestedElem) {
          const elemName = nestedElem[1];
          if (!elements[elemName]) elements[elemName] = {};
          collectNestedMods(rule, elements, elemName);
        }
      }
    });
  }

  return Object.keys(elements).length > 0 ? elements : undefined;
}

function collectNestedMods(
  rule: Rule,
  elements: Record<string, ElementDef>,
  elemName: string,
): void {
  rule.walkRules((nested: Rule) => {
    for (const sel of nested.selectors ?? [nested.selector]) {
      const modMatch = sel.match(/&--([\w-]+)/);
      if (modMatch && !ELEM_PSEUDO.has(modMatch[1])) {
        if (!elements[elemName].modifiers) elements[elemName].modifiers = {};
        elements[elemName].modifiers![modMatch[1]] = { type: 'boolean' };
      }
    }
  });
}

// --- Step 4: Extract CSS custom properties ---

function buildCssVars(
  containers: postcss.Container[],
  componentName: string,
  descsByLine: Map<number, string>,
  tokenMap?: Map<string, string>,
): CssVar[] {
  const vars: CssVar[] = [];
  const seen = new Set<string>();
  const prefix = `--ui-${componentName}-`;
  const varPattern = new RegExp(`var\\(${esc(prefix)}([\\w-]+)`, 'g');

  for (const container of containers) {
    container.walkDecls((decl: Declaration) => {
      for (const match of decl.value.matchAll(varPattern)) {
        const varName = `${prefix}${match[1]}`;
        if (seen.has(varName)) continue;
        seen.add(varName);

        const defaultVal = extractDefault(decl.value, varName);
        const cssVar: CssVar = { name: varName, default: defaultVal };

        if (tokenMap) {
          const resolved = resolveDefaultValue(defaultVal, tokenMap);
          if (resolved) cssVar.defaultValue = resolved;
        }

        const descLine = (decl.source?.start?.line ?? 0) - 1;
        const desc = descsByLine.get(descLine);
        if (desc) cssVar.description = desc;

        vars.push(cssVar);
      }
    });
  }

  return vars;
}

function extractDefault(fullExpr: string, varName: string): string {
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

  const innerVarMatch = fallback.match(/^var\((--ui-[\w-]+)/);
  if (innerVarMatch) return innerVarMatch[1];

  fallback = fallback.replace(/var\((--ui-[\w-]+),\s*[^)]*\)/g, '$1');
  fallback = convertScssToVar(fallback);

  const scssRef = fallback.match(/^#\{t\.\$([\w-]+)\}$/);
  if (scssRef) return `--ui-${scssRef[1]}`;

  return fallback;
}

// --- Step 5: Extract related components ---

function buildRelatedComponents(
  containers: postcss.Container[],
  names: string[],
): RelatedComponent[] | undefined {
  if (names.length === 0) return undefined;

  const related: RelatedComponent[] = [];

  for (const relName of names) {
    const escaped = esc(relName);
    const modifiers: Record<string, Modifier> = {};
    const elements: Record<string, ElementDef> = {};
    const elemMods = new Map<string, Record<string, Modifier>>();

    const modPattern = new RegExp(`\\.${escaped}--([\\w-]+)`);
    const elemPattern = new RegExp(`\\.${escaped}__(\\w[\\w-]*)`);

    for (const container of containers) {
      container.walkRules((rule: Rule) => {
        for (const sel of rule.selectors ?? [rule.selector]) {
          const modMatch = sel.match(modPattern);
          if (modMatch && !BLOCK_PSEUDO.has(modMatch[1])) {
            modifiers[modMatch[1]] = { type: 'boolean' };
          }

          const elemMatch = sel.match(elemPattern);
          if (elemMatch) {
            const rawName = elemMatch[1];
            // .related__elem--mod -> split into element + modifier
            const modSplit = rawName.match(/^([\w-]+?)--([\w-]+)$/);
            if (modSplit) {
              const [, elemName, modName] = modSplit;
              if (!elements[elemName]) elements[elemName] = {};
              if (!elemMods.has(elemName)) elemMods.set(elemName, {});
              elemMods.get(elemName)![modName] = { type: 'boolean' };
            } else if (!rawName.includes('--')) {
              if (!elements[rawName]) elements[rawName] = {};
            }
          }
        }

        // Nested &--modifier inside .related__elem blocks
        const elemBlockMatch = rule.selector.match(new RegExp(`\\.${escaped}__(\\w[\\w-]*)\\s*$`));
        if (elemBlockMatch && !elemBlockMatch[1].includes('--')) {
          const en = elemBlockMatch[1];
          if (!elements[en]) elements[en] = {};
          rule.walkRules((nested: Rule) => {
            const nestedMod = nested.selector.match(/&--([\w-]+)/);
            if (nestedMod && !BLOCK_PSEUDO.has(nestedMod[1])) {
              if (!elemMods.has(en)) elemMods.set(en, {});
              elemMods.get(en)![nestedMod[1]] = { type: 'boolean' };
            }
          });
        }
      });
    }

    for (const [elemName, mods] of elemMods) {
      if (!elements[elemName]) elements[elemName] = {};
      if (Object.keys(mods).length > 0) elements[elemName].modifiers = mods;
    }

    const comp: RelatedComponent = { name: relName };
    if (Object.keys(modifiers).length > 0) comp.modifiers = modifiers;
    if (Object.keys(elements).length > 0) comp.elements = elements;
    related.push(comp);
  }

  return related.length > 0 ? related : undefined;
}

// --- Step 6: Find @layer containers ---

function findLayers(root: postcss.Root, layerName: string): postcss.Container[] {
  const layers: postcss.Container[] = [];
  root.walkAtRules('layer', (atRule) => {
    if (atRule.params === layerName) layers.push(atRule);
  });
  return layers;
}

// --- Main entry point ---

export function parseScssContent(
  content: string,
  folderName: string,
  isLayout: boolean,
  tokenMap?: Map<string, string>,
): ApiJson {
  const root = postcss().process(content, { syntax: postcssScss }).root;
  const annotations = parseAnnotations(root);

  const name = annotations.component ?? folderName;
  const element = annotations.element ?? 'div';

  const tokenLayers = isLayout
    ? findLayers(root, 'primitives')
    : findLayers(root, 'components.tokens');
  const styleLayers = isLayout ? tokenLayers : findLayers(root, 'components.styles');

  const tokens = tokenLayers.length > 0 ? tokenLayers : [root];
  const styles = styleLayers.length > 0 ? styleLayers : [root];
  const all = isLayout ? tokens : [...tokens, ...styles];

  const elementsResult = buildElements(isLayout ? tokens : styles, name);
  const relatedResult = buildRelatedComponents(all, annotations.relatedNames);

  return {
    $schema: SCHEMA,
    name,
    element,
    modifiers: buildModifiers(all, name, annotations),
    ...(elementsResult ? { elements: elementsResult } : {}),
    ...(relatedResult ? { relatedComponents: relatedResult } : {}),
    cssVars: buildCssVars(tokens, name, annotations.descsByLine, tokenMap),
  };
}

export function serializeApi(api: ApiJson): string {
  return `${JSON.stringify(api, null, 2)}\n`;
}

export function normalizeForComparison(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}
