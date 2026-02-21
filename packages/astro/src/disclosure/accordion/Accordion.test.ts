import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Accordion classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('accordion', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-accordion');
  });

  it('renders separated modifier', () => {
    expect(b({ separated: true })).toBe('ui-accordion ui-accordion--separated');
  });

  it('skips separated when false', () => {
    expect(b({ separated: false })).toBe('ui-accordion');
  });
});
