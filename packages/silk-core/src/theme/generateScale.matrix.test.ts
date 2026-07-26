import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';
import { checkThemeContrast } from './checkThemeContrast.js';
import { generatePairedPalette } from './generatePairedPalette.js';
import { generateScale } from './generateScale.js';

/** Broad seed matrix spanning hue, lightness, and chroma — Stage 5 stability gate. */
const MATRIX_SEEDS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#78716c',
  '#fafafa',
  '#171717',
  '#7c3aed',
  '#65a30d',
  '#0891b2',
  '#b45309',
] as const;

test('generateScale is deterministic for a fixed seed', () => {
  const a = generateScale('#2563eb', 'light');
  const b = generateScale('#2563EB', 'light');
  expect(a).toEqual(b);
  expect(generateScale('#2563eb', 'dark')).toEqual(
    generateScale('#2563eb', 'dark'),
  );
});

test('hue/lightness/chroma matrix paired themes pass checkThemeContrast', () => {
  const failures: string[] = [];
  for (const seed of MATRIX_SEEDS) {
    const paired = generatePairedPalette(seed);
    for (const scheme of ['light', 'dark'] as const) {
      const result = checkThemeContrast(
        createTheme({ colorScheme: scheme, palette: paired[scheme] }),
      );
      if (!result.ok) {
        failures.push(
          `${seed}/${scheme}: ${JSON.stringify(result.violations)}`,
        );
      }
    }
  }
  expect(failures).toEqual([]);
});

test('golden contract: ocean brand step roles stay contrast-safe', () => {
  const scale = generateScale('#0ea5e9', 'light');
  const theme = createTheme({
    colorScheme: 'light',
    palette: { blue: scale },
  });
  expect(checkThemeContrast(theme).ok).toBe(true);
  expect(scale[11]).toMatch(/^#[0-9a-f]{6}$/);
  expect(scale[12]).not.toBe(scale[11]);
});
