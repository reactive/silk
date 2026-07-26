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

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly density: DensityName;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Full theme object from createTheme. Prefer this over colorScheme alone. */
  readonly theme?: Theme;
  /** Builds a default theme when `theme` is omitted. */
  readonly colorScheme?: ColorScheme;
  /** Selects comfortable vs compact space scale (renderer concern). */
  readonly density?: DensityName;
  readonly children: ReactNode;
}

/**
 * Native theme delivery: pass the semantic Theme object through context.
 * No CSS variables — consumers read numbers/colors from `useTheme()`.
 */
export function ThemeProvider({
  theme: themeProp,
  colorScheme = 'light',
  density = 'comfortable',
  children,
}: ThemeProviderProps): JSX.Element {
  const value = useMemo((): ThemeContextValue => {
    const theme = themeProp ?? createTheme({ colorScheme });
    return { theme, density };
  }, [themeProp, colorScheme, density]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
