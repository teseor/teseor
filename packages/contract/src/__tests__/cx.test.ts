import { describe, expect, it } from 'vitest';
import { cx } from '../cx';

describe('cx', () => {
  it('returns base class with ui- prefix', () => {
    expect(cx('button')).toBe('ui-button');
  });

  it('handles enum modifier (string value)', () => {
    expect(cx('button', { variant: 'ghost' })).toBe('ui-button ui-button--ghost');
  });

  it('handles multiple modifiers', () => {
    expect(cx('button', { size: 'sm', loading: true })).toBe(
      'ui-button ui-button--sm ui-button--loading',
    );
  });

  it('omits false boolean modifiers', () => {
    expect(cx('button', { icon: false })).toBe('ui-button');
  });

  it('omits undefined and null values', () => {
    expect(cx('button', { size: undefined, variant: null })).toBe('ui-button');
  });

  it('omits empty string values', () => {
    expect(cx('button', { variant: '' })).toBe('ui-button');
  });

  it('works with BEM element notation', () => {
    expect(cx('button__icon')).toBe('ui-button__icon');
  });

  it('handles element with boolean modifier', () => {
    expect(cx('button__icon', { start: true })).toBe('ui-button__icon ui-button__icon--start');
  });

  it('handles hyphenated block names', () => {
    expect(cx('button-group')).toBe('ui-button-group');
  });

  it('handles hyphenated modifier keys', () => {
    expect(cx('input', { 'auto-size': true })).toBe('ui-input ui-input--auto-size');
  });

  it('returns only base class when no modifiers provided', () => {
    expect(cx('card', undefined)).toBe('ui-card');
  });

  it('returns only base class for empty modifiers object', () => {
    expect(cx('card', {})).toBe('ui-card');
  });
});
