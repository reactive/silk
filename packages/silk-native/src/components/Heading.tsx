import { headingRecipe, type HeadingVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';
import { mapHeadingStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface HeadingProps
  extends HeadingVariantProps, Omit<RNTextProps, 'children' | 'role'> {
  readonly ref?: Ref<RNText>;
  readonly children?: ReactNode;
}

export function Heading({
  level,
  size,
  tone,
  style,
  children,
  ref,
  accessibilityRole = 'header',
  ...rest
}: HeadingProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Heading');
  const resolvedLevel = level ?? defaults.level ?? headingRecipe.defaults.level;
  const resolvedSize = size ?? defaults.size;
  const resolved: HeadingVariantProps = {
    level: resolvedLevel,
    ...(resolvedSize !== undefined ? { size: resolvedSize } : {}),
    tone: tone ?? defaults.tone ?? headingRecipe.defaults.tone,
  };
  const mapped = mapHeadingStyle(theme, resolved);
  const headingLevel = Number(resolvedLevel);

  return (
    <RNText
      ref={ref}
      {...rest}
      accessibilityRole={accessibilityRole}
      // iOS VoiceOver uses accessibilityLevel; RNW maps aria-level.
      {...({
        accessibilityLevel: headingLevel,
        'aria-level': headingLevel,
      } as object)}
      style={[mapped, style]}
    >
      {children}
    </RNText>
  );
}
