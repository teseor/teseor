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

// --- Rule: layer structure enforcement ---
// Components must have components.tokens then components.styles (in order).
// Layouts must have a single primitives layer.
// No unexpected layer names.

const COMPONENT_LAYERS = ['components.tokens', 'components.styles'];
const LAYOUT_LAYERS = ['primitives'];
const ALLOWED_LAYERS = new Set([...COMPONENT_LAYERS, ...LAYOUT_LAYERS]);

export function requireLayerStructure(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const layers: { name: string; line: number }[] = [];

  for (const node of root.nodes ?? []) {
    if (node.type === 'atrule' && node.name === 'layer') {
      layers.push({
        name: node.params,
        line: node.source?.start?.line ?? 0,
      });
    }
  }

  if (layers.length === 0) {
    diagnostics.push({ line: 1, message: 'no @layer blocks found' });
    return diagnostics;
  }

  // Check for unexpected layer names
  for (const layer of layers) {
    if (!ALLOWED_LAYERS.has(layer.name)) {
      diagnostics.push({
        line: layer.line,
        message: `unexpected @layer ${layer.name} — expected ${[...ALLOWED_LAYERS].join(', ')}`,
      });
    }
  }

  const layerNames = layers.map((l) => l.name);
  const isLayout = layerNames.includes('primitives');
  const isComponent =
    layerNames.includes('components.tokens') || layerNames.includes('components.styles');

  if (isLayout && isComponent) {
    diagnostics.push({
      line: layers[0].line,
      message: 'file mixes component layers and primitives layer',
    });
    return diagnostics;
  }

  if (isComponent) {
    const compLayers = layers.filter((l) => COMPONENT_LAYERS.includes(l.name));
    const names = compLayers.map((l) => l.name);

    if (!names.includes('components.tokens')) {
      diagnostics.push({ line: 1, message: 'missing @layer components.tokens' });
    }
    if (!names.includes('components.styles')) {
      diagnostics.push({ line: 1, message: 'missing @layer components.styles' });
    }

    // Check order: tokens before styles
    const tokensIdx = names.indexOf('components.tokens');
    const stylesIdx = names.indexOf('components.styles');
    if (tokensIdx !== -1 && stylesIdx !== -1 && tokensIdx > stylesIdx) {
      diagnostics.push({
        line: compLayers[tokensIdx].line,
        message: '@layer components.tokens must appear before @layer components.styles',
      });
    }
  }

  if (isLayout) {
    const primLayers = layers.filter((l) => l.name === 'primitives');
    if (primLayers.length > 1) {
      diagnostics.push({
        line: primLayers[1].line,
        message: 'layouts should have a single @layer primitives block',
      });
    }
  }

  return diagnostics;
}

// --- Rule: no bare declarations outside @layer ---
// All CSS rules must live inside @layer blocks. Allowed outside: @use, @forward, comments, SCSS vars.

export function noBareDeclarations(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const node of root.nodes ?? []) {
    if (node.type === 'comment') continue;

    if (node.type === 'atrule') {
      const name = node.name;
      // Allow @use, @forward, @layer, @property (CSS registered properties must be at root)
      if (name === 'use' || name === 'forward' || name === 'layer' || name === 'property') continue;
      diagnostics.push({
        line: node.source?.start?.line ?? 0,
        message: `@${name} must be inside an @layer block`,
      });
      continue;
    }

    if (node.type === 'rule') {
      diagnostics.push({
        line: node.source?.start?.line ?? 0,
        message: `selector ${node.selector} must be inside an @layer block`,
      });
      continue;
    }

    // Declaration at root level (SCSS $var is fine — PostCSS sees them as declarations)
    if (node.type === 'decl') {
      // SCSS variables ($var) compile away — allow them
      if (node.prop.startsWith('$')) continue;
      diagnostics.push({
        line: node.source?.start?.line ?? 0,
        message: `${node.prop} declaration must be inside an @layer block`,
      });
    }
  }

  return diagnostics;
}

// --- Rule: BEM selector validation ---
// All class selectors must match the component's BEM namespace.
// Valid: .{name}, .{name}--{mod}, .{name}__{elem}, .{name}__{elem}--{mod}
// SCSS nesting (&), interpolation (#{...}), pseudo-classes/elements, attribute selectors are allowed.

function extractClassNames(selector: string): string[] {
  const classes: string[] = [];
  // Match class selectors, but stop at pseudo/attribute/combinator boundaries
  // Skip selectors containing SCSS interpolation
  if (selector.includes('#{')) return classes;

  const parts = selector.split(/(?=[.#[:])|(?<=\s[>+~]\s)|\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith('.')) continue;
    // Skip & references (SCSS parent selector)
    if (trimmed.startsWith('.&') || trimmed === '.') continue;
    // Extract class name (stop at pseudo, attribute, or combinator)
    const className = trimmed.slice(1).split(/[:[\s>+~(]/)[0];
    if (className && !className.includes('&') && !className.includes('#')) {
      classes.push(className);
    }
  }
  return classes;
}

function isValidBemSelector(className: string, validBlocks: Set<string>): boolean {
  for (const block of validBlocks) {
    // Exact match: .component
    if (className === block) return true;
    // Modifier: .component--modifier
    if (className.startsWith(`${block}--`)) return true;
    // Element: .component__element or .component__element--modifier
    if (className.startsWith(`${block}__`)) return true;
  }
  return false;
}

export function requireBemSelectors(root: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Extract component name
  let componentName: string | null = null;
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@component\s+([\w-]+)/);
    if (match) componentName = match[1];
  });
  if (!componentName) return diagnostics;

  // Extract related component names
  const relatedNames: string[] = [];
  root.walkComments((comment: Comment) => {
    const match = comment.text.trim().match(/^@related\s+([\w-]+)/);
    if (match) relatedNames.push(match[1]);
  });

  // Build set of valid block names
  const validBlocks = new Set([componentName, ...relatedNames]);

  // Walk all rules inside @layer blocks
  const reported = new Set<string>();

  root.walkAtRules('layer', (atRule) => {
    atRule.walkRules((rule) => {
      for (const selector of rule.selectors) {
        // Skip selectors that are pure SCSS nesting (& references)
        const trimmed = selector.trim();
        if (trimmed.startsWith('&') || trimmed.startsWith(':') || trimmed.startsWith('[')) continue;

        const classes = extractClassNames(selector);
        for (const cls of classes) {
          if (!isValidBemSelector(cls, validBlocks)) {
            const key = `${rule.source?.start?.line}:${cls}`;
            if (reported.has(key)) continue;
            reported.add(key);
            diagnostics.push({
              line: rule.source?.start?.line ?? 0,
              message: `.${cls} is not a valid BEM selector for @component ${componentName} — expected .${componentName}, .${componentName}--*, or .${componentName}__*`,
            });
          }
        }
      }
    });
  });

  return diagnostics;
}

// --- Run all rules ---

export function lintScss(root: Root): Diagnostic[] {
  return [
    ...requireComponentAnnotation(root),
    ...requireElementAnnotation(root),
    ...requireLayerStructure(root),
    ...noBareDeclarations(root),
    ...requireDescOnVars(root),
    ...noGlobalAliases(root),
    ...noDerivedVars(root),
    ...requireScssFallback(root),
    ...noScssInStyles(root),
    ...requireTokenScope(root),
    ...requireModifierAnnotations(root),
    ...requireBemSelectors(root),
  ];
}
