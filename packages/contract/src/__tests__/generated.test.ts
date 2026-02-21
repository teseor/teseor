import { describe, expect, it } from 'vitest';
import { alert, button, card, input, inputGroup, modal, tabs } from '../generated';

describe('button', () => {
  it('returns base class with no props', () => {
    expect(button()).toBe('ui-button');
  });

  it('applies enum modifier', () => {
    expect(button({ variant: 'ghost' })).toBe('ui-button ui-button--ghost');
  });

  it('applies multiple modifiers', () => {
    expect(button({ variant: 'ghost', size: 'sm' })).toBe(
      'ui-button ui-button--sm ui-button--ghost',
    );
  });

  it('applies boolean modifier', () => {
    expect(button({ loading: true })).toBe('ui-button ui-button--loading');
  });

  it('omits false boolean', () => {
    expect(button({ loading: false })).toBe('ui-button');
  });

  it('generates element class via sub-function', () => {
    expect(button.icon()).toBe('ui-button__icon');
  });

  it('applies element modifier', () => {
    expect(button.icon({ start: true })).toBe('ui-button__icon ui-button__icon--start');
  });
});

describe('card', () => {
  it('returns base class', () => {
    expect(card()).toBe('ui-card');
  });

  it('applies variant', () => {
    expect(card({ variant: 'subtle' })).toBe('ui-card ui-card--subtle');
  });

  it('generates element classes', () => {
    expect(card.media()).toBe('ui-card__media');
    expect(card.body()).toBe('ui-card__body');
  });
});

describe('input', () => {
  it('returns base class', () => {
    expect(input()).toBe('ui-input');
  });

  it('applies enum and boolean modifiers', () => {
    expect(input({ size: 'sm', block: true })).toBe('ui-input ui-input--block ui-input--sm');
  });

  it('maps camelCase prop to hyphenated CSS modifier', () => {
    expect(input({ autoSize: true })).toBe('ui-input ui-input--auto-size');
  });
});

describe('inputGroup (relatedComponent)', () => {
  it('returns base class', () => {
    expect(inputGroup()).toBe('ui-input-group');
  });

  it('generates element class for addon', () => {
    expect(inputGroup.addon()).toBe('ui-input-group__addon');
  });

  it('applies addon element modifiers', () => {
    expect(inputGroup.addon({ start: true, interactive: true })).toBe(
      'ui-input-group__addon ui-input-group__addon--interactive ui-input-group__addon--start',
    );
  });
});

describe('alert', () => {
  it('returns base class', () => {
    expect(alert()).toBe('ui-alert');
  });

  it('applies variant', () => {
    expect(alert({ variant: 'danger' })).toBe('ui-alert ui-alert--danger');
  });

  it('generates element classes', () => {
    expect(alert.icon()).toBe('ui-alert__icon');
    expect(alert.title()).toBe('ui-alert__title');
    expect(alert.content()).toBe('ui-alert__content');
    expect(alert.close()).toBe('ui-alert__close');
  });
});

describe('modal', () => {
  it('returns base class', () => {
    expect(modal()).toBe('ui-modal');
  });

  it('applies size modifier', () => {
    expect(modal({ size: 'lg' })).toBe('ui-modal ui-modal--lg');
  });

  it('applies boolean modifier', () => {
    expect(modal({ visible: true })).toBe('ui-modal ui-modal--visible');
  });

  it('generates element classes', () => {
    expect(modal.content()).toBe('ui-modal__content');
    expect(modal.body()).toBe('ui-modal__body');
  });
});

describe('tabs', () => {
  it('returns base class', () => {
    expect(tabs()).toBe('ui-tabs');
  });

  it('generates element with modifiers', () => {
    expect(tabs.tab({ active: true })).toBe('ui-tabs__tab ui-tabs__tab--active');
    expect(tabs.panel({ active: true })).toBe('ui-tabs__panel ui-tabs__panel--active');
  });

  it('generates element without modifiers', () => {
    expect(tabs.list()).toBe('ui-tabs__list');
  });
});

describe('type safety', () => {
  it('rejects invalid enum values', () => {
    // @ts-expect-error - invalid size value
    button({ size: '2xl' });
  });

  it('rejects unknown props', () => {
    // @ts-expect-error - nonexistent prop
    button({ color: 'red' });
  });

  it('rejects invalid variant', () => {
    // @ts-expect-error - invalid variant
    card({ variant: 'nope' });
  });
});
