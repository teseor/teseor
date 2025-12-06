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
      if (decl.prop.startsWith('--') && !decl.prop.startsWith(`--${PREFIX}`)) {
        decl.prop = `--${PREFIX}${decl.prop.slice(2)}`;
      }
      // Prefix var() references in values
      if (decl.value.includes('var(--')) {
        decl.value = decl.value.replace(/var\(--(?!ui-)([^)]+)\)/g, `var(--${PREFIX}$1)`);
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

module.exports = {
  plugins: [
    // Bundle @import statements
    require('postcss-import'),

    // Prefix CSS custom properties
    prefixCustomProperties(),

    // Prefix class selectors
    require('postcss-prefix-selector')({
      prefix: PREFIX,
      transform(prefix, selector, prefixedSelector, filePath) {
        // Don't prefix these selectors
        if (selector.match(/^(html|body|:root|\*|@)/)) {
          return selector;
        }
        // Transform .class to .ui-class (skip if already prefixed)
        if (selector.startsWith('.') && !selector.startsWith(`.${PREFIX}`)) {
          return `.${prefix}${selector.slice(1)}`;
        }
        return selector;
      },
    }),
  ],
};
