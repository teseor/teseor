import { describe, expect, it } from 'vitest';
import {
  buildComponentNameSet,
  loadContent,
  parseContentYaml,
  parseSharedYaml,
  validateContent,
} from '../content-loader.js';
import type { ApiJson } from '../types.js';

function makeApi(overrides: Partial<ApiJson> = {}): ApiJson {
  return {
    $schema: 'test',
    name: 'button',
    element: 'button',
    modifiers: {},
    cssVars: [],
    ...overrides,
  };
}

const SHARED_YAML = `
descriptions:
  size: Controls the component size.
  variant: Visual style variant.
  block: Stretches to full container width.
`;

describe('parseContentYaml', () => {
  it('parses valid YAML', () => {
    const yaml = `
description: A button component.
sections:
  sizes:
    modifier: size
    layout: row
`;
    const result = parseContentYaml(yaml);
    expect(result.description).toBe('A button component.');
    expect(result.sections.sizes).toHaveProperty('modifier', 'size');
  });

  it('throws on invalid YAML', () => {
    expect(() => parseContentYaml('not: [valid')).toThrow();
  });

  it('throws on missing description', () => {
    const yaml = `
sections:
  x:
    modifier: size
`;
    expect(() => parseContentYaml(yaml)).toThrow();
  });
});

describe('parseSharedYaml', () => {
  it('parses valid shared descriptions', () => {
    const result = parseSharedYaml(SHARED_YAML);
    expect(result.descriptions.size).toBe('Controls the component size.');
  });
});

describe('validateContent', () => {
  const shared = parseSharedYaml(SHARED_YAML);
  const knownComponents = new Set(['Button', 'ButtonIcon', 'Alert', 'AlertContent']);

  describe('modifier coverage', () => {
    it('passes when all modifiers documented', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          block: { type: 'boolean' },
        },
      });
      const content = parseContentYaml(`
description: Buttons.
sections:
  sizes:
    modifier: size
  block:
    modifier: block
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(0);
    });

    it('errors on missing modifier coverage', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          block: { type: 'boolean' },
        },
      });
      const content = parseContentYaml(`
description: Buttons.
sections:
  sizes:
    modifier: size
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("modifier 'block'");
      expect(errors[0].message).toContain("visibility: 'internal'");
      expect(errors[0].message).not.toContain('@nodoc');
    });

    it('skips internal modifiers for coverage', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          entering: { type: 'boolean', visibility: 'internal' },
        },
      });
      const content = parseContentYaml(`
description: Component.
sections:
  sizes:
    modifier: size
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(0);
    });
  });

  describe('modifier validation', () => {
    it('errors on unknown modifier in auto section', () => {
      const api = makeApi({ modifiers: { size: { values: ['sm'] } } });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
  bad:
    modifier: nonexistent
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes("'nonexistent'"))).toBe(true);
    });

    it('errors on invalid combine keys', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm'] },
          variant: { values: ['ghost'] },
        },
      });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
    combine:
      - { badkey: value }
  variants:
    modifier: variant
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes("'badkey'"))).toBe(true);
    });

    it('errors on invalid combine values', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          variant: { values: ['ghost'] },
        },
      });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
    combine:
      - { variant: nonexistent }
  variants:
    modifier: variant
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(
        errors.some((e) => e.message.includes("'nonexistent'") && e.message.includes('variant')),
      ).toBe(true);
    });

    it('allows empty combine entries', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          variant: { values: ['ghost'] },
        },
      });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
    combine:
      - {}
      - { variant: ghost }
  variants:
    modifier: variant
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(0);
    });

    it('skips value validation for boolean modifiers', () => {
      const api = makeApi({
        modifiers: {
          size: { values: ['sm', 'lg'] },
          block: { type: 'boolean' },
        },
      });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
    combine:
      - { block: true }
  block:
    modifier: block
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(0);
    });
  });

  describe('component name validation', () => {
    it('passes with known component names', () => {
      const api = makeApi({ modifiers: {} });
      const content = parseContentYaml(`
description: Test.
sections:
  default:
    examples:
      - component: Button
        text: Click
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors).toHaveLength(0);
    });

    it('errors on unknown component name', () => {
      const api = makeApi({ modifiers: {} });
      const content = parseContentYaml(`
description: Test.
sections:
  default:
    examples:
      - component: NonExistent
        text: Click
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes("'NonExistent'"))).toBe(true);
    });

    it('validates nested component names', () => {
      const api = makeApi({ modifiers: {} });
      const content = parseContentYaml(`
description: Test.
sections:
  default:
    examples:
      - component: Alert
        children:
          - component: FakeChild
            text: Oops
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes("'FakeChild'"))).toBe(true);
    });

    it('validates template component names', () => {
      const api = makeApi({ modifiers: { size: { values: ['sm'] } } });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: size
    template:
      component: FakeTabs
      children:
        - component: Button
          text: hi
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes("'FakeTabs'"))).toBe(true);
    });
  });

  describe('shared ref validation', () => {
    it('passes with valid shared refs', () => {
      const api = makeApi({ modifiers: {} });
      const content = parseContentYaml(`
description: Test.
sections:
  sizes:
    modifier: nonexistent
    description: "$shared.size"
`);
      const errors = validateContent(content, api, shared, knownComponents);
      const sharedErrors = errors.filter((e) => e.message.includes('shared'));
      expect(sharedErrors).toHaveLength(0);
    });

    it('errors on invalid shared refs', () => {
      const api = makeApi({ modifiers: {} });
      const content = parseContentYaml(`
description: Test.
sections:
  x:
    modifier: y
    description: "$shared.nonexistent"
`);
      const errors = validateContent(content, api, shared, knownComponents);
      expect(errors.some((e) => e.message.includes('$shared.nonexistent'))).toBe(true);
    });
  });
});

describe('buildComponentNameSet', () => {
  it('generates PascalCase names from api.json', () => {
    const apis = [
      makeApi({ name: 'button', elements: { icon: {} } }),
      makeApi({ name: 'close-button' }),
      makeApi({ name: 'alert', elements: { content: {}, title: {}, description: {}, close: {} } }),
    ];
    const names = buildComponentNameSet(apis);
    expect(names.has('Button')).toBe(true);
    expect(names.has('ButtonIcon')).toBe(true);
    expect(names.has('CloseButton')).toBe(true);
    expect(names.has('Alert')).toBe(true);
    expect(names.has('AlertContent')).toBe(true);
    expect(names.has('AlertTitle')).toBe(true);
    expect(names.has('AlertDescription')).toBe(true);
    expect(names.has('AlertClose')).toBe(true);
  });
});

describe('loadContent', () => {
  it('full pipeline: parse, resolve shared refs, validate', () => {
    const yaml = `
description: "$shared.variant"
sections:
  sizes:
    modifier: size
    layout: row
    description: "$shared.size"
  variants:
    modifier: variant
`;
    const api = makeApi({
      modifiers: {
        size: { values: ['sm', 'lg'] },
        variant: { values: ['ghost'] },
      },
    });
    const result = loadContent(yaml, api, SHARED_YAML, [api]);
    expect(result.content.description).toBe('Visual style variant.');
    expect(result.errors).toHaveLength(0);
  });

  it('reports validation errors', () => {
    const yaml = `
description: Test.
sections:
  sizes:
    modifier: nonexistent
`;
    const api = makeApi({ modifiers: { size: { values: ['sm'] } } });
    const result = loadContent(yaml, api, SHARED_YAML, [api]);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
