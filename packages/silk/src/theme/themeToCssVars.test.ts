import { createTheme } from '@reactive/silk-core';
import { expect, test } from '@rstest/core';
import { themeToCssVars } from './themeToCssVars';

test('themeToCssVars emits exhaustive canonical keys as strings', () => {
  const vars = themeToCssVars(createTheme());

  expect(vars['--silk-color-surface']).toBe('#ffffff');
  expect(vars['--silk-color-surface-sunken']).toBeDefined();
  expect(vars['--silk-color-overlay']).toContain('rgba');
  expect(vars['--silk-color-tone-accent-solid']).toBeDefined();
  expect(vars['--silk-color-tone-accent-on-solid']).toBe('#ffffff');
  expect(vars['--silk-color-tone-success-solid']).toBeDefined();
  expect(vars['--silk-space-comfortable-2']).toBe('8px');
  expect(vars['--silk-space-compact-2']).toBe('6px');
  expect(vars['--silk-space-2']).toBeUndefined();
  expect(vars['--silk-radius-md']).toBe('8px');
  expect(vars['--silk-typography-body-size']).toBe('16px');
  expect(vars['--silk-typography-body-line-height']).toBe('1.5');
  expect(vars['--silk-typography-body-sm-size']).toBe('14px');
  expect(vars['--silk-typography-heading-sm-size']).toBe('16px');
  expect(vars['--silk-typography-heading-xl-size']).toBe('36px');
  expect(vars['--silk-motion-normal-duration-ms']).toBe('200ms');
  expect(vars['--silk-motion-normal-easing']).toContain('cubic-bezier');
  // Looping feedback runs an order of magnitude slower than transitions.
  expect(vars['--silk-motion-loop-duration-ms']).toBe('1200ms');
  expect(vars['--silk-motion-loop-easing']).toBe('linear');
  expect(vars['--silk-shadow-raised']).toContain('rgba(0, 0, 0,');
  expect(vars['--silk-shadow-overlay']).toContain('8px');
  expect(vars['--silk-focus-ring-width']).toBe('2px');
  expect(vars['--silk-focus-ring-offset']).toBe('2px');
  expect(vars['--silk-color-tone-accent-subtle-hover']).toBeDefined();
  expect(vars['--silk-color-tone-accent-subtle-active']).toBeDefined();

  // Palette must not be emitted
  expect(
    Object.keys(vars).some((key) => key.includes('palette')),
  ).toBe(false);
});

test('dark theme serializes dark surfaces', () => {
  const theme = createTheme({ colorScheme: 'dark' });
  const vars = themeToCssVars(theme);

  expect(vars['--silk-color-surface']).toBe(theme.palette.gray[1]);
});
