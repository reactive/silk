import {
  createTheme,
  type ColorScheme,
  type DensityName,
  type Theme,
} from '@reactive/silk-core';
import {
  createContext,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
} from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly density: DensityName;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /**
   * Custom theme object. When provided, takes precedence over `colorScheme`.
   * Prefer one of `theme` or `colorScheme`, not both.
   */
  readonly theme?: Theme;
  /**
   * Builds a default theme when `theme` is omitted.
   * `'system'` resolves via React Native Appearance.
   * Omitted inherits the nearest ancestor ThemeProvider's theme.
   * An explicit scheme replaces a parent custom theme (fresh default semantics).
   */
  readonly colorScheme?: ColorScheme | 'system';
  /**
   * System density — selects comfortable vs compact space scale.
   * Omitted inherits from an ancestor; root fallback is comfortable.
   */
  readonly density?: DensityName;
  readonly children: ReactNode;
}

function ThemeProviderInner({
  theme: themeProp,
  colorScheme,
  density,
  children,
  appearance,
}: ThemeProviderProps & {
  readonly appearance: ColorSchemeName;
}): JSX.Element {
  const parent = useContext(ThemeContext);
  const parentTheme = parent?.theme;
  const parentDensity = parent?.density;

  // Density must not recreate the Theme object (identity stability for consumers).
  const theme = useMemo((): Theme => {
    if (themeProp !== undefined) {
      return themeProp;
    }
    if (colorScheme !== undefined) {
      const scheme: ColorScheme =
        colorScheme === 'system'
          ? appearance === 'dark'
            ? 'dark'
            : 'light'
          : colorScheme;
      return createTheme({ colorScheme: scheme });
    }
    if (parentTheme) {
      return parentTheme;
    }
    return createTheme({ colorScheme: 'light' });
  }, [themeProp, colorScheme, appearance, parentTheme]);

  const value = useMemo((): ThemeContextValue => {
    return {
      theme,
      density: density ?? parentDensity ?? 'comfortable',
    };
  }, [theme, density, parentDensity]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Subscribes to Appearance only when `colorScheme="system"`. */
function SystemThemeProvider(props: ThemeProviderProps): JSX.Element {
  const appearance = useColorScheme();
  return <ThemeProviderInner {...props} appearance={appearance} />;
}

/**
 * Native theme delivery: pass the semantic Theme object through context.
 * No CSS variables — consumers read numbers/colors from `useTheme()`.
 */
export function ThemeProvider(props: ThemeProviderProps): JSX.Element {
  if (props.colorScheme === 'system' && props.theme === undefined) {
    return <SystemThemeProvider {...props} />;
  }
  return <ThemeProviderInner {...props} appearance="unspecified" />;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Density from the nearest ThemeProvider, or undefined outside a provider. */
export function useThemeDensity(): DensityName | undefined {
  return useContext(ThemeContext)?.density;
}
