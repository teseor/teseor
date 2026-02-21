import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildTokenMap, resolveDefaultValue } from '../token-resolver.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VARIABLES_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  'css',
  'src',
  'config',
  'tokens',
  '_variables.scss',
);

// --- Unit tests ---

describe('buildTokenMap', () => {
  it('resolves literal values', () => {
    const scss = '$unit: 0.5rem;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-unit')).toBe('8px');
  });

  it('resolves variable references', () => {
    const scss = `
      $unit: 0.5rem;
      $row: $unit * 2;
      $row-1: $row;
    `;
    const map = buildTokenMap(scss);
    expect(map.get('--ui-row')).toBe('16px');
    expect(map.get('--ui-row-1')).toBe('16px');
  });

  it('resolves chained multiplication', () => {
    const scss = `
      $unit: 0.5rem;
      $row: $unit * 2;
      $row-3: $row * 3;
    `;
    const map = buildTokenMap(scss);
    expect(map.get('--ui-row-3')).toBe('48px');
  });

  it('resolves px values as-is', () => {
    const scss = '$radius-full: 9999px;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-radius-full')).toBe('9999px');
  });

  it('resolves unitless values', () => {
    const scss = '$z-index-overlay: 300;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-z-index-overlay')).toBe('300');
  });

  it('resolves ms values', () => {
    const scss = '$duration-normal: 200ms;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-duration-normal')).toBe('200ms');
  });

  it('resolves em values', () => {
    const scss = '$icon-size-inline: 1em;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-icon-size-inline')).toBe('1em');
  });

  it('resolves percentage values', () => {
    const scss = '$shadow-strength: 20%;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-shadow-strength')).toBe('20%');
  });

  it('resolves negation', () => {
    const scss = `
      $unit: 0.5rem;
      $border-width-base: $unit * 0.125;
      $border-width-md: $border-width-base * 2;
      $focus-ring-offset: -$border-width-md;
    `;
    const map = buildTokenMap(scss);
    expect(map.get('--ui-focus-ring-offset')).toBe('-2px');
  });

  it('resolves zero to "0"', () => {
    const scss = '$z-index-base: 0;';
    const map = buildTokenMap(scss);
    expect(map.get('--ui-z-index-base')).toBe('0');
  });

  it('skips color functions', () => {
    const scss = '$color-primary: oklch(55% 0.22 250);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-color-primary')).toBe(false);
  });

  it('skips hsl colors', () => {
    const scss = '$color-neutral-50: hsl(220 10% 98%);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-color-neutral-50')).toBe(false);
  });

  it('skips rgb colors', () => {
    const scss = '$overlay-bg: rgb(0 0 0 / 0.5);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-overlay-bg')).toBe(false);
  });

  it('skips sass maps', () => {
    const scss = '$sizes: (xs: 8px, sm: 12px);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-sizes')).toBe(false);
  });

  it('skips font stacks', () => {
    const scss = '$font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-font-sans')).toBe(false);
  });

  it('skips cubic-bezier', () => {
    const scss = '$ease-default: cubic-bezier(0.4, 0, 0.2, 1);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-ease-default')).toBe(false);
  });

  it('skips shadow values with embedded colors', () => {
    const scss = '$shadow-sm: 0 1px 2px hsl(220 10% 20% / 0.05);';
    const map = buildTokenMap(scss);
    expect(map.has('--ui-shadow-sm')).toBe(false);
  });
});

describe('resolveDefaultValue', () => {
  const tokenMap = new Map([
    ['--ui-row-2', '32px'],
    ['--ui-row', '16px'],
    ['--ui-z-index-overlay', '300'],
    ['--ui-duration-normal', '200ms'],
    ['--ui-radius-md', '8px'],
  ]);

  it('resolves simple var reference', () => {
    expect(resolveDefaultValue('var(--ui-row-2)', tokenMap)).toBe('32px');
  });

  it('resolves z-index var', () => {
    expect(resolveDefaultValue('var(--ui-z-index-overlay)', tokenMap)).toBe('300');
  });

  it('resolves duration var', () => {
    expect(resolveDefaultValue('var(--ui-duration-normal)', tokenMap)).toBe('200ms');
  });

  it('returns null for unknown var', () => {
    expect(resolveDefaultValue('var(--ui-unknown)', tokenMap)).toBeNull();
  });

  it('returns null for empty default', () => {
    expect(resolveDefaultValue('', tokenMap)).toBeNull();
  });

  it('resolves calc with multiplication', () => {
    expect(resolveDefaultValue('calc(var(--ui-row) * 6)', tokenMap)).toBe('96px');
  });

  it('resolves calc with addition', () => {
    expect(resolveDefaultValue('calc(var(--ui-row) + var(--ui-row-2))', tokenMap)).toBe('48px');
  });

  it('returns null for calc with unknown var', () => {
    expect(resolveDefaultValue('calc(var(--ui-unknown) * 2)', tokenMap)).toBeNull();
  });

  it('returns null for non-var expressions', () => {
    expect(resolveDefaultValue('ease', tokenMap)).toBeNull();
  });

  it('returns null for complex expressions', () => {
    expect(resolveDefaultValue('color-mix(in oklch, red, blue)', tokenMap)).toBeNull();
  });
});

// --- Integration: parse real _variables.scss ---

describe('buildTokenMap with real _variables.scss', () => {
  const variablesContent = readFileSync(VARIABLES_PATH, 'utf-8');
  const tokenMap = buildTokenMap(variablesContent);

  it('resolves grid tokens', () => {
    expect(tokenMap.get('--ui-unit')).toBe('8px');
    expect(tokenMap.get('--ui-row')).toBe('16px');
    expect(tokenMap.get('--ui-row-2')).toBe('32px');
    expect(tokenMap.get('--ui-row-3')).toBe('48px');
    expect(tokenMap.get('--ui-row-6')).toBe('96px');
  });

  it('resolves spacing tokens', () => {
    expect(tokenMap.get('--ui-space-px')).toBe('1px');
    expect(tokenMap.get('--ui-space-quarter')).toBe('2px');
    expect(tokenMap.get('--ui-space-0')).toBe('4px');
    expect(tokenMap.get('--ui-space-1')).toBe('8px');
    expect(tokenMap.get('--ui-space-2')).toBe('16px');
    expect(tokenMap.get('--ui-space-3')).toBe('24px');
  });

  it('resolves font size tokens', () => {
    expect(tokenMap.get('--ui-font-size-xs')).toBe('12px');
    expect(tokenMap.get('--ui-font-size-sm')).toBe('14px');
    expect(tokenMap.get('--ui-font-size-md')).toBe('16px');
    expect(tokenMap.get('--ui-font-size-lg')).toBe('20px');
    expect(tokenMap.get('--ui-font-size-xl')).toBe('24px');
  });

  it('resolves radius tokens', () => {
    expect(tokenMap.get('--ui-radius-sm')).toBe('4px');
    expect(tokenMap.get('--ui-radius-md')).toBe('8px');
    expect(tokenMap.get('--ui-radius-lg')).toBe('16px');
    expect(tokenMap.get('--ui-radius-full')).toBe('9999px');
  });

  it('resolves border width tokens', () => {
    expect(tokenMap.get('--ui-border-width-sm')).toBe('1px');
    expect(tokenMap.get('--ui-border-width-md')).toBe('2px');
    expect(tokenMap.get('--ui-border-width-lg')).toBe('4px');
  });

  it('resolves z-index tokens', () => {
    expect(tokenMap.get('--ui-z-index-base')).toBe('0');
    expect(tokenMap.get('--ui-z-index-overlay')).toBe('300');
    expect(tokenMap.get('--ui-z-index-modal')).toBe('400');
    expect(tokenMap.get('--ui-z-index-tooltip')).toBe('600');
  });

  it('resolves duration tokens', () => {
    expect(tokenMap.get('--ui-duration-fast')).toBe('100ms');
    expect(tokenMap.get('--ui-duration-normal')).toBe('200ms');
    expect(tokenMap.get('--ui-duration-slow')).toBe('250ms');
  });

  it('resolves font weight tokens', () => {
    expect(tokenMap.get('--ui-font-weight-normal')).toBe('400');
    expect(tokenMap.get('--ui-font-weight-bold')).toBe('700');
  });

  it('skips all color tokens', () => {
    expect(tokenMap.has('--ui-color-primary')).toBe(false);
    expect(tokenMap.has('--ui-color-text')).toBe(false);
    expect(tokenMap.has('--ui-overlay-bg')).toBe(false);
  });

  it('skips font family tokens', () => {
    expect(tokenMap.has('--ui-font-sans')).toBe(false);
    expect(tokenMap.has('--ui-font-mono')).toBe(false);
  });

  it('skips shadow tokens', () => {
    expect(tokenMap.has('--ui-shadow-sm')).toBe(false);
    expect(tokenMap.has('--ui-shadow-md')).toBe(false);
  });

  it('produces at least 50 resolved tokens', () => {
    expect(tokenMap.size).toBeGreaterThanOrEqual(50);
  });
});
