import type { ColorScheme, DensityName, Theme } from '@reactive/silk-core';
import {
  createElement,
  useContext,
  useMemo,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { Slot } from 'radix-ui';
import {
  mergeCssVarMaps,
  partitionCssVars,
} from './partitionCssVars';
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
   * Omitted inherits the nearest ancestor ThemeProvider's scheme.
   * Ignored for `data-theme` when `theme` is set (uses `theme.colorScheme`).
   */
  readonly colorScheme?: ColorScheme | 'system';
  /**
   * System density. Sets `data-density` so effective `--silk-space-*` vars
   * remap. Omitted inherits from an ancestor; root fallback is comfortable
   * via the default effective aliases.
   */
  readonly density?: DensityName;
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly asChild?: boolean;
}

function resolveDataTheme(
  theme: Theme | undefined,
  colorScheme: ColorScheme | 'system' | undefined,
  parentDataTheme: ColorScheme | undefined,
): ColorScheme | undefined {
  if (theme) {
    return theme.colorScheme;
  }
  if (colorScheme === 'system') {
    return undefined;
  }
  if (colorScheme === undefined) {
    return parentDataTheme;
  }
  return colorScheme;
}

/**
 * Theme scope root. Named themes flip `data-theme` against static CSS;
 * custom themes set CSS variables on the style attribute.
 * Nested providers inherit omitted `colorScheme` / `density` from the parent.
 *
 * Variable channels:
 * - `semanticVars` — theme-owned tokens; replaced by nested `theme` /
 *   `colorScheme` (named children do not carry outer tenant semantics into
 *   portals).
 * - `customVars` — component hooks / extensions; always inherit so portals
 *   under an inner named scheme still see outer branding hooks.
 */
export function ThemeProvider({
  theme,
  colorScheme,
  density,
  children,
  className,
  style,
  asChild = false,
}: ThemeProviderProps): JSX.Element {
  const parent = useContext(ThemeScopeContext);
  const dataTheme = resolveDataTheme(theme, colorScheme, parent?.dataTheme);
  const resolvedDensity = density ?? parent?.density;
  const replacesSemantics = theme !== undefined || colorScheme !== undefined;

  const themeVars = useMemo(
    () => (theme ? themeToCssVars(theme) : undefined),
    [theme],
  );
  const styleParts = useMemo(
    () => partitionCssVars(pickSilkCssVars(style)),
    [style],
  );

  const scopeValue = useMemo((): ThemeScopeValue => {
    const parentSemantic = replacesSemantics
      ? undefined
      : parent?.semanticVars;
    const semanticVars = mergeCssVarMaps(
      parentSemantic,
      themeVars,
      styleParts.semanticVars,
    );
    const customVars = mergeCssVarMaps(
      parent?.customVars,
      styleParts.customVars,
    );
    return {
      dataTheme,
      density: resolvedDensity,
      semanticVars,
      customVars,
    };
  }, [
    themeVars,
    styleParts,
    dataTheme,
    resolvedDensity,
    replacesSemantics,
    parent?.semanticVars,
    parent?.customVars,
  ]);

  const domProps = useMemo(
    () =>
      themeScopeDomProps(scopeValue, {
        ...(className !== undefined ? { className } : {}),
        ...(style !== undefined ? { style } : {}),
      }),
    [scopeValue, className, style],
  );

  return (
    <ThemeScopeContext.Provider value={scopeValue}>
      {asChild ? (
        <Slot.Root {...domProps}>{children}</Slot.Root>
      ) : (
        createElement('div', { ...domProps, children })
      )}
    </ThemeScopeContext.Provider>
  );
}
