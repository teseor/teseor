import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Tabs classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>) => bemClasses('tabs', mods);

  it('renders base class', () => {
    expect(b({})).toBe('ui-tabs');
  });

  it.each(['sm', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-tabs ui-tabs--${size}`);
  });

  it('renders vertical modifier', () => {
    expect(b({ vertical: true })).toBe('ui-tabs ui-tabs--vertical');
  });
});

describe('Tab classes', () => {
  it('renders base element class', () => {
    const classes = ['ui-tabs__tab'].filter(Boolean).join(' ');
    expect(classes).toBe('ui-tabs__tab');
  });

  it('renders active modifier', () => {
    const active = true;
    const classes = ['ui-tabs__tab', active && 'ui-tabs__tab--active'].filter(Boolean).join(' ');
    expect(classes).toBe('ui-tabs__tab ui-tabs__tab--active');
  });

  it('skips active when false', () => {
    const active = false;
    const classes = ['ui-tabs__tab', active && 'ui-tabs__tab--active'].filter(Boolean).join(' ');
    expect(classes).toBe('ui-tabs__tab');
  });
});

describe('TabPanel classes', () => {
  it('renders base element class', () => {
    const classes = ['ui-tabs__panel'].filter(Boolean).join(' ');
    expect(classes).toBe('ui-tabs__panel');
  });

  it('renders active modifier', () => {
    const active = true;
    const classes = ['ui-tabs__panel', active && 'ui-tabs__panel--active']
      .filter(Boolean)
      .join(' ');
    expect(classes).toBe('ui-tabs__panel ui-tabs__panel--active');
  });
});
