/**
 * PostCSS Configuration
 *
 * This config adds the 'ui-' prefix to all CSS classes and custom properties.
 * Source files remain unprefixed for development convenience.
 * Built/dist files are prefixed for distribution.
 *
 * Transformations:
 *   .button      → .ui-button
 *   --color-bg   → --ui-color-bg
 *   var(--space) → var(--ui-space)
 */

const PREFIX = 'ui-';

// Custom plugin to prefix CSS custom properties
const prefixCustomProperties = () => {
  return {
    postcssPlugin: 'postcss-prefix-custom-properties',
    Declaration(decl) {
      // Prefix custom property declarations (--property-name)
      // Skip internal vars (--_ prefix) — they are component-scoped, not public API
      if (
        decl.prop.startsWith('--') &&
        !decl.prop.startsWith(`--${PREFIX}`) &&
        !decl.prop.startsWith('--_')
      ) {
        decl.prop = `--${PREFIX}${decl.prop.slice(2)}`;
      }
      // Prefix var() references in values
      // Skip internal vars (--_ prefix) via negative lookahead
      if (decl.value.includes('var(--')) {
        decl.value = decl.value.replace(/var\(--(?!ui-)(?!_)([^)]+)\)/g, `var(--${PREFIX}$1)`);
      }
    },
    AtRule(atRule) {
      // Handle @property rules
      if (
        atRule.name === 'property' &&
        atRule.params.startsWith('--') &&
        !atRule.params.startsWith(`--${PREFIX}`)
      ) {
        atRule.params = `--${PREFIX}${atRule.params.slice(2)}`;
      }
    },
  };
};
prefixCustomProperties.postcss = true;

// Merge duplicate @layer blocks and duplicate selectors within each layer
const mergeLayerBlocks = () => {
  const mergeRules = (parent) => {
    const seen = new Map();
    parent.each((node) => {
      if (node.type !== 'rule') return;
      const key = node.selector;
      if (seen.has(key)) {
        const target = seen.get(key);
        for (const child of node.nodes) {
          target.append(child.clone());
        }
        node.remove();
      } else {
        seen.set(key, node);
      }
    });
  };

  return {
    postcssPlugin: 'postcss-merge-layer-blocks',
    OnceExit(root) {
      const seen = new Map();
      root.walkAtRules('layer', (atRule) => {
        if (!atRule.nodes || atRule.nodes.length === 0) return;
        const name = atRule.params;
        if (seen.has(name)) {
          const target = seen.get(name);
          for (const node of atRule.nodes) {
            target.append(node.clone());
          }
          atRule.remove();
        } else {
          seen.set(name, atRule);
        }
      });
      // Merge duplicate selectors within each merged layer
      for (const layer of seen.values()) {
        mergeRules(layer);
      }
    },
  };
};
mergeLayerBlocks.postcss = true;

module.exports = {
  plugins: [
    // Bundle @import statements
    require('postcss-import'),

    // Prefix CSS custom properties
    prefixCustomProperties(),

    // Prefix class selectors
    require('postcss-prefix-selector')({
      prefix: PREFIX,
      transform(prefix, selector, _prefixedSelector, _filePath) {
        // Don't prefix root/global selectors
        if (selector.match(/^(html|body|:root|\*|@)/)) {
          return selector;
        }
        // Prefix every class segment: .foo → .ui-foo (skip already-prefixed)
        return selector.replace(/\.(?!ui-)(?=[a-zA-Z_-])/g, `.${prefix}`);
      },
    }),

    // Merge duplicate @layer blocks
    mergeLayerBlocks(),
  ],
};
