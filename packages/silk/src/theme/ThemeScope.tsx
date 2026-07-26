import { cx } from '@linaria/core';
import type { ColorScheme, DensityName } from '@reactive/silk-core';
import {
  createContext,
  useContext,
  useMemo,
  type Context,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { themeScopeClasses } from './namedThemes.css';
import type { CssVarMap } from './themeToCssVars';

export interface ThemeScopeValue {
  readonly dataTheme: ColorScheme | undefined;
  readonly density: DensityName | undefined;
  readonly cssVars: CssVarMap | undefined;
}

export const ThemeScopeContext: Context<ThemeScopeValue | null> =
  createContext<ThemeScopeValue | null>(null);

export function useThemeDensity(): DensityName | undefined {
  return useContext(ThemeScopeContext)?.density;
}

export function themeScopeDomProps(
  scope: ThemeScopeValue,
  extras?: {
    readonly className?: string;
    readonly style?: CSSProperties;
  },
): {
  readonly className: string;
  readonly style?: CSSProperties;
  readonly 'data-theme'?: ColorScheme;
  readonly 'data-density'?: DensityName;
} {
  const style =
    scope.cssVars || extras?.style
      ? { ...scope.cssVars, ...extras?.style }
      : undefined;

  return {
    className: cx(themeScopeClasses, extras?.className),
    ...(style !== undefined ? { style } : {}),
    ...(scope.dataTheme !== undefined
      ? { 'data-theme': scope.dataTheme }
      : {}),
    ...(scope.density !== undefined
      ? { 'data-density': scope.density }
      : {}),
  };
}

/**
 * Reconstitutes the nearest ThemeProvider scope for content portaled outside
 * the provider DOM subtree (e.g. Dialog → document.body).
 */
export function ThemeScopePortal({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  const scope = useContext(ThemeScopeContext);
  // A custom theme puts ~124 CSS variables in `style`; rebuilding that object
  // per render would re-diff all of them on every dialog animation frame.
  const domProps = useMemo(
    () => (scope === null ? null : themeScopeDomProps(scope)),
    [scope],
  );

  if (domProps === null) {
    return <>{children}</>;
  }

  return <div {...domProps}>{children}</div>;
}
