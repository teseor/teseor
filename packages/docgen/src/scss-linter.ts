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

// --- Run all rules ---

export function lintScss(root: Root): Diagnostic[] {
  return [
    ...requireComponentAnnotation(root),
    ...requireElementAnnotation(root),
    ...requireDescOnVars(root),
    ...requireModifierAnnotations(root),
  ];
}
