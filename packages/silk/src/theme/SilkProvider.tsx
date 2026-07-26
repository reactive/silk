import type {
  ActionBarVariantProps,
  AvatarVariantProps,
  BadgeVariantProps,
  BoxVariantProps,
  ButtonVariantProps,
  CardVariantProps,
  CenterVariantProps,
  CheckboxVariantProps,
  CommentVariantProps,
  ContainerVariantProps,
  DialogVariantProps,
  EmptyStateVariantProps,
  GridVariantProps,
  HeadingVariantProps,
  InlineVariantProps,
  InputVariantProps,
  MediaObjectVariantProps,
  PopoverVariantProps,
  PostCardVariantProps,
  ProfileCardVariantProps,
  ProgressVariantProps,
  RadioGroupVariantProps,
  SelectVariantProps,
  SeparatorVariantProps,
  SkeletonVariantProps,
  SliderVariantProps,
  SpinnerVariantProps,
  StackVariantProps,
  StatGroupVariantProps,
  StatusDotVariantProps,
  SurfaceVariantProps,
  SwitchVariantProps,
  TabsVariantProps,
  TextVariantProps,
  TextareaVariantProps,
  ToastVariantProps,
  ToggleVariantProps,
} from '@reactive/silk-core';
import {
  createContext,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
} from 'react';
import { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';

/**
 * Typed per-component defaults. Type-only map — no runtime component registry.
 */
export interface SilkDefaults {
  readonly Button?: Partial<ButtonVariantProps>;
  readonly Text?: Partial<TextVariantProps>;
  readonly Stack?: Partial<StackVariantProps>;
  readonly Box?: Partial<BoxVariantProps>;
  readonly Inline?: Partial<InlineVariantProps>;
  readonly Grid?: Partial<GridVariantProps>;
  readonly Center?: Partial<CenterVariantProps>;
  readonly Container?: Partial<ContainerVariantProps>;
  readonly Separator?: Partial<SeparatorVariantProps>;
  readonly Dialog?: Partial<DialogVariantProps>;
  readonly Avatar?: Partial<AvatarVariantProps>;
  readonly Identity?: Readonly<{
    readonly size?: AvatarVariantProps['size'];
  }>;
  readonly Surface?: Partial<SurfaceVariantProps>;
  readonly Card?: Partial<CardVariantProps>;
  readonly Heading?: Partial<HeadingVariantProps>;
  readonly Badge?: Partial<BadgeVariantProps>;
  readonly StatusDot?: Partial<StatusDotVariantProps>;
  readonly MediaObject?: Partial<MediaObjectVariantProps>;
  readonly ActionBar?: Partial<ActionBarVariantProps>;
  readonly StatGroup?: Partial<StatGroupVariantProps>;
  readonly EmptyState?: Partial<EmptyStateVariantProps>;
  readonly PostCard?: Partial<PostCardVariantProps>;
  readonly Comment?: Partial<CommentVariantProps>;
  readonly ProfileCard?: Partial<ProfileCardVariantProps>;
  readonly Skeleton?: Partial<SkeletonVariantProps>;
  readonly Spinner?: Partial<SpinnerVariantProps>;
  readonly Progress?: Partial<ProgressVariantProps>;
  readonly Input?: Partial<InputVariantProps>;
  readonly Textarea?: Partial<TextareaVariantProps>;
  readonly Checkbox?: Partial<CheckboxVariantProps>;
  readonly RadioGroup?: Partial<RadioGroupVariantProps>;
  readonly Switch?: Partial<SwitchVariantProps>;
  readonly Slider?: Partial<SliderVariantProps>;
  readonly Popover?: Partial<PopoverVariantProps>;
  readonly Tabs?: Partial<TabsVariantProps>;
  readonly Select?: Partial<SelectVariantProps>;
  readonly Toast?: Partial<ToastVariantProps>;
  readonly Toggle?: Partial<ToggleVariantProps>;
  readonly ToggleGroup?: Partial<ToggleVariantProps>;
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
