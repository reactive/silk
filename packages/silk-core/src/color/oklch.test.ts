import { expect, test } from '@rstest/core';
import { oklch } from './oklch.js';

test('oklch returns the sRGB hex of an OKLCH color', () => {
  expect(oklch(1, 0, 0)).toBe('#ffffff');
  expect(oklch(0, 0, 0)).toBe('#000000');
  expect(oklch(0.649, 0.193, 251.8)).toBe('#0090ff');
  expect(oklch(0.626, 0.193, 23)).toBe('#e5484d');
});

test('oklch with alpha returns rgba()', () => {
  expect(oklch(0, 0, 0, 0.45)).toBe('rgba(0, 0, 0, 0.45)');
});

test('oklch clips colors outside sRGB', () => {
  expect(oklch(0.9, 0.4, 145)).toMatch(/^#[0-9a-f]{6}$/);
});
