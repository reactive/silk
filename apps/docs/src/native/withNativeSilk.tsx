import {
  createTheme,
  type ColorScheme,
  type DensityName,
  type Theme,
} from '@reactive/silk-core';
import { SilkProvider } from '@reactive/silk-native';
import type { JSX } from 'react';
import type { Decorator } from 'storybook-react-rsbuild';

const runtimeThemes: Record<ColorScheme, Theme> = {
  light: createTheme({ colorScheme: 'light' }),
  dark: createTheme({ colorScheme: 'dark' }),
};

/**
 * Storybook decorator for `@reactive/silk-native` stories.
 * Reads the same colorScheme / density globals as the web preview decorator.
 */
export const withNativeSilk: Decorator = (Story, context): JSX.Element => {
  const colorScheme = (context.globals.colorScheme ?? 'light') as
    | ColorScheme
    | 'system';
  const density = (context.globals.density ?? 'comfortable') as DensityName;

  return (
    <SilkProvider
      {...(colorScheme === 'system'
        ? { colorScheme }
        : { theme: runtimeThemes[colorScheme] })}
      density={density}
    >
      <Story />
    </SilkProvider>
  );
};
