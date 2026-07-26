import { css, cx } from '@linaria/core';
import { cardRecipe, type CardVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { elevationRulesCss } from '../theme/elevationCss';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface CardProps
  extends ComponentPropsWithoutRef<'div'>, CardVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}

const elevationRules: string = elevationRulesCss(
  cardRecipe.variants.elevation,
  'card',
);

const paddingRules: string = cardRecipe.variants.padding
  .map(
    (padding) => `
    &:where([data-padding='${padding}']) {
      padding: var(--silk-space-${padding});
    }
  `,
  )
  .join('\n');

const radiusRules: string = cardRecipe.variants.radius
  .map(
    (radius) => `
    &:where([data-radius='${radius}']) {
      border-radius: var(--silk-card-radius, var(--silk-radius-${radius}));
    }
  `,
  )
  .join('\n');

const cardClass: string = css`
  /* Block/flex box so asChild on <a> (inline by default) still lays out as a card. */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--silk-space-2);
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  color: var(--silk-color-text-primary);
  text-decoration: none;
  border: 1px solid var(--silk-card-border, var(--silk-color-border-subtle));
  transition:
    box-shadow var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing),
    border-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);

  ${elevationRules}
  ${paddingRules}
  ${radiusRules}

  &:where(a),
  &:where(button) {
    cursor: pointer;
  }

  &:where(a:focus-visible),
  &:where(button:focus-visible) {
    ${focusRingCss()}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Content card composed on Surface semantics.
 * Interactive cards: wrap a real link/button via `asChild` — no fake-control flag.
 */
export function Card({
  className,
  asChild = false,
  elevation,
  padding,
  radius,
  ...props
}: CardProps): JSX.Element {
  const defaults = useComponentDefaults('Card');
  const resolvedElevation =
    elevation ?? defaults.elevation ?? cardRecipe.defaults.elevation;
  const resolvedPadding =
    padding ?? defaults.padding ?? cardRecipe.defaults.padding;
  const resolvedRadius = radius ?? defaults.radius ?? cardRecipe.defaults.radius;

  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...props}
      className={cx(cardClass, className)}
      data-elevation={resolvedElevation}
      data-padding={resolvedPadding}
      data-radius={resolvedRadius}
    />
  );
}
