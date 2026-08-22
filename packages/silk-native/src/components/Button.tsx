import { buttonRecipe, type ButtonVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Pressable,
  Text as RNText,
  type PressableProps,
  type View,
} from 'react-native';
import { mapButtonStyle } from '../styles/mappers/controls.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface ButtonProps
  extends ButtonVariantProps,
    Omit<PressableProps, 'children' | 'style'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
  /**
   * Escape hatch — composed after Silk styles (object, array, or function).
   * Function styles receive the full Pressable state.
   */
  readonly style?: PressableProps['style'];
}

export function Button({
  variant,
  tone,
  size,
  density,
  disabled,
  children,
  style,
  ref,
  accessibilityRole = 'button',
  accessibilityState,
  ...rest
}: ButtonProps): JSX.Element {
  const { theme, density: themeDensity } = useTheme();
  const defaults = useComponentDefaults('Button');
  const resolved: ButtonVariantProps = {
    variant: variant ?? defaults.variant ?? buttonRecipe.defaults.variant,
    tone: tone ?? defaults.tone ?? buttonRecipe.defaults.tone,
    size: size ?? defaults.size ?? buttonRecipe.defaults.size,
    density: density ?? defaults.density ?? themeDensity,
  };
  const isDisabled = Boolean(disabled);
  // Text color is press-independent — map once; view remaps only when pressed.
  const resting = mapButtonStyle(theme, resolved, false, isDisabled);

  return (
    <Pressable
      ref={ref}
      {...rest}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      disabled={disabled}
      style={(state) => {
        const view =
          state.pressed && !isDisabled
            ? mapButtonStyle(theme, resolved, true, false).view
            : resting.view;
        const consumer =
          typeof style === 'function' ? style(state) : style;
        return [view, consumer];
      }}
    >
      <RNText style={resting.text}>{children}</RNText>
    </Pressable>
  );
}
