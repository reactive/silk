import { css } from '@linaria/core';
import { createTheme } from '@reactive/silk-core';
import { themeToCssVars } from './themeToCssVars';

function varsToCssBlock(vars: Readonly<Record<string, string>>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
}

const lightVars = themeToCssVars(createTheme({ colorScheme: 'light' }));
const darkVars = themeToCssVars(createTheme({ colorScheme: 'dark' }));

/**
 * Applied on the ThemeProvider root. Light by default; dark via data-theme.
 * Prefers-color-scheme fallback when data-theme is unset (system).
 */
export const themeScopeClass: string = css`
  color-scheme: light;
  ${varsToCssBlock(lightVars)}

  &:where([data-theme='dark']) {
    color-scheme: dark;
    ${varsToCssBlock(darkVars)}
  }

  @media (prefers-color-scheme: dark) {
    &:where(:not([data-theme='light']):not([data-theme='dark'])) {
      color-scheme: dark;
      ${varsToCssBlock(darkVars)}
    }
  }
`;
