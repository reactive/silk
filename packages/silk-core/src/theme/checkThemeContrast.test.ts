import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';
import { checkThemeContrast } from './checkThemeContrast.js';
import { contrastRatio, relativeLuminance } from './colorMath.js';

test('checker reports all diagnostic kinds without throwing', () => {
  const theme = createTheme({
    semantic: {
      color: {
        surface: 'oklch(100% 0 0)',
        textPrimary: '#000000',
        tones: {
          accent: {
            solid: '#cccccc',
            onSolid: '#ffffff',
            hover: '#cccccc',
            active: '#cccccc',
          },
        },
      },
    },
  });
  const result = checkThemeContrast(theme);
  expect(result.ok).toBe(false);
  const kinds = new Set(result.violations.map((v) => v.kind));
  expect(kinds.has('unsupported-color')).toBe(true);
  expect(kinds.has('contrast') || kinds.has('distinctness')).toBe(true);
});

test('canonical hex forms are not treated as distinct', () => {
  const theme = createTheme({
    semantic: {
      color: {
        surface: '#ffffff',
        surfaceRaised: '#fff',
      },
    },
  });
  const result = checkThemeContrast(theme);
  expect(
    result.violations.some(
      (v) =>
        v.kind === 'distinctness' &&
        v.paths.includes('color.surface') &&
        v.paths.includes('color.surfaceRaised'),
    ),
  ).toBe(true);
});

test('identical primary/secondary text fails distinctness', () => {
  const theme = createTheme({
    semantic: {
      color: {
        textPrimary: '#202020',
        textSecondary: '#202020',
      },
    },
  });
  const result = checkThemeContrast(theme);
  expect(
    result.violations.some(
      (v) =>
        v.kind === 'distinctness' &&
        v.paths.includes('color.textPrimary') &&
        v.paths.includes('color.textSecondary'),
    ),
  ).toBe(true);
});

test('chromatic text reports each surface contrast failure once', () => {
  const theme = createTheme({
    semantic: {
      color: {
        surface: '#ffffff',
        tones: { accent: { text: '#ffffff' } },
      },
    },
  });
  const result = checkThemeContrast(theme);
  const pageSurfaceFailures = result.violations.filter(
    (violation) =>
      violation.kind === 'contrast' &&
      violation.pathFg === 'color.tones.accent.text' &&
      violation.pathBg === 'color.surface',
  );
  expect(pageSurfaceFailures).toHaveLength(1);
});

test('contrastRatio and relativeLuminance are hex-only', () => {
  expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  expect(relativeLuminance('rgb(255,255,255)')).toBeNull();
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(contrastRatio('black', 'white')).toBeNull();
});
