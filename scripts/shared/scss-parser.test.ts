import { describe, expect, it } from 'vitest';

import {
  convertScssToVar,
  extractBalanced,
  extractCssVars,
  extractDefault,
  extractElements,
  extractLayerContent,
  extractModifiers,
  extractRelatedComponents,
  extractRelatedFromAnnotation,
  normalizeForComparison,
  parseScssContent,
  serializeApi,
} from './scss-parser.js';

describe('extractBalanced', () => {
  it('extracts balanced braces', () => {
    const content = '{ color: red; }';
    expect(extractBalanced(content, 0, '{', '}')).toBe('{ color: red; }');
  });

  it('handles nested braces', () => {
    const content = '{ .foo { color: red; } }';
    expect(extractBalanced(content, 0, '{', '}')).toBe('{ .foo { color: red; } }');
  });

  it('handles unmatched (returns rest of string)', () => {
    const content = '{ .foo { color: red; }';
    expect(extractBalanced(content, 0, '{', '}')).toBe('{ .foo { color: red; }');
  });

  it('extracts balanced parens', () => {
    const content = 'var(--ui-foo, var(--ui-bar, 10px))';
    expect(extractBalanced(content, 3, '(', ')')).toBe('(--ui-foo, var(--ui-bar, 10px))');
  });

  it('handles empty content', () => {
    expect(extractBalanced('', 0, '{', '}')).toBe('');
  });
});

describe('extractDefault', () => {
  it('extracts inner var reference', () => {
    const expr = 'var(--ui-button-height, var(--ui-row-2, #{t.$row-2}))';
    expect(extractDefault(expr, '--ui-button-height')).toBe('var(--ui-row-2)');
  });

  it('extracts literal fallback', () => {
    const expr = 'var(--ui-avatar-radius, 50%)';
    expect(extractDefault(expr, '--ui-avatar-radius')).toBe('50%');
  });

  it('converts calc with SCSS interpolation', () => {
    const expr = 'var(--ui-avatar-size, calc(#{t.$unit} * 5))';
    expect(extractDefault(expr, '--ui-avatar-size')).toBe('calc(var(--ui-unit) * 5)');
  });

  it('returns empty string when var not found', () => {
    expect(extractDefault('var(--ui-foo, 10px)', '--ui-bar')).toBe('');
  });

  it('converts raw SCSS ref to var', () => {
    const expr = 'var(--ui-button-gap, #{t.$space-1})';
    expect(extractDefault(expr, '--ui-button-gap')).toBe('var(--ui-space-1)');
  });
});

describe('convertScssToVar', () => {
  it('converts single interpolation', () => {
    expect(convertScssToVar('#{t.$space-2}')).toBe('var(--ui-space-2)');
  });

  it('converts multiple interpolations', () => {
    expect(convertScssToVar('#{t.$space-1} #{t.$space-2}')).toBe(
      'var(--ui-space-1) var(--ui-space-2)',
    );
  });

  it('returns unchanged string when no match', () => {
    expect(convertScssToVar('10px solid red')).toBe('10px solid red');
  });
});

describe('extractLayerContent', () => {
  it('extracts single @layer block', () => {
    const content = '@layer components.tokens { .button { color: red; } }';
    expect(extractLayerContent(content, 'components.tokens').trim()).toBe(
      '.button { color: red; }',
    );
  });

  it('extracts multiple @layer blocks', () => {
    const content = [
      '@layer components.tokens { .a { } }',
      '@layer components.styles { .b { } }',
      '@layer components.tokens { .c { } }',
    ].join('\n');
    const result = extractLayerContent(content, 'components.tokens');
    expect(result).toContain('.a { }');
    expect(result).toContain('.c { }');
    expect(result).not.toContain('.b { }');
  });

  it('returns empty string for missing layer', () => {
    expect(extractLayerContent('body { }', 'components.tokens')).toBe('');
  });

  it('handles nested braces inside layer', () => {
    const content = '@layer primitives { .grid { &__item { flex: 1; } } }';
    const result = extractLayerContent(content, 'primitives');
    expect(result).toContain('&__item');
    expect(result).toContain('flex: 1');
  });
});

describe('extractCssVars', () => {
  it('extracts basic token', () => {
    const content = '--_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));';
    const vars = extractCssVars(content, 'button');
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('--ui-button-height');
    expect(vars[0].default).toBe('var(--ui-row-2)');
  });

  it('captures @desc annotation', () => {
    const content = [
      '// @desc Controls the button height',
      '--_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));',
    ].join('\n');
    const vars = extractCssVars(content, 'button');
    expect(vars).toHaveLength(1);
    expect(vars[0].description).toBe('Controls the button height');
  });

  it('deduplicates tokens', () => {
    const content = [
      '--_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));',
      'height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));',
    ].join('\n');
    const vars = extractCssVars(content, 'button');
    expect(vars).toHaveLength(1);
  });

  it('returns empty array when no tokens match', () => {
    const content = '--_bg: var(--ui-other-bg, red);';
    expect(extractCssVars(content, 'button')).toHaveLength(0);
  });
});

describe('extractModifiers', () => {
  it('detects boolean modifier annotation', () => {
    const content = '// @modifier boolean icon';
    const mods = extractModifiers(content, 'button');
    expect(mods.icon).toEqual({ type: 'boolean' });
  });

  it('detects enum modifier with explicit values', () => {
    const content = '// @modifier size xs, sm, md, lg';
    const mods = extractModifiers(content, 'button');
    expect(mods.size).toEqual({ values: ['xs', 'sm', 'md', 'lg'] });
  });

  it('detects enum modifier from class patterns', () => {
    const content = [
      '// @modifier variant',
      '.button--primary {',
      '  color: blue;',
      '}',
      '.button--secondary {',
      '  color: gray;',
      '}',
    ].join('\n');
    const mods = extractModifiers(content, 'button');
    expect(mods.variant).toEqual({ values: ['primary', 'secondary'] });
  });

  it('detects enum modifier from nested patterns', () => {
    const content = [
      '// @modifier size',
      '&--sm {',
      '  height: 24px;',
      '}',
      '&--lg {',
      '  height: 48px;',
      '}',
    ].join('\n');
    const mods = extractModifiers(content, 'button');
    expect(mods.size).toEqual({ values: ['sm', 'lg'] });
  });

  it('ignores pseudo-classes', () => {
    const content = ['// @modifier state', '&--hover {', '  color: blue;', '}'].join('\n');
    const mods = extractModifiers(content, 'button');
    expect(mods.state).toBeUndefined();
  });

  it('removes empty modifier groups', () => {
    const content = '// @modifier variant';
    const mods = extractModifiers(content, 'button');
    expect(mods.variant).toBeUndefined();
  });
});

describe('extractElements', () => {
  it('detects direct class pattern elements', () => {
    const content = '.button__icon { display: flex; }';
    const elems = extractElements(content, 'button');
    expect(elems).toBeDefined();
    expect(elems!.icon).toEqual({});
  });

  it('detects element modifiers from class pattern', () => {
    const content = '.button__icon--left { } .button__icon { }';
    const elems = extractElements(content, 'button');
    expect(elems!.icon).toEqual({ modifiers: { left: { type: 'boolean' } } });
  });

  it('detects nested &__element patterns', () => {
    const content = '&__label { color: red; }';
    const elems = extractElements(content, 'button');
    expect(elems).toBeDefined();
    expect(elems!.label).toEqual({});
  });

  it('detects modifiers inside nested elements', () => {
    const content = '&__cell { &--header { font-weight: bold; } }';
    const elems = extractElements(content, 'table');
    expect(elems!.cell).toEqual({ modifiers: { header: { type: 'boolean' } } });
  });

  it('returns undefined when no elements found', () => {
    expect(extractElements('.button { color: red; }', 'button')).toBeUndefined();
  });

  it('ignores pseudo-class modifiers inside elements', () => {
    const content = '&__item { &--hover { } &--active { } &--selected { } }';
    const elems = extractElements(content, 'menu');
    expect(elems!.item).toEqual({ modifiers: { selected: { type: 'boolean' } } });
  });
});

describe('extractRelatedFromAnnotation', () => {
  it('extracts single related component', () => {
    expect(extractRelatedFromAnnotation('// @related button-group')).toEqual(['button-group']);
  });

  it('extracts multiple comma-separated', () => {
    expect(extractRelatedFromAnnotation('// @related foo, bar')).toEqual(['foo', 'bar']);
  });

  it('extracts from multiple annotations', () => {
    const content = '// @related foo\n// @related bar';
    expect(extractRelatedFromAnnotation(content)).toEqual(['foo', 'bar']);
  });

  it('returns empty array when none', () => {
    expect(extractRelatedFromAnnotation('// no related here')).toEqual([]);
  });
});

describe('extractRelatedComponents', () => {
  it('returns undefined for empty annotated names', () => {
    expect(extractRelatedComponents('.foo { }', 'foo', [])).toBeUndefined();
  });

  it('extracts related component with modifiers', () => {
    const content = '.button-group--vertical { }';
    const result = extractRelatedComponents(content, 'button', ['button-group']);
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe('button-group');
    expect(result![0].modifiers).toEqual({ vertical: { type: 'boolean' } });
  });

  it('extracts related component with elements', () => {
    const content = '.avatar-group__overflow { }';
    const result = extractRelatedComponents(content, 'avatar', ['avatar-group']);
    expect(result).toHaveLength(1);
    expect(result![0].elements).toEqual({ overflow: {} });
  });

  it('extracts related component element modifiers', () => {
    const content = '.avatar-group__item { } .avatar-group__item--first { }';
    const result = extractRelatedComponents(content, 'avatar', ['avatar-group']);
    expect(result).toHaveLength(1);
    expect(result![0].elements!.item).toEqual({
      modifiers: { first: { type: 'boolean' } },
    });
  });
});

describe('parseScssContent', () => {
  it('parses component with layers', () => {
    const scss = [
      '// @element button',
      '// @related button-group',
      '@layer components.tokens {',
      '  .button {',
      '    // @modifier boolean icon',
      '    // @modifier size xs, sm, md, lg',
      '    // @desc Controls the button height',
      '    --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));',
      '  }',
      '}',
      '@layer components.styles {',
      '  .button {',
      '    height: var(--_height);',
      '    &__label { display: flex; }',
      '  }',
      '}',
      '.button-group--vertical { }',
    ].join('\n');

    const api = parseScssContent(scss, 'button', false);
    expect(api.name).toBe('button');
    expect(api.element).toBe('button');
    expect(api.modifiers.icon).toEqual({ type: 'boolean' });
    expect(api.modifiers.size).toEqual({ values: ['xs', 'sm', 'md', 'lg'] });
    expect(api.cssVars).toHaveLength(1);
    expect(api.cssVars[0].name).toBe('--ui-button-height');
    expect(api.cssVars[0].description).toBe('Controls the button height');
    expect(api.elements).toBeDefined();
    expect(api.elements!.label).toEqual({});
    expect(api.relatedComponents).toHaveLength(1);
    expect(api.relatedComponents![0].name).toBe('button-group');
  });

  it('parses layout with primitives layer', () => {
    const scss = [
      '@layer primitives {',
      '  .grid {',
      '    // @modifier size',
      '    &--sm { }',
      '    &--lg { }',
      '    --_gap: var(--ui-grid-gap, var(--ui-space-2, #{t.$space-2}));',
      '    &__item { }',
      '  }',
      '}',
    ].join('\n');

    const api = parseScssContent(scss, 'grid', true);
    expect(api.name).toBe('grid');
    expect(api.modifiers.size).toEqual({ values: ['sm', 'lg'] });
    expect(api.cssVars).toHaveLength(1);
    expect(api.elements).toBeDefined();
    expect(api.elements!.item).toEqual({});
  });

  it('uses @component annotation over folder name', () => {
    const scss = '// @component custom-name';
    const api = parseScssContent(scss, 'folder-name', false);
    expect(api.name).toBe('custom-name');
  });

  it('defaults element to div', () => {
    const api = parseScssContent('', 'test', false);
    expect(api.element).toBe('div');
  });
});

describe('serializeApi', () => {
  it('produces JSON with trailing newline', () => {
    const api = {
      $schema: 'test',
      name: 'test',
      element: 'div',
      modifiers: {},
      cssVars: [],
    };
    const result = serializeApi(api);
    expect(result.endsWith('\n')).toBe(true);
    expect(JSON.parse(result)).toEqual(api);
  });
});

describe('normalizeForComparison', () => {
  it('produces stable JSON string', () => {
    const a = { b: 1, a: 2 };
    const b = { b: 1, a: 2 };
    expect(normalizeForComparison(a)).toBe(normalizeForComparison(b));
  });
});
