import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avatarRecipe,
  boxRecipe,
  buttonRecipe,
  centerRecipe,
  containerRecipe,
  dialogRecipe,
  gridRecipe,
  inlineRecipe,
  separatorRecipe,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { containerBreakpointNames } from '../layout/containerBreakpoints';

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/index.css',
);

function loadCss(): string {
  return readFileSync(cssPath, 'utf8');
}

function assertAxisSelectors(
  css: string,
  attr: string,
  values: readonly string[],
): void {
  for (const value of values) {
    expect(css).toContain(`${attr}="${value}"`);
  }
}

test('recipe conformance: every Button variant value has a CSS rule', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-variant', buttonRecipe.variants.variant);
  assertAxisSelectors(css, 'data-tone', buttonRecipe.variants.tone);
  assertAxisSelectors(css, 'data-size', buttonRecipe.variants.size);
  assertAxisSelectors(css, 'data-density', buttonRecipe.variants.density);
});

test('recipe conformance: Text, Stack, Avatar, Dialog axes are styled', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-role', textRecipe.variants.role);
  assertAxisSelectors(css, 'data-direction', stackRecipe.variants.direction);
  assertAxisSelectors(css, 'data-gap', stackRecipe.variants.gap);
  assertAxisSelectors(css, 'data-align', stackRecipe.variants.align);
  assertAxisSelectors(css, 'data-wrap', stackRecipe.variants.wrap);
  assertAxisSelectors(css, 'data-size', avatarRecipe.variants.size);
  assertAxisSelectors(css, 'data-shape', avatarRecipe.variants.shape);
  assertAxisSelectors(css, 'data-size', dialogRecipe.variants.size);
});

test('recipe conformance: layout component axes are styled', () => {
  const css = loadCss();
  assertAxisSelectors(css, 'data-padding', boxRecipe.variants.padding);
  assertAxisSelectors(css, 'data-gap', inlineRecipe.variants.gap);
  assertAxisSelectors(css, 'data-align', inlineRecipe.variants.align);
  assertAxisSelectors(css, 'data-justify', inlineRecipe.variants.justify);
  assertAxisSelectors(css, 'data-wrap', inlineRecipe.variants.wrap);
  assertAxisSelectors(css, 'data-columns', gridRecipe.variants.columns);
  assertAxisSelectors(css, 'data-axis', centerRecipe.variants.axis);
  assertAxisSelectors(css, 'data-size', containerRecipe.variants.size);
  assertAxisSelectors(css, 'data-padding', containerRecipe.variants.padding);
  assertAxisSelectors(
    css,
    'data-orientation',
    separatorRecipe.variants.orientation,
  );
});

test('density remaps space vars and collapseBelow container queries exist', () => {
  const css = loadCss();
  expect(css).toContain('--silk-space-compact-2');
  expect(css).toContain('--silk-space-comfortable-2');
  expect(css).toContain('data-density="compact"');
  expect(css).toContain('data-density="comfortable"');
  // Effective aliases must come from densityClass, not themeToCssVars inline/theme blocks.
  expect(css).toMatch(
    /--silk-space-2:\s*var\(--silk-space-comfortable-2\)/,
  );
  expect(css).toMatch(/--silk-space-2:\s*var\(--silk-space-compact-2\)/);
  for (const name of containerBreakpointNames) {
    expect(css).toContain(`data-collapse-below="${name}"`);
  }
  expect(css).toContain('@container');
});
