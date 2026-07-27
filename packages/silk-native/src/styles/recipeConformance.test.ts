import {
  avatarRecipe,
  badgeRecipe,
  boxRecipe,
  buttonRecipe,
  cardRecipe,
  checkboxRecipe,
  createTheme,
  headingRecipe,
  inlineRecipe,
  inputRecipe,
  progressRecipe,
  radioGroupRecipe,
  separatorRecipe,
  skeletonRecipe,
  spinnerRecipe,
  stackRecipe,
  statusDotRecipe,
  surfaceRecipe,
  switchRecipe,
  textRecipe,
  textareaRecipe,
} from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import {
  elevationBackground,
  mapAvatarStyle,
  mapBadgeStyle,
  mapBoxStyle,
  mapButtonStyle,
  mapCardStyle,
  mapCheckboxStyle,
  mapHeadingStyle,
  mapInlineStyle,
  mapInputStyle,
  mapProgressStyle,
  mapRadioGroupStyle,
  mapSeparatorStyle,
  mapShadow,
  mapSkeletonStyle,
  mapSpinnerStyle,
  mapStackStyle,
  mapStatusDotStyle,
  mapSurfaceStyle,
  mapSwitchStyle,
  mapTextStyle,
  mapTextareaStyle,
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

test('conformance: Surface elevation/radius/border maps; overlay uses surfaceRaised', () => {
  for (const elevation of surfaceRecipe.variants.elevation) {
    const style = mapSurfaceStyle(theme, { elevation });
    expect(style.backgroundColor).toBe(elevationBackground(theme, elevation));
  }
  expect(elevationBackground(theme, 'overlay')).toBe(
    theme.semantic.color.surfaceRaised,
  );
  for (const radius of surfaceRecipe.variants.radius) {
    expect(mapSurfaceStyle(theme, { radius }).borderRadius).toBeTypeOf(
      'number',
    );
  }
  expect(mapSurfaceStyle(theme, { border: 'subtle' }).borderColor).toBe(
    theme.semantic.color.borderSubtle,
  );
  expect(mapSurfaceStyle(theme, { border: 'none' }).borderColor).toBe(
    'transparent',
  );
  const raised = mapShadow(theme, 'raised');
  expect(raised.elevation).toBe(4);
  expect(raised.shadowOpacity).toBeTypeOf('number');
});

test('conformance: Card column/gap/border and elevations', () => {
  for (const elevation of cardRecipe.variants.elevation) {
    expect(mapCardStyle(theme, { elevation }).backgroundColor).toBeTruthy();
  }
  for (const padding of cardRecipe.variants.padding) {
    expect(mapCardStyle(theme, { padding }).padding).toBeTypeOf('number');
  }
  const card = mapCardStyle(theme, {});
  expect(card.flexDirection).toBe('column');
  expect(card.gap).toBeTypeOf('number');
  expect(card.borderColor).toBe(theme.semantic.color.borderSubtle);
});

test('conformance: Heading size/tone/level maps', () => {
  for (const size of headingRecipe.variants.size) {
    expect(mapHeadingStyle(theme, { size }).fontSize).toBeTypeOf('number');
  }
  for (const tone of headingRecipe.variants.tone) {
    expect(mapHeadingStyle(theme, { tone }).color).toBeTruthy();
  }
  // Size defaults from level when omitted
  expect(mapHeadingStyle(theme, { level: '1' }).fontSize).toBe(
    mapHeadingStyle(theme, { level: '1', size: 'xl' }).fontSize,
  );
});

test('conformance: Badge variant/tone/size maps', () => {
  for (const variant of badgeRecipe.variants.variant) {
    for (const tone of badgeRecipe.variants.tone) {
      const style = mapBadgeStyle(theme, { variant, tone });
      expect(style.text.color).toBeTruthy();
      expect(style.view.borderWidth).toBe(1);
    }
  }
  for (const size of badgeRecipe.variants.size) {
    expect(mapBadgeStyle(theme, { size }).view.minHeight).toBeTypeOf('number');
  }
});

test('conformance: Separator orientations', () => {
  expect(mapSeparatorStyle(theme, { orientation: 'horizontal' }).height).toBe(
    1,
  );
  expect(mapSeparatorStyle(theme, { orientation: 'vertical' }).width).toBe(1);
  for (const orientation of separatorRecipe.variants.orientation) {
    expect(mapSeparatorStyle(theme, { orientation }).backgroundColor).toBe(
      theme.semantic.color.borderSubtle,
    );
  }
});

test('conformance: Avatar size/shape maps (density-independent media)', () => {
  for (const size of avatarRecipe.variants.size) {
    const style = mapAvatarStyle(theme, { size });
    expect(style.view.width).toBeTypeOf('number');
    expect(style.view.width).toBe(style.view.height);
  }
  for (const shape of avatarRecipe.variants.shape) {
    expect(mapAvatarStyle(theme, { shape }).view.borderRadius).toBeTypeOf(
      'number',
    );
  }
});

test('conformance: StatusDot / Skeleton / Spinner / Progress axes', () => {
  for (const tone of statusDotRecipe.variants.tone) {
    expect(mapStatusDotStyle(theme, { tone }).backgroundColor).toBeTruthy();
  }
  for (const size of statusDotRecipe.variants.size) {
    expect(mapStatusDotStyle(theme, { size }).width).toBeTypeOf('number');
  }
  for (const shape of skeletonRecipe.variants.shape) {
    expect(mapSkeletonStyle(theme, { shape }).backgroundColor).toBeTruthy();
  }
  for (const size of spinnerRecipe.variants.size) {
    for (const tone of spinnerRecipe.variants.tone) {
      const style = mapSpinnerStyle(theme, { size, tone });
      expect(style.width).toBeTypeOf('number');
      expect(style.borderTopColor).toBeTruthy();
    }
  }
  expect(mapSpinnerStyle(theme, {}, 'comfortable', true).borderStyle).toBe(
    'dotted',
  );
  for (const size of progressRecipe.variants.size) {
    expect(mapProgressStyle(theme, { size }).track.height).toBeTypeOf(
      'number',
    );
  }
});

test('conformance: Input/Textarea density and invalid/focus states', () => {
  for (const size of inputRecipe.variants.size) {
    expect(mapInputStyle(theme, { size }).minHeight).toBeTypeOf('number');
  }
  const comfortable = mapInputStyle(theme, { density: 'comfortable' });
  const compact = mapInputStyle(theme, { density: 'compact' });
  expect(compact.minHeight).not.toBe(comfortable.minHeight);
  expect(
    mapInputStyle(theme, {}, 'comfortable', { invalid: true }).borderColor,
  ).toBe(theme.semantic.color.tones.danger.solid);
  expect(
    mapInputStyle(theme, {}, 'comfortable', { focused: true }).borderColor,
  ).toBe(theme.semantic.color.tones.accent.border);
  for (const size of textareaRecipe.variants.size) {
    const style = mapTextareaStyle(theme, { size });
    expect(style.minHeight).toBe(theme.semantic.space[8] * 2);
  }
});

test('conformance: Checkbox / Switch / RadioGroup axes', () => {
  for (const size of checkboxRecipe.variants.size) {
    for (const tone of checkboxRecipe.variants.tone) {
      const unchecked = mapCheckboxStyle(theme, { size, tone });
      const checked = mapCheckboxStyle(
        theme,
        { size, tone },
        'comfortable',
        { checked: true },
      );
      expect(unchecked.box.width).toBeTypeOf('number');
      expect(unchecked.row.flexDirection).toBe('row');
      expect(checked.box.backgroundColor).not.toBe(unchecked.box.backgroundColor);
    }
  }
  for (const size of switchRecipe.variants.size) {
    const style = mapSwitchStyle(theme, { size }, 'comfortable', {
      checked: true,
    });
    expect(style.travel).toBeGreaterThan(0);
    expect(style.track.width).toBeTypeOf('number');
  }
  for (const orientation of radioGroupRecipe.variants.orientation) {
    expect(
      mapRadioGroupStyle(theme, { orientation }).root.flexDirection,
    ).toBeTruthy();
  }
});
