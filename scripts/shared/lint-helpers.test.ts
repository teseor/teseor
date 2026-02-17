import { describe, expect, it } from 'vitest';

import {
  extractAllTokenRefs,
  extractBareTokenVars,
  extractDynamicTokenPrefixes,
  extractPropertyDeclarations,
  extractTokenDefinitions,
  extractTokenVars,
  extractWrongLayerTokens,
  isHardcodedFallback,
} from './lint-helpers.js';

describe('extractTokenVars', () => {
  it('extracts basic var(--ui-X, fallback)', () => {
    const content = 'height: var(--ui-button-height, #{t.$row-2});';
    const result = extractTokenVars(content);
    expect(result).toHaveLength(1);
    expect(result[0].token).toBe('button-height');
    expect(result[0].fallback).toBe('#{t.$row-2}');
  });

  it('extracts nested var()', () => {
    const content = 'height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));';
    const result = extractTokenVars(content);
    // Outer token
    expect(result[0].token).toBe('button-height');
    expect(result[0].fallback).toBe('var(--ui-row-2, #{t.$row-2})');
    // Inner token (scanned from after the comma)
    expect(result[1].token).toBe('row-2');
    expect(result[1].fallback).toBe('#{t.$row-2}');
  });

  it('skips var(--ui-X) without comma', () => {
    const content = 'height: var(--ui-button-height);';
    const result = extractTokenVars(content);
    expect(result).toHaveLength(0);
  });

  it('skips invalid token names', () => {
    const content = 'height: var(--ui- , fallback);';
    const result = extractTokenVars(content);
    expect(result).toHaveLength(0);
  });

  it('handles multiple tokens in content', () => {
    const content = [
      'height: var(--ui-button-height, #{t.$row-2});',
      'gap: var(--ui-button-gap, #{t.$space-1});',
    ].join('\n');
    const result = extractTokenVars(content);
    expect(result).toHaveLength(2);
    expect(result[0].token).toBe('button-height');
    expect(result[1].token).toBe('button-gap');
  });

  it('captures correct index', () => {
    const content = '  height: var(--ui-button-height, 10px);';
    const result = extractTokenVars(content);
    expect(result[0].index).toBe(content.indexOf('var(--ui-'));
  });
});

describe('extractBareTokenVars', () => {
  it('finds var(--ui-X) without fallback', () => {
    const content = '--_color: var(--ui-color-success);';
    const result = extractBareTokenVars(content);
    expect(result).toHaveLength(1);
    expect(result[0].token).toBe('color-success');
  });

  it('ignores var(--ui-X, fallback) with fallback', () => {
    const content = '--_color: var(--ui-color-success, #{t.$color-success});';
    const result = extractBareTokenVars(content);
    expect(result).toHaveLength(0);
  });

  it('finds bare inner vars in nested expressions', () => {
    const content = '--_fill: var(--ui-progress-fill, var(--ui-color-primary));';
    const result = extractBareTokenVars(content);
    expect(result).toHaveLength(1);
    expect(result[0].token).toBe('color-primary');
  });

  it('finds multiple bare vars', () => {
    const content = ['--_a: var(--ui-duration-base);', '--_b: var(--ui-ease-default);'].join('\n');
    const result = extractBareTokenVars(content);
    expect(result).toHaveLength(2);
  });

  it('returns empty for no matches', () => {
    const content = 'color: red;';
    expect(extractBareTokenVars(content)).toHaveLength(0);
  });
});

describe('isHardcodedFallback', () => {
  it('allows SCSS interpolation', () => {
    expect(isHardcodedFallback('#{t.$row-2}')).toBe(false);
  });

  it('allows var() references', () => {
    expect(isHardcodedFallback('var(--ui-row-2)')).toBe(false);
  });

  it('allows SCSS variables', () => {
    expect(isHardcodedFallback('$my-var')).toBe(false);
  });

  it('allows keyword values', () => {
    expect(isHardcodedFallback('none')).toBe(false);
    expect(isHardcodedFallback('inherit')).toBe(false);
    expect(isHardcodedFallback('auto')).toBe(false);
    expect(isHardcodedFallback('transparent')).toBe(false);
    expect(isHardcodedFallback('currentcolor')).toBe(false);
  });

  it('allows plain 0', () => {
    expect(isHardcodedFallback('0')).toBe(false);
  });

  it('allows percentage values', () => {
    expect(isHardcodedFallback('50%')).toBe(false);
    expect(isHardcodedFallback('100%')).toBe(false);
  });

  it('allows values containing SCSS interpolation', () => {
    expect(isHardcodedFallback('0 0 0 #{t.$border-width} inset')).toBe(false);
  });

  it('flags numeric literals', () => {
    expect(isHardcodedFallback('10px')).toBe(true);
    expect(isHardcodedFallback('0.5rem')).toBe(true);
    expect(isHardcodedFallback('0.0625rem')).toBe(true);
    expect(isHardcodedFallback('9999px')).toBe(true);
  });

  it('flags hex colors', () => {
    expect(isHardcodedFallback('#ff0000')).toBe(true);
    expect(isHardcodedFallback('#333')).toBe(true);
  });

  it('flags color functions', () => {
    expect(isHardcodedFallback('rgb(0, 0, 0)')).toBe(true);
    expect(isHardcodedFallback('hsl(0, 100%, 50%)')).toBe(true);
    expect(isHardcodedFallback('oklch(0.5 0.2 120)')).toBe(true);
  });
});

describe('extractPropertyDeclarations', () => {
  it('finds @property declarations', () => {
    const content = [
      '@property --ui-progress-value {',
      '  syntax: "<percentage>";',
      '  inherits: false;',
      '  initial-value: 0%;',
      '}',
    ].join('\n');
    const result = extractPropertyDeclarations(content);
    expect(result).toEqual(new Set(['--ui-progress-value']));
  });

  it('returns empty set for no declarations', () => {
    const content = '.foo { color: red; }';
    expect(extractPropertyDeclarations(content).size).toBe(0);
  });
});

describe('extractAllTokenRefs', () => {
  it('finds var(--ui-*) with and without fallbacks', () => {
    const content = [
      '--_fill: var(--ui-color-primary, #{t.$color-primary});',
      'inline-size: var(--ui-progress-value, auto);',
      '--_bg: var(--ui-color-bg);',
    ].join('\n');
    const result = extractAllTokenRefs(content);
    expect(result).toHaveLength(3);
    expect(result[0].token).toBe('color-primary');
    expect(result[1].token).toBe('progress-value');
    expect(result[2].token).toBe('color-bg');
  });

  it('returns empty for no matches', () => {
    expect(extractAllTokenRefs('color: var(--_bg);')).toHaveLength(0);
  });
});

describe('extractTokenDefinitions', () => {
  it('finds --ui-* definitions', () => {
    const content = ['--ui-color-primary: oklch(0.6 0.2 260);', '--ui-space-2: 16px;'].join('\n');
    const result = extractTokenDefinitions(content);
    expect(result).toEqual(new Set(['color-primary', 'space-2']));
  });

  it('ignores var(--ui-*) references', () => {
    const content = 'color: var(--ui-color-primary, red);';
    const result = extractTokenDefinitions(content);
    expect(result.size).toBe(0);
  });
});

describe('extractDynamicTokenPrefixes', () => {
  it('finds prefixes from SCSS @each interpolation', () => {
    const content = '--_size: var(--ui-icon-size-#{$name}, var(--ui-size-#{$name}, #{$value}));';
    const result = extractDynamicTokenPrefixes(content);
    expect(result).toEqual(new Set(['icon-size', 'size']));
  });

  it('returns empty for no interpolation', () => {
    const content = '--_size: var(--ui-icon-size, 1rem);';
    expect(extractDynamicTokenPrefixes(content).size).toBe(0);
  });
});

describe('extractWrongLayerTokens', () => {
  it('detects --_ definitions inside @layer components.styles', () => {
    const content = [
      '@layer components.styles {',
      '  .foo--sm {',
      '    --_gap: 8px;',
      '  }',
      '}',
    ].join('\n');
    const result = extractWrongLayerTokens(content);
    expect(result).toHaveLength(1);
    expect(result[0].varName).toBe('--_gap');
  });

  it('ignores --_ definitions in @layer components.tokens', () => {
    const content = ['@layer components.tokens {', '  .foo {', '    --_gap: 8px;', '  }', '}'].join(
      '\n',
    );
    const result = extractWrongLayerTokens(content);
    expect(result).toHaveLength(0);
  });

  it('ignores var(--_...) usages in styles layer', () => {
    const content = [
      '@layer components.styles {',
      '  .foo {',
      '    gap: var(--_gap);',
      '  }',
      '}',
    ].join('\n');
    const result = extractWrongLayerTokens(content);
    expect(result).toHaveLength(0);
  });

  it('detects multiple --_ definitions', () => {
    const content = [
      '@layer components.styles {',
      '  .foo--sm {',
      '    --_size: 24px;',
      '    --_gap: 4px;',
      '  }',
      '}',
    ].join('\n');
    const result = extractWrongLayerTokens(content);
    expect(result).toHaveLength(2);
    expect(result[0].varName).toBe('--_size');
    expect(result[1].varName).toBe('--_gap');
  });

  it('returns empty for no styles layer', () => {
    const content = '.foo { color: red; }';
    expect(extractWrongLayerTokens(content)).toHaveLength(0);
  });
});
