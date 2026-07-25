import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avatarRecipe,
  buttonRecipe,
  dialogRecipe,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';

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
  assertAxisSelectors(css, 'data-size', avatarRecipe.variants.size);
  assertAxisSelectors(css, 'data-shape', avatarRecipe.variants.shape);
  assertAxisSelectors(css, 'data-size', dialogRecipe.variants.size);
});
