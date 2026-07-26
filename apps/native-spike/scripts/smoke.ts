/**
 * Light smoke: createTheme + recipe defaults → RN-shaped style objects.
 * No simulator / Expo runtime required.
 */
import {
  boxRecipe,
  buttonRecipe,
  createTheme,
  stackRecipe,
  textRecipe,
} from '@reactive/silk-core';
import {
  mapBoxStyle,
  mapButtonStyle,
  mapStackStyle,
  mapTextStyle,
  resolveNativeFontFamily,
} from '../src/styles/mapStyles.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(msg);
  }
}

const theme = createTheme({ colorScheme: 'light' });

const box = mapBoxStyle(theme, { padding: '4' });
assert(box.padding === theme.semantic.space[4], 'box padding maps space[4]');
assert(
  box.backgroundColor === theme.semantic.color.surface,
  'box uses surface',
);

const stack = mapStackStyle(theme, {
  gap: '3',
  align: 'center',
  justify: 'between',
});
assert(stack.flexDirection === 'column', 'stack is vertical-only');
assert(stack.gap === theme.semantic.space[3], 'stack gap');
assert(stack.alignItems === 'center', 'stack align');
assert(stack.justifyContent === 'space-between', 'stack justify');

const text = mapTextStyle(theme, { role: 'heading', tone: 'accent' });
const heading = theme.semantic.typography.heading;
assert(text.fontSize === heading.size, 'text size');
assert(
  text.lineHeight === heading.lineHeight * heading.size,
  'text lineHeight = unitless × size',
);
assert(
  text.color === theme.semantic.color.tones.accent.solid,
  'text accent tone',
);
assert(
  resolveNativeFontFamily(heading.family) === undefined,
  'web font stack falls back to platform default',
);

const button = mapButtonStyle(theme, {
  variant: 'solid',
  tone: 'accent',
  size: 'md',
});
assert(
  button.view.backgroundColor === theme.semantic.color.tones.accent.solid,
  'button solid bg',
);
assert(
  button.text.color === theme.semantic.color.tones.accent.onSolid,
  'button solid fg',
);
assert(
  button.view.borderRadius === theme.semantic.radius.md,
  'button radius md',
);

const compact = mapButtonStyle(theme, {
  size: 'md',
  density: 'compact',
});
const comfortable = mapButtonStyle(theme, {
  size: 'md',
  density: 'comfortable',
});
assert(
  (compact.view.paddingTop ?? 0) < (comfortable.view.paddingTop ?? 0),
  'compact density shrinks button padding',
);

// Recipe defaults are the shared contract
assert(boxRecipe.defaults.padding === '0', 'box recipe default');
assert(stackRecipe.defaults.align === 'stretch', 'stack recipe default');
assert(textRecipe.defaults.role === 'body', 'text recipe default');
assert(buttonRecipe.defaults.tone === 'accent', 'button recipe default');

console.log('native-spike smoke OK');
console.log(
  JSON.stringify(
    {
      box,
      stack,
      text: { ...text, fontFamily: text.fontFamily ?? '(platform default)' },
      button: { view: button.view, text: button.text },
    },
    null,
    2,
  ),
);
