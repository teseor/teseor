import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateTypes } from '../type-generator.js';
import type { ApiJson } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_ROOT = join(__dirname, '..', '..', '..', 'css', 'src');

function makeApi(overrides: Partial<ApiJson> = {}): ApiJson {
  return {
    $schema: 'test',
    name: 'test',
    element: 'div',
    modifiers: {},
    cssVars: [],
    ...overrides,
  };
}

describe('generateTypes', () => {
  describe('modifiers interface', () => {
    it('generates boolean modifier', () => {
      const api = makeApi({
        name: 'button',
        modifiers: { block: { type: 'boolean' } },
      });
      const output = generateTypes([api]);
      expect(output).toContain('export interface ButtonModifiers {');
      expect(output).toContain('  block?: boolean;');
    });

    it('generates value-based modifier', () => {
      const api = makeApi({
        name: 'button',
        modifiers: { size: { values: ['sm', 'md', 'lg'] } },
      });
      const output = generateTypes([api]);
      expect(output).toContain("  size?: 'sm' | 'md' | 'lg';");
    });

    it('quotes hyphenated property names', () => {
      const api = makeApi({
        name: 'input',
        modifiers: { 'auto-size': { type: 'boolean' } },
      });
      const output = generateTypes([api]);
      expect(output).toContain("  'auto-size'?: boolean;");
    });

    it('skips interface when no modifiers', () => {
      const api = makeApi({ name: 'spacer', modifiers: {} });
      const output = generateTypes([api]);
      expect(output).not.toContain('SpacerModifiers');
    });
  });

  describe('modifier keys array', () => {
    it('generates keys array', () => {
      const api = makeApi({
        name: 'button',
        modifiers: {
          size: { values: ['sm', 'lg'] },
          block: { type: 'boolean' },
        },
      });
      const output = generateTypes([api]);
      expect(output).toContain("export const buttonModifierKeys = ['size', 'block'] as const;");
    });

    it('skips keys array when no modifiers', () => {
      const api = makeApi({ name: 'spacer', modifiers: {} });
      const output = generateTypes([api]);
      expect(output).not.toContain('spacerModifierKeys');
    });
  });

  describe('element tag', () => {
    it('generates element constant', () => {
      const api = makeApi({ name: 'button', element: 'button' });
      const output = generateTypes([api]);
      expect(output).toContain("export const buttonElement = 'button' as const;");
    });

    it('handles div element', () => {
      const api = makeApi({ name: 'card', element: 'div' });
      const output = generateTypes([api]);
      expect(output).toContain("export const cardElement = 'div' as const;");
    });
  });

  describe('elements', () => {
    it('generates elements array', () => {
      const api = makeApi({
        name: 'card',
        elements: { media: {}, body: {} },
      });
      const output = generateTypes([api]);
      expect(output).toContain("export const cardElements = ['media', 'body'] as const;");
    });

    it('generates element modifier interface', () => {
      const api = makeApi({
        name: 'button',
        elements: {
          icon: {
            modifiers: {
              start: { type: 'boolean' },
              end: { type: 'boolean' },
            },
          },
        },
      });
      const output = generateTypes([api]);
      expect(output).toContain('export interface ButtonIconModifiers {');
      expect(output).toContain('  start?: boolean;');
      expect(output).toContain('  end?: boolean;');
    });

    it('skips interface for elements without modifiers', () => {
      const api = makeApi({
        name: 'card',
        elements: { media: {}, body: {} },
      });
      const output = generateTypes([api]);
      expect(output).not.toContain('CardMediaModifiers');
      expect(output).not.toContain('CardBodyModifiers');
    });

    it('skips elements array when no elements', () => {
      const api = makeApi({ name: 'column' });
      const output = generateTypes([api]);
      expect(output).not.toContain('columnElements');
    });
  });

  describe('naming', () => {
    it('handles kebab-case component names', () => {
      const api = makeApi({
        name: 'close-button',
        element: 'button',
        modifiers: { size: { values: ['sm', 'lg'] } },
      });
      const output = generateTypes([api]);
      expect(output).toContain('export interface CloseButtonModifiers {');
      expect(output).toContain('export const closeButtonModifierKeys');
      expect(output).toContain('export const closeButtonElement');
    });

    it('handles multi-part kebab names', () => {
      const api = makeApi({
        name: 'dropdown-menu',
        element: 'div',
        modifiers: { open: { type: 'boolean' } },
      });
      const output = generateTypes([api]);
      expect(output).toContain('export interface DropdownMenuModifiers {');
      expect(output).toContain('export const dropdownMenuModifierKeys');
    });
  });

  describe('sorting', () => {
    it('sorts components alphabetically', () => {
      const apis = [
        makeApi({ name: 'card' }),
        makeApi({ name: 'alert' }),
        makeApi({ name: 'button' }),
      ];
      const output = generateTypes(apis);
      const alertIdx = output.indexOf('// --- alert ---');
      const buttonIdx = output.indexOf('// --- button ---');
      const cardIdx = output.indexOf('// --- card ---');
      expect(alertIdx).toBeLessThan(buttonIdx);
      expect(buttonIdx).toBeLessThan(cardIdx);
    });
  });

  describe('output format', () => {
    it('starts with auto-generated header', () => {
      const output = generateTypes([makeApi()]);
      expect(output).toMatch(/^\/\/ Auto-generated from api\.json/);
    });

    it('ends with newline', () => {
      const output = generateTypes([makeApi()]);
      expect(output).toMatch(/\n$/);
    });
  });
});

// --- Integration: generate types from all real api.json files ---

interface DirEntry {
  name: string;
  path: string;
}

function findDirs(baseDir: string): DirEntry[] {
  const dirs: DirEntry[] = [];
  if (!existsSync(baseDir)) return dirs;

  for (const entry of readdirSync(baseDir)) {
    if (entry.startsWith('.') || entry === 'index.scss') continue;
    const p = join(baseDir, entry);
    if (!statSync(p).isDirectory()) continue;
    if (existsSync(join(p, 'api.json'))) {
      dirs.push({ name: entry, path: p });
    } else {
      dirs.push(...findDirs(p));
    }
  }
  return dirs;
}

describe('generateTypes with all real api.json', () => {
  const components = findDirs(join(CSS_ROOT, 'components'));
  const layouts = findDirs(join(CSS_ROOT, 'layout'));
  const allDirs = [...components, ...layouts];

  const apis: ApiJson[] = allDirs.map(({ path }) => {
    return JSON.parse(readFileSync(join(path, 'api.json'), 'utf-8'));
  });

  const output = generateTypes(apis);

  it('produces non-empty output', () => {
    expect(output.length).toBeGreaterThan(500);
  });

  it('generates an entry for every component', () => {
    for (const api of apis) {
      expect(output).toContain(`// --- ${api.name} ---`);
    }
  });

  it('is valid TypeScript syntax (no unclosed braces)', () => {
    const opens = (output.match(/\{/g) || []).length;
    const closes = (output.match(/\}/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('generates at least 60 element constants', () => {
    const matches = output.match(/export const \w+Element = /g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(60);
  });

  it('generates modifier interfaces for components with modifiers', () => {
    const withModifiers = apis.filter((a) => Object.keys(a.modifiers).length > 0);
    for (const api of withModifiers) {
      const pascal = api.name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
      expect(output).toContain(`export interface ${pascal}Modifiers {`);
    }
  });
});
