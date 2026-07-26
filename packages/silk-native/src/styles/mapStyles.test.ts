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
  chEmApproximation,
  controlLineHeightFactor,
  controlSizePadding,
} from './controlGeometry.js';
import {
  mapBoxStyle,
  mapButtonStyle,
  mapInlineStyle,
  mapStackStyle,
  mapTextStyle,
  resolveNativeFontFamily,
} from './mapStyles.js';

const theme = createTheme({ colorScheme: 'light' });

test('mapBoxStyle maps padding and surface', () => {
  const box = mapBoxStyle(theme, { padding: '4' });
  expect(box.padding).toBe(theme.semantic.space[4]);
  expect(box.backgroundColor).toBe(theme.semantic.color.surface);
});

test('mapStackStyle is vertical with align/justify/gap/rail', () => {
  const stack = mapStackStyle(theme, {
    gap: '3',
    align: 'center',
    justify: 'between',
    rail: 'start',
  });
  expect(stack.flexDirection).toBe('column');
  expect(stack.gap).toBe(theme.semantic.space[3]);
  expect(stack.alignItems).toBe('center');
  expect(stack.justifyContent).toBe('space-between');
  expect(stack.borderStartWidth).toBe(1);
  expect(stack.borderStartColor).toBe(theme.semantic.color.borderSubtle);
  expect(stack.paddingStart).toBe(theme.semantic.space[3]);
});

test('mapInlineStyle maps direction/wrap/baseline', () => {
  const inline = mapInlineStyle(theme, {
    direction: 'row-reverse',
    wrap: 'nowrap',
    align: 'baseline',
    justify: 'end',
    gap: '2',
  });
  expect(inline.flexDirection).toBe('row-reverse');
  expect(inline.flexWrap).toBe('nowrap');
  expect(inline.alignItems).toBe('baseline');
  expect(inline.justifyContent).toBe('flex-end');
  expect(inline.gap).toBe(theme.semantic.space[2]);
});

test('mapTextStyle uses tones.*.text, success, and prose measure', () => {
  const heading = theme.semantic.typography.heading;
  const text = mapTextStyle(theme, {
    role: 'heading',
    tone: 'accent',
    measure: 'prose',
  });
  expect(text.fontSize).toBe(heading.size);
  expect(text.lineHeight).toBe(heading.lineHeight * heading.size);
  expect(text.color).toBe(theme.semantic.color.tones.accent.text);
  expect(text.maxWidth).toBe(
    heading.size * theme.semantic.measure.prose * chEmApproximation,
  );

  const success = mapTextStyle(theme, { tone: 'success' });
  expect(success.color).toBe(theme.semantic.color.tones.success.text);

  const none = mapTextStyle(theme, { measure: 'none' });
  expect(none.maxWidth).toBeUndefined();
});

test('resolveNativeFontFamily peels CSS stacks', () => {
  expect(
    resolveNativeFontFamily(theme.semantic.fontFamily.sans),
  ).toBe('Inter');
  expect(
    resolveNativeFontFamily(theme.semantic.fontFamily.serif),
  ).toBe('Source Serif 4');
  expect(resolveNativeFontFamily('sans-serif')).toBeUndefined();
});

test('mapButtonStyle solid/soft/outline/ghost and pressed tokens', () => {
  const accent = theme.semantic.color.tones.accent;
  const solid = mapButtonStyle(theme, {
    variant: 'solid',
    tone: 'accent',
    size: 'md',
  });
  expect(solid.view.backgroundColor).toBe(accent.solid);
  expect(solid.text.color).toBe(accent.onSolid);
  expect(solid.view.borderRadius).toBe(theme.semantic.radius.md);

  const softPressed = mapButtonStyle(
    theme,
    { variant: 'soft', tone: 'accent' },
    true,
  );
  expect(softPressed.view.backgroundColor).toBe(accent.subtleActive);
  expect(softPressed.text.color).toBe(accent.text);

  const outline = mapButtonStyle(theme, { variant: 'outline', tone: 'accent' });
  expect(outline.view.borderColor).toBe(accent.border);
  expect(outline.text.color).toBe(accent.text);

  const ghostPressed = mapButtonStyle(
    theme,
    { variant: 'ghost', tone: 'accent' },
    true,
  );
  expect(ghostPressed.view.backgroundColor).toBe(accent.subtleActive);
  expect(ghostPressed.view.borderWidth).toBe(1);
  expect(ghostPressed.view.borderColor).toBe('transparent');
});

test('mapButtonStyle uses control geometry and density', () => {
  const md = mapButtonStyle(theme, { size: 'md', density: 'comfortable' });
  expect(md.view.paddingTop).toBe(
    theme.semantic.space[controlSizePadding.md.py],
  );
  expect(md.text.lineHeight).toBe(
    controlLineHeightFactor * theme.semantic.typography.label.size,
  );

  const compact = mapButtonStyle(theme, { size: 'md', density: 'compact' });
  expect((compact.view.paddingTop ?? 0) < (md.view.paddingTop ?? 0)).toBe(true);
});

test('recipe defaults remain the shared contract', () => {
  expect(boxRecipe.defaults.padding).toBe('0');
  expect(stackRecipe.defaults.align).toBe('stretch');
  expect(stackRecipe.defaults.rail).toBe('none');
  expect(inlineRecipe.defaults.wrap).toBe('wrap');
  expect(textRecipe.defaults.role).toBe('body');
  expect(textRecipe.defaults.measure).toBe('none');
  expect(buttonRecipe.defaults.tone).toBe('accent');
});
