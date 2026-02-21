import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Alert classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('alert', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-alert');
  });

  it.each(['info', 'success', 'warning', 'danger'] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-alert ui-alert--${variant}`);
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-alert ui-alert--${size}`);
  });

  it('renders dismissible modifier', () => {
    expect(b({ dismissible: true })).toBe('ui-alert ui-alert--dismissible');
  });

  it('combines variant + size + dismissible', () => {
    expect(b({ variant: 'warning', size: 'lg', dismissible: true })).toBe(
      'ui-alert ui-alert--warning ui-alert--lg ui-alert--dismissible',
    );
  });
});
