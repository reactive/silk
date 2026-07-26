import {
  boxRecipe,
  buttonRecipe,
  createTheme,
  inlineRecipe,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import {
  mapBoxStyle,
  mapButtonStyle,
  mapInlineStyle,
  mapStackStyle,
  mapTextStyle,
} from './mapStyles.js';

const theme = createTheme({ colorScheme: 'light' });

function distinctPairs<T>(values: readonly T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      pairs.push([values[i]!, values[j]!]);
    }
  }
  return pairs;
}

test('conformance: every Box padding value maps to a defined style', () => {
  for (const padding of boxRecipe.variants.padding) {
    const style = mapBoxStyle(theme, { padding });
    expect(style.padding).toBeTypeOf('number');
  }
});

test('conformance: every Stack axis value maps; distinct gaps differ', () => {
  for (const gap of stackRecipe.variants.gap) {
    expect(mapStackStyle(theme, { gap }).gap).toBeTypeOf('number');
  }
  for (const align of stackRecipe.variants.align) {
    expect(mapStackStyle(theme, { align }).alignItems).toBeTruthy();
  }
  for (const justify of stackRecipe.variants.justify) {
    expect(mapStackStyle(theme, { justify }).justifyContent).toBeTruthy();
  }
  for (const rail of stackRecipe.variants.rail) {
    const style = mapStackStyle(theme, { rail });
    if (rail === 'start') {
      expect(style.borderStartWidth).toBe(1);
    } else {
      expect(style.borderStartWidth).toBeUndefined();
    }
  }
  for (const [a, b] of distinctPairs(['0', '2', '4'] as const)) {
    expect(mapStackStyle(theme, { gap: a }).gap).not.toBe(
      mapStackStyle(theme, { gap: b }).gap,
    );
  }
});

test('conformance: every Inline axis value maps', () => {
  for (const gap of inlineRecipe.variants.gap) {
    expect(mapInlineStyle(theme, { gap }).gap).toBeTypeOf('number');
  }
  for (const align of inlineRecipe.variants.align) {
    expect(mapInlineStyle(theme, { align }).alignItems).toBeTruthy();
  }
  for (const justify of inlineRecipe.variants.justify) {
    expect(mapInlineStyle(theme, { justify }).justifyContent).toBeTruthy();
  }
  for (const wrap of inlineRecipe.variants.wrap) {
    expect(mapInlineStyle(theme, { wrap }).flexWrap).toBe(wrap);
  }
  for (const direction of inlineRecipe.variants.direction) {
    expect(mapInlineStyle(theme, { direction }).flexDirection).toBe(direction);
  }
});

test('conformance: every Text role/tone/measure maps; tones differ', () => {
  for (const role of textRecipe.variants.role) {
    expect(mapTextStyle(theme, { role }).fontSize).toBeTypeOf('number');
  }
  for (const tone of textRecipe.variants.tone) {
    expect(mapTextStyle(theme, { tone }).color).toBeTruthy();
  }
  expect(mapTextStyle(theme, { measure: 'none' }).maxWidth).toBeUndefined();
  expect(mapTextStyle(theme, { measure: 'prose' }).maxWidth).toBeTypeOf(
    'number',
  );

  expect(mapTextStyle(theme, { tone: 'primary' }).color).not.toBe(
    mapTextStyle(theme, { tone: 'danger' }).color,
  );
  expect(mapTextStyle(theme, { tone: 'success' }).color).not.toBe(
    mapTextStyle(theme, { tone: 'accent' }).color,
  );
});

test('conformance: every Button variant/tone/size/density maps', () => {
  for (const variant of buttonRecipe.variants.variant) {
    for (const tone of buttonRecipe.variants.tone) {
      const style = mapButtonStyle(theme, { variant, tone });
      expect(style.view.backgroundColor !== undefined || variant !== 'solid').toBe(
        true,
      );
      expect(style.text.color).toBeTruthy();
    }
  }
  for (const size of buttonRecipe.variants.size) {
    const style = mapButtonStyle(theme, { size });
    expect(style.view.paddingTop).toBeTypeOf('number');
    expect(style.text.fontSize).toBeTypeOf('number');
  }
  const comfortable = mapButtonStyle(theme, { density: 'comfortable' });
  const compact = mapButtonStyle(theme, { density: 'compact' });
  expect(compact.view.paddingTop).not.toBe(comfortable.view.paddingTop);
});
