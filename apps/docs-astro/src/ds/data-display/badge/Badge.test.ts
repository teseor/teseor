import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Badge classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('badge', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-badge');
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-badge ui-badge--${size}`);
  });

  it.each(['primary', 'success', 'warning', 'danger'] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-badge ui-badge--${variant}`);
  });

  it('combines size + variant', () => {
    expect(b({ size: 'sm', variant: 'primary' })).toBe('ui-badge ui-badge--sm ui-badge--primary');
  });
});
