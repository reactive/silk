import { textRecipe, type TextVariantProps } from '@reactive/silk-core';
import type { ComponentRef, JSX, ReactNode, Ref } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';
import { mapTextStyle } from '../styles/mappers/visual.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { WEB } from '../web/host.js';

export interface TextProps
  extends TextVariantProps, Omit<RNTextProps, 'children' | 'role'> {
  readonly ref?: Ref<ComponentRef<typeof RNText>>;
  readonly children?: ReactNode;
}

export function Text({
  role,
  tone,
  measure,
  style,
  children,
  ref,
  ...rest
}: TextProps): JSX.Element {
  const { theme } = useTheme();
  const defaults = useComponentDefaults('Text');
  const resolved: TextVariantProps = {
    role: role ?? defaults.role ?? textRecipe.defaults.role,
    tone: tone ?? defaults.tone ?? textRecipe.defaults.tone,
    measure: measure ?? defaults.measure ?? textRecipe.defaults.measure,
  };
  const mapped = mapTextStyle(theme, resolved);
  // Natively a Text with onPress takes the press as the responder. On the web
  // its onPress is a click, which claims none, so it claims the responder
  // too: what wraps it (a Tooltip.Trigger) takes only presses nothing inside took.
  const claim = WEB && rest.onPress ? { onStartShouldSetResponder: () => true } : null;
  return (
    <RNText ref={ref} {...claim} {...rest} style={[mapped, style]}>
      {children}
    </RNText>
  );
}
