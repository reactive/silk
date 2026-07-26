import { css, cx } from '@linaria/core';
import { surfaceRecipe, type SurfaceVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { elevationRulesCss } from '../theme/elevationCss';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface SurfaceProps
  extends ComponentPropsWithoutRef<'div'>, SurfaceVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const elevationRules: string = elevationRulesCss(
  surfaceRecipe.variants.elevation,
  'surface',
);

const radiusRules: string = surfaceRecipe.variants.radius
  .map(
    (radius) => `
    &:where([data-radius='${radius}']) {
      border-radius: var(--silk-surface-radius, var(--silk-radius-${radius}));
    }
  `,
  )
  .join('\n');

const borderRules: string = `
  &:where([data-border='none']) {
    border: 1px solid transparent;
  }
  &:where([data-border='subtle']) {
    border: 1px solid var(--silk-surface-border, var(--silk-color-border-subtle));
  }
`;

const surfaceClass: string = css`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-color-text-primary);

  ${elevationRules}
  ${radiusRules}
  ${borderRules}
`;

/**
 * Themed background container. `elevation` pairs surface fill + shadow
 * (sunken | flat | raised | overlay) — no separate tone axis.
 */
export function Surface({
  className,
  asChild = false,
  elevation,
  radius,
  border,
  ...props
}: SurfaceProps): JSX.Element {
  const defaults = useComponentDefaults('Surface');
  const resolvedElevation =
    elevation ?? defaults.elevation ?? surfaceRecipe.defaults.elevation;
  const resolvedRadius =
    radius ?? defaults.radius ?? surfaceRecipe.defaults.radius;
  const resolvedBorder =
    border ?? defaults.border ?? surfaceRecipe.defaults.border;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(surfaceClass, className)}
      data-elevation={resolvedElevation}
      data-radius={resolvedRadius}
      data-border={resolvedBorder}
    />
  );
}
