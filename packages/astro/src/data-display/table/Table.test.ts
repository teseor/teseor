import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Table classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('table', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-table');
  });

  it('renders compact modifier', () => {
    expect(b({ compact: true })).toBe('ui-table ui-table--compact');
  });

  it('renders striped modifier', () => {
    expect(b({ striped: true })).toBe('ui-table ui-table--striped');
  });

  it('combines compact + striped', () => {
    expect(b({ compact: true, striped: true })).toBe(
      'ui-table ui-table--compact ui-table--striped',
    );
  });
});
