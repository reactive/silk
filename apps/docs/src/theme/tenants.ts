import {
  checkThemeContrast,
  createTheme,
  generatePairedPalette,
  type Theme,
} from '@reactive/silk';

/**
 * Stage 5 exit tenants — visually distinct brand seeds, each with paired
 * light/dark palettes from `generatePairedPalette` (no runtime CSS).
 */
const oceanPaired = generatePairedPalette('#0ea5e9');
const emberPaired = generatePairedPalette('#ea580c', {
  dangerSeedHex: '#e11d48',
});

export const oceanLight: Theme = createTheme({
  colorScheme: 'light',
  palette: oceanPaired.light,
});
export const oceanDark: Theme = createTheme({
  colorScheme: 'dark',
  palette: oceanPaired.dark,
});
export const emberLight: Theme = createTheme({
  colorScheme: 'light',
  palette: emberPaired.light,
});
export const emberDark: Theme = createTheme({
  colorScheme: 'dark',
  palette: emberPaired.dark,
});

export const tenantThemes = {
  ocean: { light: oceanLight, dark: oceanDark },
  ember: { light: emberLight, dark: emberDark },
} as const;

/** Fail loudly at module load if a demo tenant drifts off-contract. */
for (const [tenant, schemes] of Object.entries(tenantThemes)) {
  for (const [scheme, theme] of Object.entries(schemes)) {
    const result = checkThemeContrast(theme);
    if (!result.ok) {
      throw new Error(
        `Tenant theme ${tenant}/${scheme} failed contrast: ${JSON.stringify(result.violations)}`,
      );
    }
  }
}
