import { expect, test } from '@rstest/core';
import { createTheme } from './createTheme.js';
import { checkThemeContrast } from './checkThemeContrast.js';

/**
 * Stage 2/5 maturity gate: default themes satisfy the full contrast contract.
 * Detailed diagnostics live in `checkThemeContrast`; this file keeps the
 * per-scheme readability of the original Stage 2 suite.
 */
for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme}: default theme passes checkThemeContrast`, () => {
    const result = checkThemeContrast(createTheme({ colorScheme: scheme }));
    expect(result.violations).toEqual([]);
    expect(result.ok).toBe(true);
  });
}
