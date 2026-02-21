import { describe, expect, it } from 'vitest';

import { parseTokensFromContent, resolveToken } from './parse-tokens.js';

describe('parseTokensFromContent', () => {
  it('parses basic $name: value;', () => {
    const content = '$space-1: 0.5rem;';
    const tokens = parseTokensFromContent(content);
    expect(tokens.get('space-1')).toBe('0.5rem');
  });

  it('parses multiple tokens', () => {
    const content = ['$row-1: 1.5rem;', '$row-2: 2rem;', '$row-3: 2.5rem;'].join('\n');
    const tokens = parseTokensFromContent(content);
    expect(tokens.size).toBe(3);
    expect(tokens.get('row-1')).toBe('1.5rem');
    expect(tokens.get('row-2')).toBe('2rem');
    expect(tokens.get('row-3')).toBe('2.5rem');
  });

  it('ignores comments', () => {
    const content = ['// This is a comment', '$unit: 0.5rem;', '// Another comment'].join('\n');
    const tokens = parseTokensFromContent(content);
    expect(tokens.size).toBe(1);
    expect(tokens.get('unit')).toBe('0.5rem');
  });

  it('handles values with trailing comments', () => {
    const content = '$color-primary: blue; // brand color';
    const tokens = parseTokensFromContent(content);
    expect(tokens.get('color-primary')).toBe('blue');
  });

  it('returns empty map for empty content', () => {
    const tokens = parseTokensFromContent('');
    expect(tokens.size).toBe(0);
  });
});

describe('resolveToken', () => {
  it('returns literal values as-is', () => {
    const tokens = new Map();
    expect(resolveToken('transparent', tokens)).toBe('transparent');
    expect(resolveToken('calc(100% - 1rem)', tokens)).toBe('calc(100% - 1rem)');
  });

  it('resolves token references', () => {
    const tokens = new Map([['row-2', '2rem']]);
    expect(resolveToken('--row-2', tokens)).toBe('2rem');
  });

  it('returns - for missing token', () => {
    const tokens = new Map();
    expect(resolveToken('--missing', tokens)).toBe('-');
  });
});
