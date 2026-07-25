import { expect, test } from '@rstest/core';
import {
  avatarRecipe,
  buttonRecipe,
  dialogRecipe,
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
