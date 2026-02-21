import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Select classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('select', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-select');
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-select ui-select--${size}`);
  });

  it.each(['filled', 'ghost'] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-select ui-select--${variant}`);
  });

  it.each(['error', 'success'] as const)('renders state %s', (state) => {
    expect(b({ state })).toBe(`ui-select ui-select--${state}`);
  });

  it('renders block modifier', () => {
    expect(b({ block: true })).toBe('ui-select ui-select--block');
  });
});
