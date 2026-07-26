import { expect, test } from '@rstest/core';
import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
  centerRecipe,
  checkboxRecipe,
  containerRecipe,
  dialogRecipe,
  gridRecipe,
  headingRecipe,
  inlineRecipe,
  inputRecipe,
  progressRecipe,
  radioGroupRecipe,
  separatorRecipe,
  skeletonRecipe,
  sliderRecipe,
  spinnerRecipe,
  stackRecipe,
  surfaceRecipe,
  switchRecipe,
  textRecipe,
  textareaRecipe,
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
  assertRecipeDefaults(surfaceRecipe);
  assertRecipeDefaults(cardRecipe);
  assertRecipeDefaults(headingRecipe);
  assertRecipeDefaults(badgeRecipe);
  assertRecipeDefaults(skeletonRecipe);
  assertRecipeDefaults(spinnerRecipe);
  assertRecipeDefaults(progressRecipe);
  assertRecipeDefaults(inputRecipe);
  assertRecipeDefaults(textareaRecipe);
  assertRecipeDefaults(checkboxRecipe);
  assertRecipeDefaults(radioGroupRecipe);
  assertRecipeDefaults(switchRecipe);
  assertRecipeDefaults(sliderRecipe);
});

test('buttonRecipe exposes expected variant axes', () => {
  expect(buttonRecipe.variants.variant).toEqual([
    'solid',
    'soft',
    'outline',
    'ghost',
  ]);
  expect(buttonRecipe.defaults.tone).toBe('accent');
  expect(buttonRecipe.variants.tone).toContain('success');
});

test('layout recipes expose expected defaults', () => {
  expect(inlineRecipe.defaults.wrap).toBe('wrap');
  expect(gridRecipe.defaults.columns).toBe('auto');
  expect(containerRecipe.defaults.size).toBe('lg');
  expect(centerRecipe.defaults.axis).toBe('both');
  expect(separatorRecipe.defaults.orientation).toBe('horizontal');
  expect(boxRecipe.defaults.padding).toBe('0');
});

test('surface elevation pairs background and shadow coherently', () => {
  expect(surfaceRecipe.variants.elevation).toEqual([
    'sunken',
    'flat',
    'raised',
    'overlay',
  ]);
  expect(cardRecipe.defaults.elevation).toBe('raised');
});
