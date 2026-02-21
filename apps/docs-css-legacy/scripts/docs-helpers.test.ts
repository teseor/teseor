import { describe, expect, it } from 'vitest';

import { getExpectedClasses } from './validate-docs.js';

describe('getExpectedClasses', () => {
  it('handles utility type', () => {
    const api = {
      type: 'utility',
      name: 'text',
      utilities: ['text-center', 'text-right'],
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-text-center')).toBe(true);
    expect(classes.has('ui-text-right')).toBe(true);
    expect(classes.has('ui-text')).toBe(false);
  });

  it('handles basic component', () => {
    const api = {
      name: 'button',
      modifiers: {},
      elements: {},
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-button')).toBe(true);
  });

  it('handles boolean modifiers', () => {
    const api = {
      name: 'button',
      modifiers: {
        icon: { type: 'boolean' },
      },
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-button--icon')).toBe(true);
  });

  it('handles enum modifiers', () => {
    const api = {
      name: 'button',
      modifiers: {
        size: { values: ['sm', 'md', 'lg'] },
      },
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-button--sm')).toBe(true);
    expect(classes.has('ui-button--md')).toBe(true);
    expect(classes.has('ui-button--lg')).toBe(true);
  });

  it('handles elements with modifiers', () => {
    const api = {
      name: 'table',
      modifiers: {},
      elements: {
        cell: {
          modifiers: {
            header: { type: 'boolean' },
          },
        },
      },
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-table__cell')).toBe(true);
    expect(classes.has('ui-table__cell--header')).toBe(true);
  });

  it('handles related components', () => {
    const api = {
      name: 'button',
      modifiers: {},
      relatedComponents: [
        {
          name: 'button-group',
          modifiers: { vertical: { type: 'boolean' } },
          elements: {
            item: { modifiers: { first: { type: 'boolean' } } },
          },
        },
      ],
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-button-group')).toBe(true);
    expect(classes.has('ui-button-group--vertical')).toBe(true);
    expect(classes.has('ui-button-group__item')).toBe(true);
    expect(classes.has('ui-button-group__item--first')).toBe(true);
  });

  it('handles string-type related components', () => {
    const api = {
      name: 'avatar',
      modifiers: {},
      relatedComponents: ['avatar-group'],
    };
    const classes = getExpectedClasses(api);
    expect(classes.has('ui-avatar-group')).toBe(true);
  });
});
