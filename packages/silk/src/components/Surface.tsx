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

const interactiveHoverRules: string = `
  /* Conformance: both axis values must appear in extracted CSS. */
  &:where([data-interactive='false']) {
    cursor: inherit;
  }
  &:where([data-interactive='true'][data-elevation='sunken']):where(a:hover),
  &:where([data-interactive='true'][data-elevation='sunken']):where(button:hover),
  &:where([data-interactive='true'][data-elevation='flat']):where(a:hover),
  &:where([data-interactive='true'][data-elevation='flat']):where(button:hover) {
    box-shadow: var(--silk-surface-shadow, var(--silk-shadow-raised));
  }
  &:where([data-interactive='true'][data-elevation='raised']):where(a:hover),
  &:where([data-interactive='true'][data-elevation='raised']):where(button:hover),
  &:where([data-interactive='true'][data-elevation='overlay']):where(a:hover),
  &:where([data-interactive='true'][data-elevation='overlay']):where(button:hover) {
    box-shadow: var(--silk-surface-shadow, var(--silk-shadow-overlay));
  }
`;

const surfaceClass: string = css`
  /* Block box so asChild on <a> (inline by default) still lays out as a surface. */
  display: block;
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-color-text-primary);
  text-decoration: none;
  transition: box-shadow var(--silk-motion-fast-duration-ms)
    var(--silk-motion-fast-easing);

  ${elevationRules}
  ${radiusRules}
  ${borderRules}
  ${interactiveHoverRules}

  &:where(a),
  &:where(button) {
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Themed background container. `elevation` pairs surface fill + shadow
 * (sunken | flat | raised | overlay) — no separate tone axis.
 * `interactive` only elevates hover on real anchors/buttons.
 */
export function Surface({
  className,
  asChild = false,
  elevation,
  radius,
  border,
  interactive,
  ...props
}: SurfaceProps): JSX.Element {
  const defaults = useComponentDefaults('Surface');
  const resolvedElevation =
    elevation ?? defaults.elevation ?? surfaceRecipe.defaults.elevation;
  const resolvedRadius =
    radius ?? defaults.radius ?? surfaceRecipe.defaults.radius;
  const resolvedBorder =
    border ?? defaults.border ?? surfaceRecipe.defaults.border;
  const resolvedInteractive =
    interactive ??
    defaults.interactive ??
    surfaceRecipe.defaults.interactive;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(surfaceClass, className)}
      data-elevation={resolvedElevation}
      data-radius={resolvedRadius}
      data-border={resolvedBorder}
      data-interactive={resolvedInteractive}
    />
  );
}
