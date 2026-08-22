import type {
  AvatarVariantProps,
  BadgeVariantProps,
  BoxVariantProps,
  ButtonVariantProps,
  CardVariantProps,
  CheckboxVariantProps,
  HeadingVariantProps,
  InlineVariantProps,
  InputVariantProps,
  ProgressVariantProps,
  RadioGroupVariantProps,
  SeparatorVariantProps,
  SkeletonVariantProps,
  SpinnerVariantProps,
  StackVariantProps,
  StatusDotVariantProps,
  SurfaceVariantProps,
  SwitchVariantProps,
  TextVariantProps,
  TextareaVariantProps,
} from '@reactive/silk-core';
import { createContext, useContext, type JSX, type ReactNode } from 'react';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider.js';

/**
 * Typed per-component defaults for recipe-bearing native components.
 * Nested SilkProviders replace the entire map (no component-level merge).
 * Field has no recipe — excluded (matches web).
 */
export interface SilkDefaults {
  readonly Box?: Partial<BoxVariantProps>;
  readonly Stack?: Partial<StackVariantProps>;
  readonly Inline?: Partial<InlineVariantProps>;
  readonly Text?: Partial<TextVariantProps>;
  readonly Button?: Partial<ButtonVariantProps>;
  readonly Surface?: Partial<SurfaceVariantProps>;
  readonly Card?: Partial<CardVariantProps>;
  readonly Heading?: Partial<HeadingVariantProps>;
  readonly Badge?: Partial<BadgeVariantProps>;
  readonly Separator?: Partial<SeparatorVariantProps>;
  readonly Avatar?: Partial<AvatarVariantProps>;
  readonly StatusDot?: Partial<StatusDotVariantProps>;
  readonly Skeleton?: Partial<SkeletonVariantProps>;
  readonly Spinner?: Partial<SpinnerVariantProps>;
  readonly Progress?: Partial<ProgressVariantProps>;
  readonly Input?: Partial<InputVariantProps>;
  readonly Textarea?: Partial<TextareaVariantProps>;
  readonly Checkbox?: Partial<CheckboxVariantProps>;
  readonly Switch?: Partial<SwitchVariantProps>;
  readonly RadioGroup?: Partial<RadioGroupVariantProps>;
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
  return (
    <ThemeProvider {...themeProps}>
      <SilkDefaultsContext.Provider value={defaults ?? EMPTY_DEFAULTS}>
        {children}
      </SilkDefaultsContext.Provider>
    </ThemeProvider>
  );
}
