import { inlineRecipe, type InlineVariantProps } from '@reactive/silk-core';
import type { JSX, ReactNode, Ref } from 'react';
import { View, type ViewProps } from 'react-native';
import { mapInlineStyle } from '../styles/mapStyles.js';
import { useComponentDefaults } from '../theme/SilkProvider.js';
import { useTheme } from '../theme/ThemeProvider.js';

export interface InlineProps
  extends InlineVariantProps, Omit<ViewProps, 'children'> {
  readonly ref?: Ref<View>;
  readonly children?: ReactNode;
}

/**
 * Horizontal flow layout. Same recipe contract as web Inline, minus
 * web-only `collapseBelow` (container queries).
 */
export function Inline({
  gap,
  align,
  justify,
  wrap,
  direction,
  style,
  children,
  ref,
  ...rest
}: InlineProps): JSX.Element {
  const { theme, density } = useTheme();
  const defaults = useComponentDefaults('Inline');
  const resolved: InlineVariantProps = {
    gap: gap ?? defaults.gap ?? inlineRecipe.defaults.gap,
    align: align ?? defaults.align ?? inlineRecipe.defaults.align,
    justify: justify ?? defaults.justify ?? inlineRecipe.defaults.justify,
    wrap: wrap ?? defaults.wrap ?? inlineRecipe.defaults.wrap,
    direction: direction ?? defaults.direction ?? inlineRecipe.defaults.direction,
  };
  const mapped = mapInlineStyle(theme, resolved, density);
  return (
    <View ref={ref} {...rest} style={[mapped, style]}>
      {children}
    </View>
  );
}
