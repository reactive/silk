import type { ColorScheme, Theme } from '@reactive/silk-core';
import {
  createElement,
  useMemo,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { Slot } from 'radix-ui';
import {
  ThemeScopeContext,
  themeScopeDomProps,
  type ThemeScopeValue,
} from './ThemeScope';
import { themeToCssVars, type CssVarMap } from './themeToCssVars';

function pickSilkCssVars(
  style: CSSProperties | undefined,
): CssVarMap | undefined {
  if (!style) {
    return undefined;
  }
  const vars: Record<`--silk-${string}`, string> = {};
  let found = false;
  for (const [key, value] of Object.entries(style)) {
    if (
      key.startsWith('--silk-') &&
      typeof value === 'string' &&
      value.length > 0
    ) {
      vars[key as `--silk-${string}`] = value;
      found = true;
    }
  }
  return found ? vars : undefined;
}

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
  const scopeValue = useMemo((): ThemeScopeValue => {
    const themeVars = theme ? themeToCssVars(theme) : undefined;
    const styleVars = pickSilkCssVars(style);
    const cssVars =
      themeVars || styleVars
        ? { ...themeVars, ...styleVars }
        : undefined;
    return { dataTheme, cssVars };
  }, [theme, style, dataTheme]);

  const props = {
    ...themeScopeDomProps(scopeValue, {
      ...(className !== undefined ? { className } : {}),
      ...(style !== undefined ? { style } : {}),
    }),
    children,
  };

  return (
    <ThemeScopeContext.Provider value={scopeValue}>
      {asChild ? <Slot.Root {...props} /> : createElement('div', props)}
    </ThemeScopeContext.Provider>
  );
}
