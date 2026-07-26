import { expect, test } from '@rstest/core';
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
} from './index.js';

function assertRecipeDefaults(recipe: {
  readonly variants: Readonly<Record<string, readonly string[]>>;
  readonly defaults: Readonly<Record<string, string>>;
}): void {
  for (const axis of Object.keys(recipe.variants)) {
    const values = recipe.variants[axis];
    const defaultValue = recipe.defaults[axis];
    expect(values).toBeDefined();
    expect(defaultValue).toBeDefined();
    expect(values).toContain(defaultValue);
  }
}

test('all recipes provide every axis default', () => {
  assertRecipeDefaults(buttonRecipe);
  assertRecipeDefaults(textRecipe);
  assertRecipeDefaults(stackRecipe);
  assertRecipeDefaults(dialogRecipe);
  assertRecipeDefaults(avatarRecipe);
  assertRecipeDefaults(boxRecipe);
  assertRecipeDefaults(inlineRecipe);
  assertRecipeDefaults(gridRecipe);
  assertRecipeDefaults(centerRecipe);
  assertRecipeDefaults(containerRecipe);
  assertRecipeDefaults(separatorRecipe);
});

test('buttonRecipe exposes expected variant axes', () => {
  expect(buttonRecipe.variants.variant).toEqual([
    'solid',
    'soft',
    'outline',
    'ghost',
  ]);
  expect(buttonRecipe.defaults.tone).toBe('accent');
});

test('layout recipes expose expected defaults', () => {
  expect(inlineRecipe.defaults.wrap).toBe('wrap');
  expect(gridRecipe.defaults.columns).toBe('auto');
  expect(containerRecipe.defaults.size).toBe('lg');
  expect(centerRecipe.defaults.axis).toBe('both');
  expect(separatorRecipe.defaults.orientation).toBe('horizontal');
  expect(boxRecipe.defaults.padding).toBe('0');
});
