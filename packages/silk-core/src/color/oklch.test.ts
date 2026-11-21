import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@rstest/core';
import { oklabToRgb, rgbToOklab } from './oklab.js';
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

test('oklch throws on input out of range', () => {
  for (const args of [
    [64.9, 0.193, 251.8],
    [-0.1, 0, 0],
    [Number.NaN, 0, 0],
    [0.5, -0.1, 0],
    [0.5, Infinity, 0],
    [0.5, 0.1, Number.NaN],
    [0, 0, 0, 2],
    [0, 0, 0, -0.5],
  ] as const) {
    expect(() => oklch(...args)).toThrow(RangeError);
  }
});

test('the color module imports nothing outside its folder', () => {
  const folder = new URL('./', import.meta.url);
  for (const file of readdirSync(folder)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    const source = readFileSync(new URL(file, folder), 'utf8');
    const specifiers = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;
    for (const [, from] of source.matchAll(specifiers)) {
      expect([file, from!.startsWith('./')]).toEqual([file, true]);
    }
  }
});

test('OKLab conversions round-trip sRGB', () => {
  for (const [r, g, b, hex] of [
    [0, 144, 255, '#0090ff'],
    [229, 72, 77, '#e5484d'],
    [32, 32, 32, '#202020'],
  ] as const) {
    expect(oklabToRgb(rgbToOklab(r, g, b))).toBe(hex);
  }
});
