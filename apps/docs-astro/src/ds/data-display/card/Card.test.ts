import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Card classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('card', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-card');
  });

  it.each(['subtle', 'muted'] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-card ui-card--${variant}`);
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-card ui-card--${size}`);
  });

  it('renders flush modifier', () => {
    expect(b({ flush: true })).toBe('ui-card ui-card--flush');
  });

  it('renders interactive modifier', () => {
    expect(b({ interactive: true })).toBe('ui-card ui-card--interactive');
  });

  it('renders responsive modifier', () => {
    expect(b({ responsive: true })).toBe('ui-card ui-card--responsive');
  });

  it('combines multiple modifiers', () => {
    expect(b({ variant: 'subtle', size: 'sm', interactive: true })).toBe(
      'ui-card ui-card--subtle ui-card--sm ui-card--interactive',
    );
  });
});
