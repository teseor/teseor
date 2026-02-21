import { describe, expect, it } from 'vitest';
import {
  contentFileSchema,
  isAutoSection,
  isComposeSection,
  isFileSection,
  sharedDescriptionsSchema,
} from '../content-schema.js';

describe('contentFileSchema', () => {
  describe('auto sections', () => {
    it('accepts minimal auto section', () => {
      const data = {
        description: 'A component.',
        sections: {
          sizes: { modifier: 'size', layout: 'row' },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(result.sections.sizes).toHaveProperty('modifier', 'size');
    });

    it('accepts auto section with all fields', () => {
      const data = {
        description: 'A component.',
        sections: {
          variants: {
            modifier: 'variant',
            layout: 'row',
            description: 'Style variants.',
            text: 'Label',
            include_default: true,
            combine: [{ size: 'sm' }, {}],
          },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(result.sections.variants).toHaveProperty('include_default', true);
    });

    it('accepts auto section with template', () => {
      const data = {
        description: 'Tabs.',
        sections: {
          sizes: {
            modifier: 'size',
            template: {
              component: 'Tabs',
              children: [{ component: 'Tab', text: '$value' }],
            },
          },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(isAutoSection(result.sections.sizes)).toBe(true);
    });

    it('rejects auto section with empty modifier', () => {
      const data = {
        description: 'A component.',
        sections: { x: { modifier: '' } },
      };
      expect(() => contentFileSchema.parse(data)).toThrow();
    });
  });

  describe('compose sections', () => {
    it('accepts compose section with component nodes', () => {
      const data = {
        description: 'Alert.',
        sections: {
          default: {
            examples: [
              {
                component: 'Alert',
                props: { variant: 'info' },
                children: [{ text: 'Message' }],
              },
            ],
          },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(isComposeSection(result.sections.default)).toBe(true);
    });

    it('accepts compose section with element nodes', () => {
      const data = {
        description: 'Layout.',
        sections: {
          demo: {
            layout: 'column',
            examples: [
              {
                element: 'div',
                classes: ['ui-grid', 'ui-grid--2'],
                children: [
                  { element: 'div', classes: ['ui-bg-muted'], text: '1' },
                  { element: 'div', classes: ['ui-bg-muted'], text: '2' },
                ],
              },
            ],
          },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(result.sections.demo).toHaveProperty('layout', 'column');
    });

    it('accepts element nodes with attrs and style', () => {
      const data = {
        description: 'Input.',
        sections: {
          states: {
            examples: [
              {
                element: 'input',
                classes: ['ui-input'],
                attrs: { type: 'text', placeholder: 'Enter...', disabled: true },
                style: { width: '100%' },
              },
            ],
          },
        },
      };
      const result = contentFileSchema.parse(data);
      const example = (result.sections.states as { examples: unknown[] }).examples[0] as Record<
        string,
        unknown
      >;
      expect(example.attrs).toEqual({ type: 'text', placeholder: 'Enter...', disabled: true });
    });

    it('accepts icon field on component nodes', () => {
      const data = {
        description: 'Buttons.',
        sections: {
          icons: {
            examples: [{ component: 'Button', props: { icon: true }, icon: 'plus' }],
          },
        },
      };
      const result = contentFileSchema.parse(data);
      const example = (result.sections.icons as { examples: unknown[] }).examples[0] as Record<
        string,
        unknown
      >;
      expect(example.icon).toBe('plus');
    });

    it('rejects compose section with empty examples', () => {
      const data = {
        description: 'Bad.',
        sections: { x: { examples: [] } },
      };
      expect(() => contentFileSchema.parse(data)).toThrow();
    });
  });

  describe('file sections', () => {
    it('accepts file section', () => {
      const data = {
        description: 'Complex demo.',
        sections: {
          playground: { file: './examples/playground.astro', description: 'Interactive.' },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(isFileSection(result.sections.playground)).toBe(true);
    });

    it('rejects file section with empty path', () => {
      const data = {
        description: 'Bad.',
        sections: { x: { file: '' } },
      };
      expect(() => contentFileSchema.parse(data)).toThrow();
    });
  });

  describe('type guards', () => {
    it('identifies auto sections', () => {
      expect(isAutoSection({ modifier: 'size' })).toBe(true);
      expect(isAutoSection({ examples: [{ text: 'x' }] })).toBe(false);
      expect(isAutoSection({ file: 'x.astro' })).toBe(false);
    });

    it('identifies compose sections', () => {
      expect(isComposeSection({ examples: [{ text: 'x' }] })).toBe(true);
      expect(isComposeSection({ modifier: 'size' })).toBe(false);
    });

    it('identifies file sections', () => {
      expect(isFileSection({ file: 'x.astro' })).toBe(true);
      expect(isFileSection({ modifier: 'size' })).toBe(false);
    });
  });

  describe('content file level', () => {
    it('requires description', () => {
      const data = { sections: { x: { modifier: 'size' } } };
      expect(() => contentFileSchema.parse(data)).toThrow();
    });

    it('requires non-empty description', () => {
      const data = { description: '', sections: {} };
      expect(() => contentFileSchema.parse(data)).toThrow();
    });

    it('accepts multiple section types in same file', () => {
      const data = {
        description: 'Full component.',
        sections: {
          sizes: { modifier: 'size', layout: 'row' },
          custom: { examples: [{ component: 'Button', text: 'Click' }] },
          complex: { file: './examples/demo.astro' },
        },
      };
      const result = contentFileSchema.parse(data);
      expect(Object.keys(result.sections)).toHaveLength(3);
    });
  });
});

describe('sharedDescriptionsSchema', () => {
  it('accepts valid shared descriptions', () => {
    const data = {
      descriptions: {
        size: 'Controls the component size.',
        variant: 'Visual style variant.',
      },
    };
    const result = sharedDescriptionsSchema.parse(data);
    expect(result.descriptions.size).toBe('Controls the component size.');
  });

  it('rejects missing descriptions key', () => {
    expect(() => sharedDescriptionsSchema.parse({})).toThrow();
  });
});
