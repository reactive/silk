import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';
import { checkThemeContrast } from './checkThemeContrast.js';
import { generatePairedPalette } from './generatePairedPalette.js';
import { generateScale } from './generateScale.js';

test('generateScale validates and canonicalizes seeds', () => {
  expect(() => generateScale('blue', 'light')).toThrow(/Invalid seedHex/);
  expect(() => generateScale('#gg0000', 'light')).toThrow(/Invalid seedHex/);
  expect(() => generateScale('#0ea5e9', 'light', { chromaCap: Number.NaN })).toThrow(
    /chromaCap/,
  );
  expect(() =>
    generateScale('#0ea5e9', 'light', { chromaCap: Number.POSITIVE_INFINITY }),
  ).toThrow(/chromaCap/);
  const scale = generateScale('#09F', 'light');
  for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const) {
    expect(scale[step]).toMatch(/^#[0-9a-f]{6}$/);
  }
});

test('paired palettes preserve recipe invariants', () => {
  const paired = generatePairedPalette('#2563eb', {
    dangerSeedHex: '#e11d48',
  });
  expect(paired.light.blue[9]).not.toBe(paired.light.gray[9]);
  expect(paired.dark.blue[9]).not.toBe(paired.dark.gray[9]);
  // Default green retained; danger overridden in both schemes.
  expect(paired.light.green).toEqual(
    createTheme({ colorScheme: 'light' }).palette.green,
  );
  expect(paired.light.red[9]).not.toBe(
    createTheme({ colorScheme: 'light' }).palette.red[9],
  );
  expect(paired.dark.red[9]).not.toBe(
    createTheme({ colorScheme: 'dark' }).palette.red[9],
  );
});

const TENANT_SEEDS = [
  ['ocean', '#0ea5e9'],
  ['violet', '#7c3aed'],
  ['warm', '#ea580c'],
  ['yellow', '#eab308'],
  ['nearWhite', '#f5f5f5'],
  ['nearBlack', '#1a1a1a'],
  ['lowChroma', '#6b7280'],
] as const;

for (const [name, seed] of TENANT_SEEDS) {
  test(`generated tenant ${name} passes maturity checks in both schemes`, () => {
    const paired = generatePairedPalette(seed);
    for (const scheme of ['light', 'dark'] as const) {
      const theme = createTheme({
        colorScheme: scheme,
        palette: paired[scheme],
      });
      const result = checkThemeContrast(theme);
      expect(
        result,
        `${name}/${scheme}: ${JSON.stringify(result.violations, null, 2)}`,
      ).toMatchObject({ ok: true });
    }
  });
}

// Golden scales: the curves come from Silk's default blue and gray coordinates
// (tokens/paletteOklch.ts), so retuning those moves every tenant palette. This
// makes that show up in review.
test('generateScale golden output for #2563eb', () => {
  expect(Object.values(generateScale('#2563eb', 'light'))).toEqual([
    '#f2f3f6', '#e9edf4', '#dbe3f2', '#cbd9f3', '#b7cbf0', '#a0baeb',
    '#85a6e5', '#608ade', '#2563eb', '#255fdf', '#1f51bf', '#16326c',
  ]);
  expect(Object.values(generateScale('#2563eb', 'dark'))).toEqual([
    '#080e1b', '#09101f', '#091a3e', '#061f58', '#0b2868', '#123278',
    '#1a3f8c', '#224da9', '#2563eb', '#3e77ed', '#6996ee', '#b5c9ee',
  ]);
});
