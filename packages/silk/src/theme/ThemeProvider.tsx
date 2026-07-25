import { cx } from '@linaria/core';
import type { ColorScheme, Theme } from '@reactive/silk-core';
import {
  createElement,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { Slot } from 'radix-ui';
import { themeScopeClass } from './namedThemes.css';
import { themeToCssVars } from './themeToCssVars';

export interface ThemeProviderProps {
  /**
   * Custom theme object. When provided, CSS variables are applied via the
   * style attribute (dynamic / tenant branding) and take precedence over
   * `colorScheme` for both `data-theme` and variable values.
   * Prefer one of `theme` or `colorScheme`, not both.
   */
  readonly theme?: Theme;
  /**
   * Selects the named theme via `data-theme` against static CSS.
   * `'system'` omits the attribute so prefers-color-scheme applies.
   * Ignored for `data-theme` when `theme` is set (uses `theme.colorScheme`).
   */
  readonly colorScheme?: ColorScheme | 'system';
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly asChild?: boolean;
}

function resolveDataTheme(
  theme: Theme | undefined,
  colorScheme: ColorScheme | 'system' | undefined,
): ColorScheme | undefined {
  if (theme) {
    return theme.colorScheme;
  }
  if (colorScheme === 'system' || colorScheme === undefined) {
    return undefined;
  }
  return colorScheme;
}

/**
 * Theme scope root. Named themes flip `data-theme` against static CSS;
 * custom themes set CSS variables on the style attribute.
 */
export function ThemeProvider({
  theme,
  colorScheme = 'system',
  children,
  className,
  style,
  asChild = false,
}: ThemeProviderProps): JSX.Element {
  const dataTheme = resolveDataTheme(theme, colorScheme);
  const cssVars = theme ? themeToCssVars(theme) : undefined;
  const mergedStyle: CSSProperties | undefined = cssVars
    ? { ...cssVars, ...style }
    : style;

  const props = {
    className: cx(themeScopeClass, className),
    style: mergedStyle,
    ...(dataTheme !== undefined ? { 'data-theme': dataTheme } : {}),
    children,
  };

  if (asChild) {
    return <Slot.Root {...props} />;
  }

  return createElement('div', props);
}
