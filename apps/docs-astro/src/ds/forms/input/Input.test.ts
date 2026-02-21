import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Input classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('input', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-input');
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-input ui-input--${size}`);
  });

  it.each(['filled', 'ghost'] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-input ui-input--${variant}`);
  });

  it.each(['error', 'success'] as const)('renders state %s', (state) => {
    expect(b({ state })).toBe(`ui-input ui-input--${state}`);
  });

  it('renders auto-size modifier', () => {
    expect(b({ 'auto-size': true })).toBe('ui-input ui-input--auto-size');
  });

  it('renders block modifier', () => {
    expect(b({ block: true })).toBe('ui-input ui-input--block');
  });

  it('combines variant + size + state', () => {
    expect(b({ variant: 'filled', size: 'sm', state: 'error' })).toBe(
      'ui-input ui-input--filled ui-input--sm ui-input--error',
    );
  });
});
