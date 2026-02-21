import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseScssContent } from '../parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_ROOT = join(__dirname, '..', '..', '..', 'css', 'src');

// --- Unit tests for parser correctness ---

describe('parseScssContent', () => {
  describe('component annotations', () => {
    it('extracts component name from @component', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens { .button { --_h: 32px; } }
        @layer components.styles { .button { height: var(--_h); } }
      `;
      const result = parseScssContent(scss, 'fallback', false);
      expect(result.name).toBe('button');
      expect(result.element).toBe('button');
    });

    it('uses folder name when @component is missing', () => {
      const scss = `
        @layer components.tokens { .alert { --_h: 32px; } }
        @layer components.styles { .alert { height: var(--_h); } }
      `;
      const result = parseScssContent(scss, 'alert', false);
      expect(result.name).toBe('alert');
      expect(result.element).toBe('div');
    });
  });

  describe('modifier extraction', () => {
    it('extracts boolean modifiers', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens {
          .button { --_h: 32px; }
          // @modifier boolean block
          // @modifier boolean loading
        }
        @layer components.styles {
          .button { height: var(--_h); }
          .button--block { width: 100%; }
          .button--loading { opacity: 0.5; }
        }
      `;
      const result = parseScssContent(scss, 'button', false);
      expect(result.modifiers.block).toEqual({ type: 'boolean' });
      expect(result.modifiers.loading).toEqual({ type: 'boolean' });
    });

    it('extracts grouped modifiers from selectors', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens {
          .button { --_h: 32px; }
          // @modifier size
          .button--sm { --_h: 24px; }
          .button--lg { --_h: 40px; }
        }
        @layer components.styles { .button { height: var(--_h); } }
      `;
      const result = parseScssContent(scss, 'button', false);
      expect(result.modifiers.size).toEqual({ values: ['sm', 'lg'] });
    });

    it('extracts explicit values from annotation', () => {
      const scss = `
        // @component icon
        // @element svg
        @layer components.tokens {
          .icon { --_s: 16px; }
          // @modifier size xs, sm, md, lg, xl
        }
        @layer components.styles { .icon { width: var(--_s); } }
      `;
      const result = parseScssContent(scss, 'icon', false);
      expect(result.modifiers.size).toEqual({ values: ['xs', 'sm', 'md', 'lg', 'xl'] });
    });

    it('excludes pseudo-classes from block modifiers', () => {
      const scss = `
        // @component btn
        // @element button
        @layer components.tokens {
          .btn { --_bg: red; }
          // @modifier variant
          .btn--ghost { --_bg: transparent; }
        }
        @layer components.styles {
          .btn { background: var(--_bg); }
          .btn--hover { background: blue; }
          .btn--focus { outline: 2px solid; }
        }
      `;
      const result = parseScssContent(scss, 'btn', false);
      expect(result.modifiers.variant).toEqual({ values: ['ghost'] });
      expect(result.modifiers.hover).toBeUndefined();
      expect(result.modifiers.focus).toBeUndefined();
    });

    it('does not leak boolean modifier names into group values', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens {
          .button { --_h: 32px; }
          // @modifier size
          .button--sm { --_h: 24px; }
          .button--lg { --_h: 40px; }
          // @modifier boolean loading
        }
        @layer components.styles {
          .button { height: var(--_h); }
          .button--loading { opacity: 0.5; }
        }
      `;
      const result = parseScssContent(scss, 'button', false);
      expect(result.modifiers.size).toEqual({ values: ['sm', 'lg'] });
      expect(result.modifiers.loading).toEqual({ type: 'boolean' });
    });

    it('handles multiple groups correctly', () => {
      const scss = `
        // @component badge
        // @element span
        @layer components.tokens {
          .badge { --_bg: gray; }
          // @modifier variant
          .badge--success { --_bg: green; }
          .badge--danger { --_bg: red; }
          // @modifier size
          .badge--sm { font-size: 12px; }
          .badge--lg { font-size: 18px; }
        }
        @layer components.styles { .badge { background: var(--_bg); } }
      `;
      const result = parseScssContent(scss, 'badge', false);
      expect(result.modifiers.variant).toEqual({ values: ['success', 'danger'] });
      expect(result.modifiers.size).toEqual({ values: ['sm', 'lg'] });
    });
  });

  describe('element extraction', () => {
    it('extracts BEM elements', () => {
      const scss = `
        // @component card
        // @element div
        @layer components.tokens { .card { --_p: 16px; } }
        @layer components.styles {
          .card { padding: var(--_p); }
          .card__media { overflow: hidden; }
          .card__body { flex: 1; }
        }
      `;
      const result = parseScssContent(scss, 'card', false);
      expect(result.elements).toEqual({ media: {}, body: {} });
    });

    it('extracts element modifiers from direct selectors', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens { .button { --_h: 32px; } }
        @layer components.styles {
          .button { height: var(--_h); }
          .button__icon { flex-shrink: 0; }
          .button__icon--start { order: -1; }
          .button__icon--end { order: 1; }
        }
      `;
      const result = parseScssContent(scss, 'button', false);
      expect(result.elements).toEqual({
        icon: {
          modifiers: {
            start: { type: 'boolean' },
            end: { type: 'boolean' },
          },
        },
      });
    });

    it('extracts nested element modifiers (active is valid)', () => {
      const scss = `
        // @component tabs
        // @element div
        @layer components.tokens { .tabs { --_h: 40px; } }
        @layer components.styles {
          .tabs { display: flex; }
          .tabs__tab {
            cursor: pointer;
            &--active { color: blue; }
          }
          .tabs__panel {
            display: none;
            &--active { display: block; }
          }
        }
      `;
      const result = parseScssContent(scss, 'tabs', false);
      expect(result.elements?.tab?.modifiers?.active).toEqual({ type: 'boolean' });
      expect(result.elements?.panel?.modifiers?.active).toEqual({ type: 'boolean' });
    });
  });

  describe('CSS var extraction', () => {
    it('extracts component CSS vars with defaults', () => {
      const scss = `
        // @component button
        // @element button
        @layer components.tokens {
          .button {
            // @desc Overall height
            --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2}));
          }
        }
        @layer components.styles { .button { height: var(--_height); } }
      `;
      const result = parseScssContent(scss, 'button', false);
      expect(result.cssVars).toEqual([
        {
          name: '--ui-button-height',
          default: 'var(--ui-row-2)',
          description: 'Overall height',
        },
      ]);
    });

    it('extracts multiple CSS vars', () => {
      const scss = `
        // @component alert
        // @element div
        @layer components.tokens {
          .alert {
            --_bg: var(--ui-alert-bg, var(--ui-color-bg, #{t.$color-bg}));
            --_radius: var(--ui-alert-radius, var(--ui-radius-md, #{t.$radius-md}));
          }
        }
        @layer components.styles { .alert { background: var(--_bg); } }
      `;
      const result = parseScssContent(scss, 'alert', false);
      expect(result.cssVars).toHaveLength(2);
      expect(result.cssVars[0].name).toBe('--ui-alert-bg');
      expect(result.cssVars[1].name).toBe('--ui-alert-radius');
    });
  });

  describe('layout parsing', () => {
    it('uses primitives layer for layouts', () => {
      const scss = `
        // @component box
        // @element div
        @layer primitives {
          .box { display: block; }
          // @modifier boolean rounded
          .box--rounded { border-radius: 8px; }
        }
      `;
      const result = parseScssContent(scss, 'box', true);
      expect(result.modifiers.rounded).toEqual({ type: 'boolean' });
    });
  });

  describe('related components', () => {
    it('extracts related component modifiers and elements', () => {
      const scss = `
        // @component dropdown-menu
        // @element div
        // @related menu
        @layer components.tokens { .dropdown-menu { --_z: 100; } }
        @layer components.styles {
          .dropdown-menu { z-index: var(--_z); }
          .menu--compact { padding: 4px; }
          .menu__item { cursor: pointer; }
          .menu__item--active { background: blue; }
        }
      `;
      const result = parseScssContent(scss, 'dropdown-menu', false);
      expect(result.relatedComponents).toEqual([
        {
          name: 'menu',
          modifiers: { compact: { type: 'boolean' } },
          elements: {
            item: {
              modifiers: { active: { type: 'boolean' } },
            },
          },
        },
      ]);
    });
  });
});

// --- Integration: parse all real SCSS files ---

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
    if (existsSync(join(p, 'index.scss'))) {
      dirs.push({ name: entry, path: p });
    } else {
      dirs.push(...findDirs(p));
    }
  }
  return dirs;
}

describe('parse all SCSS files without errors', () => {
  const components = findDirs(join(CSS_ROOT, 'components'));
  const layouts = findDirs(join(CSS_ROOT, 'layout'));

  for (const { name, path } of components) {
    it(`component: ${name}`, () => {
      const scss = readFileSync(join(path, 'index.scss'), 'utf-8');
      const result = parseScssContent(scss, name, false);

      expect(result.name).toBeTruthy();
      expect(result.element).toBeTruthy();
      expect(result.modifiers).toBeDefined();
      expect(result.cssVars).toBeInstanceOf(Array);
    });
  }

  for (const { name, path } of layouts) {
    it(`layout: ${name}`, () => {
      const scss = readFileSync(join(path, 'index.scss'), 'utf-8');
      const result = parseScssContent(scss, name, true);

      expect(result.name).toBeTruthy();
      expect(result.element).toBeTruthy();
      expect(result.modifiers).toBeDefined();
      expect(result.cssVars).toBeInstanceOf(Array);
    });
  }
});
