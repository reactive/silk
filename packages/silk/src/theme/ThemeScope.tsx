import { cx } from '@linaria/core';
import type { ColorScheme } from '@reactive/silk-core';
import {
  createContext,
  useContext,
  type Context,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import { themeScopeClass } from './namedThemes.css';
import type { CssVarMap } from './themeToCssVars';

export interface ThemeScopeValue {
  readonly dataTheme: ColorScheme | undefined;
  readonly cssVars: CssVarMap | undefined;
}

export const ThemeScopeContext: Context<ThemeScopeValue | null> =
  createContext<ThemeScopeValue | null>(null);

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
} {
  const style =
    scope.cssVars || extras?.style
      ? { ...scope.cssVars, ...extras?.style }
      : undefined;

  return {
    className: cx(themeScopeClass, extras?.className),
    ...(style !== undefined ? { style } : {}),
    ...(scope.dataTheme !== undefined
      ? { 'data-theme': scope.dataTheme }
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
  if (scope === null) {
    return <>{children}</>;
  }

  return <div {...themeScopeDomProps(scope)}>{children}</div>;
}
