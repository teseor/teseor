import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Modal classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('modal', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-modal');
  });

  it.each(['sm', 'lg', 'full'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-modal ui-modal--${size}`);
  });

  it('renders visible modifier', () => {
    expect(b({ visible: true })).toBe('ui-modal ui-modal--visible');
  });

  it('renders entering modifier', () => {
    expect(b({ entering: true })).toBe('ui-modal ui-modal--entering');
  });

  it('combines size + visible', () => {
    expect(b({ size: 'sm', visible: true })).toBe('ui-modal ui-modal--sm ui-modal--visible');
  });
});
