import type {
  BoxVariantProps,
  ButtonVariantProps,
  InlineVariantProps,
  StackVariantProps,
  TextVariantProps,
} from '@reactive/silk-core';
import {
  createContext,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
} from 'react';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider.js';

/**
 * Typed per-component defaults for native exemplars only.
 * Nested SilkProviders replace the entire map (no component-level merge).
 */
export interface SilkDefaults {
  readonly Box?: Partial<BoxVariantProps>;
  readonly Stack?: Partial<StackVariantProps>;
  readonly Inline?: Partial<InlineVariantProps>;
  readonly Text?: Partial<TextVariantProps>;
  readonly Button?: Partial<ButtonVariantProps>;
}

export interface SilkProviderProps extends ThemeProviderProps {
  readonly defaults?: SilkDefaults;
  readonly children: ReactNode;
}

const EMPTY_DEFAULTS: SilkDefaults = {};
const EMPTY_COMPONENT_DEFAULTS = {};

const SilkDefaultsContext = createContext<SilkDefaults>(EMPTY_DEFAULTS);

export function useSilkDefaults(): SilkDefaults {
  return useContext(SilkDefaultsContext);
}

export function useComponentDefaults<K extends keyof SilkDefaults>(
  component: K,
): NonNullable<SilkDefaults[K]> {
  const defaults = useSilkDefaults();
  return (defaults[component] ?? EMPTY_COMPONENT_DEFAULTS) as NonNullable<
    SilkDefaults[K]
  >;
}

/**
 * Combines ThemeProvider with typed component defaults (Level-2 customization).
 */
export function SilkProvider({
  defaults,
  children,
  ...themeProps
}: SilkProviderProps): JSX.Element {
  const value = useMemo(() => defaults ?? EMPTY_DEFAULTS, [defaults]);

  return (
    <ThemeProvider {...themeProps}>
      <SilkDefaultsContext.Provider value={value}>
        {children}
      </SilkDefaultsContext.Provider>
    </ThemeProvider>
  );
}
