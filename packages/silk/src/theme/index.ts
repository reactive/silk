export {
  checkThemeContrast,
  contrastRatio,
  createTheme,
  generatePairedPalette,
  generateScale,
  relativeLuminance,
} from '@reactive/silk-core';
export type {
  ColorScheme,
  ContrastViolation,
  CreateThemeOptions,
  DensityName,
  FontFamilyName,
  GenerateScaleOptions,
  PairedPalette,
  PairedPaletteOptions,
  Palette,
  SemanticTokens,
  Theme,
  ThemeContrastResult,
} from '@reactive/silk-core';

export { themeToCssVars } from './themeToCssVars';
export type { CssVarMap } from './themeToCssVars';

export {
  cssVars,
  silkComponentVarMeta,
  silkComponentVarNames,
} from './componentVars';
export type {
  SilkComponentVarMeta,
  SilkComponentVarName,
  SilkComponentVars,
} from './componentVars';

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
