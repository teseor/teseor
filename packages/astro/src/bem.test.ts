import { describe, expect, it } from 'vitest';
import { bemClasses } from './bem';

describe('bemClasses', () => {
  it('returns base class with no modifiers', () => {
    expect(bemClasses('button', {})).toBe('ui-button');
  });

  it('appends string modifier as value-based class', () => {
    expect(bemClasses('button', { variant: 'ghost' })).toBe('ui-button ui-button--ghost');
  });

  it('appends boolean modifier as key-based class', () => {
    expect(bemClasses('button', { block: true })).toBe('ui-button ui-button--block');
  });

  it('skips false boolean modifiers', () => {
    expect(bemClasses('button', { block: false })).toBe('ui-button');
  });

  it('skips undefined modifiers', () => {
    expect(bemClasses('button', { variant: undefined })).toBe('ui-button');
  });

  it('combines multiple modifiers', () => {
    const result = bemClasses('button', { variant: 'ghost', size: 'sm', loading: true });
    expect(result).toBe('ui-button ui-button--ghost ui-button--sm ui-button--loading');
  });

  it('appends extra class', () => {
    expect(bemClasses('button', { variant: 'ghost' }, 'custom-class')).toBe(
      'ui-button ui-button--ghost custom-class',
    );
  });

  it('works with different block names', () => {
    expect(bemClasses('card', { variant: 'subtle', flush: true })).toBe(
      'ui-card ui-card--subtle ui-card--flush',
    );
  });
});
