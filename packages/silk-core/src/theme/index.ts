export { createTheme } from './createTheme.js';
export type { CreateThemeOptions } from './createTheme.js';

export {
  contrastRatio,
  parseCanonicalHex,
  relativeLuminance,
} from './colorMath.js';

export { checkThemeContrast } from './checkThemeContrast.js';
export type {
  ContrastViolation,
  ThemeContrastResult,
} from './checkThemeContrast.js';

export { generateScale } from './generateScale.js';
export type { GenerateScaleOptions } from './generateScale.js';

export { generatePairedPalette } from './generatePairedPalette.js';
export type {
  PairedPalette,
  PairedPaletteOptions,
} from './generatePairedPalette.js';
