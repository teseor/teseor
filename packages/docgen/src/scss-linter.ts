// AST-based SCSS lint rules for component files.
// Pure functions: take PostCSS Root, return diagnostics.

import type { Comment, Declaration, Root } from 'postcss';
import postcss from 'postcss';
import postcssScss from 'postcss-scss';

export interface Diagnostic {
  line: number;
  message: string;
}

// --- Helpers ---

function findLayerContainers(root: Root, layerName: string): Root['nodes'] {
  const containers: Root['nodes'] = [];
  root.walkAtRules('layer', (rule) => {
    if (rule.params === layerName) {
      if (rule.nodes) containers.push(...rule.nodes);
    }
  });
  return containers;
}

// --- Parse helpers ---

export function parseScss(content: string): Root {
  return postcss().process(content, { syntax: postcssScss, from: undefined }).root;
}

// --- Rule: @component required ---

export function requireComponentAnnotation(root: Root): Diagnostic[] {
  let found = false;
  root.walkComments((comment: Comment) => {
    if (comment.text.trim().match(/^@component\s+[\w-]+/)) {
      found = true;
    }
  });
  if (!found) {
    return [{ line: 1, message: 'missing @component annotation' }];
  }
  return [];
}

// --- Rule: @element required ---

export function requireElementAnnotation(root: Root): Diagnostic[] {
  let found = false;
  root.walkComments((comment: Comment) => {
    if (comment.text.trim().match(/^@element\s+\w+/)) {
      found = true;
    }
  });
  if (!found) {
    return [{ line: 1, message: 'missing @element annotation' }];
  }
  return [];
}

// --- Rule: @desc required on public token declarations ---
// @desc documents the PUBLIC API token (--ui-component-*), not the internal var (--_).
// Only required when a --_ var introduces a --ui-{component}-* token.
// Internal-only vars (global aliases, derived values, constants) don't need @desc.

function hasComponentToken(value: string, componentName: string): boolean {
  const uiRefs = [...value.matchAll(/--ui-([\w-]+)/g)];
  return uiRefs.some(([, name]) => name.startsWith(`${componentName}-`));
}

export function requireDescOnVars(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  const descLines = new Set<number>();
  root.walkComments((comment: Comment) => {
    const text = comment.text.trim();
    if (text.match(/^@desc\s+.+/)) {
      descLines.add(comment.source?.start?.line ?? 0);
    }
  });

  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (!decl.prop.startsWith('--_')) return;

      // Only require @desc when the value introduces a public --ui-{component}-* token
      if (!componentName || !hasComponentToken(decl.value, componentName)) return;

      // Skip modifier overrides and compound selectors
      const parentRule = decl.parent;
      if (parentRule?.type === 'rule' && 'selector' in parentRule) {
        const sel = String(parentRule.selector).trim();
        if (
          sel.includes('--') ||
          sel.includes('>') ||
          sel.includes(' ') ||
          sel.includes('+') ||
          sel.includes('~')
        )
          return;
      }

      const declLine = decl.source?.start?.line ?? 0;
      if (!descLines.has(declLine - 1)) {
        diagnostics.push({
          line: declLine,
          message: `${decl.prop} missing @desc for public token in value`,
        });
      }
    });
  }

  return diagnostics;
}

// --- Rule: no global aliases in tokens layer ---
// Every --_ var in components.tokens must introduce a component-scoped public token
// or be a derived/computed value. Global aliases belong in the styles layer directly.

export function noGlobalAliases(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (!decl.prop.startsWith('--_')) return;

      // Skip modifier overrides and compound selectors
      const parentRule = decl.parent;
      if (parentRule?.type === 'rule' && 'selector' in parentRule) {
        const sel = String(parentRule.selector).trim();
        if (
          sel.includes('--') ||
          sel.includes('>') ||
          sel.includes(' ') ||
          sel.includes('+') ||
          sel.includes('~')
        )
          return;
      }

      // Derived/computed values are fine (no --ui- reference, or only --_ references)
      const uiRefs = [...decl.value.matchAll(/--ui-([\w-]+)/g)];
      if (uiRefs.length === 0) return;

      // Check if ANY --ui- reference is component-scoped
      const hasCompToken = uiRefs.some(([, name]) =>
        componentName ? name.startsWith(`${componentName}-`) : false,
      );

      if (!hasCompToken) {
        diagnostics.push({
          line: decl.source?.start?.line ?? 0,
          message: `${decl.prop} is a global alias — use var(--ui-${componentName}-*, ...) or move to styles layer`,
        });
      }
    });
  }

  return diagnostics;
}

// --- Rule: --ui-* tokens must be scoped to current @component ---
// Global tokens (--ui-space-*, --ui-color-*, etc.) are fine.
// Component tokens must use --ui-{componentName}-*.
// Flags: wrong component prefix, missing component name (--ui--X), malformed names.

// Known global token prefixes (sorted longest-first for matching)
const GLOBAL_TOKEN_PREFIXES = [
  'border-width',
  'body',
  'body-sm',
  'caption',
  'color',
  'container',
  'ctx',
  'duration',
  'ease',
  'eyebrow',
  'focus-ring',
  'font',
  'font-size',
  'font-weight',
  'heading',
  'icon-size',
  'icon-stroke',
  'lead',
  'letter-spacing',
  'line-height',
  'opacity',
  'overlay',
  'radius',
  'row',
  'scale',
  'shadow',
  'size',
  'slider',
  'space',
  'stripe',
  'unit',
  'viewport',
  'z-index',
];

function isGlobalToken(tokenName: string): boolean {
  return GLOBAL_TOKEN_PREFIXES.some(
    (prefix) => tokenName === prefix || tokenName.startsWith(`${prefix}-`),
  );
}

export function requireTokenScope(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (!decl.prop.startsWith('--_')) return;

      const uiRefs = [...decl.value.matchAll(/--ui-([\w-]+)/g)];
      for (const [fullMatch, tokenName] of uiRefs) {
        // Malformed: --ui- followed by nothing or double dash
        if (!tokenName || tokenName.startsWith('-')) {
          diagnostics.push({
            line: decl.source?.start?.line ?? 0,
            message: `${fullMatch} is malformed — missing component or category name`,
          });
          continue;
        }

        // Global token — fine
        if (isGlobalToken(tokenName)) continue;

        // Component token — must start with componentName-
        if (!componentName || !tokenName.startsWith(`${componentName}-`)) {
          diagnostics.push({
            line: decl.source?.start?.line ?? 0,
            message: `--ui-${tokenName} is not scoped to @component ${componentName} — expected --ui-${componentName}-*`,
          });
        }
      }
    });
  }

  return diagnostics;
}

// --- Rule: @modifier before modifier groups ---

export function requireModifierAnnotations(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Collect @modifier annotation lines and names
  const modifierAnnotations = new Map<number, string>();
  root.walkComments((comment: Comment) => {
    const text = comment.text.trim();
    const match = text.match(/^@modifier\s+(boolean\s+)?([\w-]+)/);
    if (match) {
      const line = comment.source?.start?.line ?? 0;
      modifierAnnotations.set(line, match[2]);
    }
  });

  // Find component name from @component annotation
  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  // Find all modifier selectors (BEM --modifier pattern)
  const modPattern = new RegExp(`\\.${componentName}--(\\w[\\w-]*)`);
  const seenModifiers = new Set<string>();
  const firstModifierLine = new Map<string, number>();

  root.walkRules((rule) => {
    for (const selector of rule.selectors) {
      const match = selector.match(modPattern);
      if (!match) continue;

      const modValue = match[1];
      // Skip pseudo-class-like names
      if (['hover', 'focus', 'active', 'disabled', 'focus-visible'].includes(modValue)) continue;

      if (!seenModifiers.has(modValue)) {
        seenModifiers.add(modValue);
        const line = rule.source?.start?.line ?? 0;
        firstModifierLine.set(modValue, line);
      }
    }
  });

  // Group modifier values by checking if any @modifier annotation covers them
  // An annotation on line N covers modifiers that appear after it (until next annotation)
  const annotationLines = [...modifierAnnotations.keys()].sort((a, b) => a - b);

  for (const [modValue, line] of firstModifierLine) {
    // Check if any @modifier annotation appears before this selector
    const coveredByAnnotation = annotationLines.some((annLine) => {
      return annLine < line;
    });

    if (!coveredByAnnotation) {
      diagnostics.push({
        line,
        message: `modifier class .${componentName}--${modValue} has no preceding @modifier annotation`,
      });
    }
  }

  return diagnostics;
}

// --- Rule: no derived vars in tokens layer ---
// Every --_ var must define its own value via public token or literal.
// Referencing var(--_other) creates hidden coupling and breaks token independence.

export function noDerivedVars(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (!decl.prop.startsWith('--_')) return;

      // Check if value references another --_ var
      if (/var\(--_/.test(decl.value)) {
        diagnostics.push({
          line: decl.source?.start?.line ?? 0,
          message: `${decl.prop} references another internal var — each --_ must have its own --ui-component-* token`,
        });
      }
    });
  }

  return diagnostics;
}

// --- Rule: SCSS fallback required in three-tier tokens ---
// The innermost fallback of a three-tier token must use #{...} SCSS interpolation.
// This ensures compile-time resolution and proper variable reference.

// CSS keyword/literal that's a valid final fallback without SCSS interpolation
const LITERAL_FALLBACK_PATTERN =
  /^var\(--ui-[\w-]+,\s*(0|transparent|currentcolor|inherit|auto|none|cover|contain|underline|initial|unset|"\S+"|\d+%?)(\s*\))*\s*\)?$/i;

function hasLiteralFallback(value: string): boolean {
  return LITERAL_FALLBACK_PATTERN.test(value.trim());
}

export function requireScssFallback(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (!decl.prop.startsWith('--_')) return;

      // Only check vars that introduce public component tokens (three-tier pattern)
      if (!componentName || !hasComponentToken(decl.value, componentName)) return;

      // Skip bare literal overrides (modifier resets)
      if (/^(0|transparent|auto|none|inherit|initial|unset)$/.test(decl.value.trim())) return;

      // Skip two-tier patterns with CSS keyword/literal fallback (no design token equivalent)
      if (hasLiteralFallback(decl.value)) return;

      // Must contain #{...} SCSS interpolation as final fallback
      if (!decl.value.includes('#{')) {
        diagnostics.push({
          line: decl.source?.start?.line ?? 0,
          message: `${decl.prop} missing SCSS fallback (#{t.$...}) — last tier must reference SCSS variable`,
        });
      }
    });
  }

  return diagnostics;
}

// --- Rule: no SCSS variables in styles layer ---
// @layer components.styles must not contain #{...} SCSS interpolation.
// All values must come through --_ internal vars or --ui-* CSS custom properties.

export function noScssInStyles(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const stylesNodes = findLayerContainers(root, 'components.styles');
  for (const node of stylesNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      if (decl.value.includes('#{')) {
        diagnostics.push({
          line: decl.source?.start?.line ?? 0,
          message: `${decl.prop} contains SCSS interpolation in styles layer — use --_ var from tokens layer instead`,
        });
      }
    });
  }

  return diagnostics;
}

// --- Run all rules ---

export function lintScss(root: Root): Diagnostic[] {
  return [
    ...requireComponentAnnotation(root),
    ...requireElementAnnotation(root),
    ...requireDescOnVars(root),
    ...noGlobalAliases(root),
    ...noDerivedVars(root),
    ...requireScssFallback(root),
    ...noScssInStyles(root),
    ...requireTokenScope(root),
    ...requireModifierAnnotations(root),
  ];
}
