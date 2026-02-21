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

// --- Rule: @desc on component-specific token vars in tokens layer ---
// Global aliases (--_X: var(--ui-X, ...)) are skipped — their name IS the doc.
// Component tokens (three-tier: var(--ui-COMPONENT-X, var(--ui-global, fallback))) need @desc.
// Derived values (var(--_X), color-mix, calc, etc.) also need @desc.

function isGlobalAlias(value: string, componentName: string): boolean {
  // Global alias: all --ui- references are global tokens (none contain the component name)
  // Component token: at least one --ui-{componentName}-* reference exists
  const uiRefs = [...value.matchAll(/--ui-([\w-]+)/g)];
  if (uiRefs.length === 0) return false;
  return uiRefs.every(([, name]) => !name.startsWith(`${componentName}-`));
}

export function requireDescOnVars(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Get component name for alias detection
  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });

  // Collect all @desc comment line numbers
  const descLines = new Set<number>();
  root.walkComments((comment: Comment) => {
    const text = comment.text.trim();
    if (text.match(/^@desc\s+.+/)) {
      const line = comment.source?.start?.line ?? 0;
      descLines.add(line);
    }
  });

  // Walk declarations in components.tokens layer
  const tokensNodes = findLayerContainers(root, 'components.tokens');
  for (const node of tokensNodes) {
    if (!node) continue;
    const container = 'walkDecls' in node ? node : null;
    if (!container) continue;

    container.walkDecls((decl: Declaration) => {
      // Only check --_ (internal) and --ui- (public) var definitions
      if (!decl.prop.startsWith('--_') && !decl.prop.startsWith('--ui-')) return;

      // Only require @desc on vars inside the base component selector
      // Skip modifier selectors (--), child/compound selectors (>), etc.
      const parentRule = decl.parent;
      if (parentRule?.type === 'rule' && 'selector' in parentRule) {
        const sel = String(parentRule.selector).trim();
        // Skip anything that isn't a simple class selector (modifiers, child combinators, etc.)
        if (
          sel.includes('--') ||
          sel.includes('>') ||
          sel.includes(' ') ||
          sel.includes('+') ||
          sel.includes('~')
        )
          return;
      }

      // Skip global aliases — their var name IS the documentation
      if (componentName && isGlobalAlias(decl.value, componentName)) return;

      const declLine = decl.source?.start?.line ?? 0;
      // @desc must be on the line immediately before the declaration
      if (!descLines.has(declLine - 1)) {
        diagnostics.push({
          line: declLine,
          message: `${decl.prop} missing @desc comment on preceding line`,
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
