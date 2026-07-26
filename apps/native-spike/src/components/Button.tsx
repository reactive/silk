import { buttonRecipe, type ButtonVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode } from 'react';
import {
  Pressable,
  Text as RNText,
  type PressableProps,
} from 'react-native';
import { mapButtonStyle } from '../styles/mapStyles';
import { useTheme } from '../theme/ThemeProvider';

export interface ButtonProps
  extends ButtonVariantProps, Omit<PressableProps, 'children' | 'style'> {
  readonly children?: ReactNode;
}

export function Button({
  variant,
  tone,
  size,
  density,
  disabled,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const { theme, density: themeDensity } = useTheme();
  const resolved: ButtonVariantProps = {
    variant: variant ?? buttonRecipe.defaults.variant,
    tone: tone ?? buttonRecipe.defaults.tone,
    size: size ?? buttonRecipe.defaults.size,
    density: density ?? themeDensity ?? buttonRecipe.defaults.density,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => {
        const styles = mapButtonStyle(
          theme,
          resolved,
          pressed,
          Boolean(disabled),
        );
        return styles.view;
      }}
    >
      {({ pressed }) => {
        const styles = mapButtonStyle(
          theme,
          resolved,
          pressed,
          Boolean(disabled),
        );
        return <RNText style={styles.text}>{children}</RNText>;
      }}
    </Pressable>
  );
}
