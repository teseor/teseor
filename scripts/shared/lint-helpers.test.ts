import { describe, expect, it } from 'vitest';

import { extractTokenVars, isHardcodedFallback } from './lint-helpers.js';

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
