import { expect, test } from '@rstest/core';
import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
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
  popoverRecipe,
  selectRecipe,
  sliderRecipe,
  spinnerRecipe,
  stackRecipe,
  surfaceRecipe,
  switchRecipe,
  tabsRecipe,
  textRecipe,
  textareaRecipe,
  toastRecipe,
  toggleRecipe,
  statusDotRecipe,
  mediaObjectRecipe,
  actionBarRecipe,
  statGroupRecipe,
  emptyStateRecipe,
  postCardRecipe,
  commentRecipe,
  profileCardRecipe,
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
  assertRecipeDefaults(popoverRecipe);
  assertRecipeDefaults(tabsRecipe);
  assertRecipeDefaults(selectRecipe);
  assertRecipeDefaults(toastRecipe);
  assertRecipeDefaults(toggleRecipe);
  assertRecipeDefaults(statusDotRecipe);
  assertRecipeDefaults(mediaObjectRecipe);
  assertRecipeDefaults(actionBarRecipe);
  assertRecipeDefaults(statGroupRecipe);
  assertRecipeDefaults(emptyStateRecipe);
  assertRecipeDefaults(postCardRecipe);
  assertRecipeDefaults(commentRecipe);
  assertRecipeDefaults(profileCardRecipe);
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
  expect(separatorRecipe.defaults.orientation).toBe('horizontal');
  expect(boxRecipe.defaults.padding).toBe('0');
});

/**
 * Stack is vertical-only: a `direction` (or `wrap`) axis would reintroduce the
 * flip that makes `align`/`justify` mean different visual axes per call site.
 */
test('stackRecipe exposes exactly the vertical-only axes', () => {
  expect(Object.keys(stackRecipe.variants)).toEqual([
    'gap',
    'align',
    'justify',
    'rail',
  ]);
  expect(stackRecipe.defaults.align).toBe('stretch');
  expect(stackRecipe.defaults.justify).toBe('start');
});

test('gridRecipe pairs align and justify as item placement axes', () => {
  expect(gridRecipe.variants.justify).toEqual(gridRecipe.variants.align);
  expect(gridRecipe.defaults.justify).toBe('stretch');
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
