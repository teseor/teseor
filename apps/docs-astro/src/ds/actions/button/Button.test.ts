import { describe, expect, it } from 'vitest';
import { bemClasses } from '../../bem';

describe('Button classes', () => {
  const b = (mods: Record<string, string | boolean | undefined>, extra?: string) =>
    bemClasses('button', mods, extra);

  it('renders base class', () => {
    expect(b({})).toBe('ui-button');
  });

  it.each([
    'secondary',
    'ghost',
    'outline',
    'danger',
    'link',
  ] as const)('renders variant %s', (variant) => {
    expect(b({ variant })).toBe(`ui-button ui-button--${variant}`);
  });

  it.each(['sm', 'md', 'lg'] as const)('renders size %s', (size) => {
    expect(b({ size })).toBe(`ui-button ui-button--${size}`);
  });

  it('renders icon modifier', () => {
    expect(b({ icon: true })).toBe('ui-button ui-button--icon');
  });

  it.each([
    'radius-none',
    'radius-sm',
    'radius-lg',
    'radius-full',
  ] as const)('renders radius %s', (radius) => {
    expect(b({ radius })).toBe(`ui-button ui-button--${radius}`);
  });

  it('renders block modifier', () => {
    expect(b({ block: true })).toBe('ui-button ui-button--block');
  });

  it('renders loading modifier', () => {
    expect(b({ loading: true })).toBe('ui-button ui-button--loading');
  });

  it('combines variant + size + loading', () => {
    expect(b({ variant: 'ghost', size: 'sm', loading: true })).toBe(
      'ui-button ui-button--ghost ui-button--sm ui-button--loading',
    );
  });

  it('appends extra class', () => {
    expect(b({ variant: 'secondary' }, 'my-class')).toBe('ui-button ui-button--secondary my-class');
  });
});
