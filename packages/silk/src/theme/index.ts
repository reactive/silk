export { createTheme } from '@reactive/silk-core';
export type {
  ColorScheme,
  CreateThemeOptions,
  DensityName,
  FontFamilyName,
  Palette,
  SemanticTokens,
  Theme,
} from '@reactive/silk-core';

export { themeToCssVars } from './themeToCssVars';
export type { CssVarMap } from './themeToCssVars';

export { cssVars, silkComponentVarNames } from './componentVars';
export type { SilkComponentVarName, SilkComponentVars } from './componentVars';

export { ThemeProvider } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';

export {
  SilkProvider,
  useComponentDefaults,
  useSilkDefaults,
} from './SilkProvider';
export type { SilkDefaults, SilkProviderProps } from './SilkProvider';

export { densityClass } from './density.css';
export { useThemeDensity } from './ThemeScope';
