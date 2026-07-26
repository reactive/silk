import { css, cx } from '@linaria/core';
import { buttonRecipe, type ButtonVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { densityClass } from '../theme/density.css';
import { useComponentDefaults } from '../theme/SilkProvider';
import { useThemeDensity } from '../theme/ThemeScope';

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'color'>,
    ButtonVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}

const sizePadding = {
  sm: 'var(--silk-space-1) var(--silk-space-2)',
  md: 'var(--silk-space-2) var(--silk-space-3)',
  lg: 'var(--silk-space-3) var(--silk-space-4)',
} as const;

const sizeFont = {
  sm: 'var(--silk-typography-label-size)',
  md: 'var(--silk-typography-label-size)',
  lg: 'var(--silk-typography-body-size)',
} as const;

const toneRules: string = buttonRecipe.variants.tone
  .map(
    (tone) => `
    &:where([data-tone='${tone}']) {
      --_tone-solid: var(--silk-color-tone-${tone}-solid);
      --_tone-on-solid: var(--silk-color-tone-${tone}-on-solid);
      --_tone-subtle: var(--silk-color-tone-${tone}-subtle);
      --_tone-border: var(--silk-color-tone-${tone}-border);
      --_tone-hover: var(--silk-color-tone-${tone}-hover);
      --_tone-active: var(--silk-color-tone-${tone}-active);
      --_tone-focus-ring: var(--silk-color-tone-${tone}-focus-ring);
      --_tone-disabled-fg: var(--silk-color-tone-${tone}-disabled-fg);
      --_tone-disabled-bg: var(--silk-color-tone-${tone}-disabled-bg);
    }
  `,
  )
  .join('\n');

const sizeRules: string = buttonRecipe.variants.size
  .map(
    (size) => `
    &:where([data-size='${size}']) {
      padding: ${sizePadding[size]};
      font-size: ${sizeFont[size]};
    }
  `,
  )
  .join('\n');

const buttonClass: string = css`
  /* Public override hooks (consumers set these); private vars resolve them */
  --_bg: var(--silk-button-bg, var(--_tone-solid));
  --_fg: var(--silk-button-fg, var(--_tone-on-solid));
  --_radius: var(--silk-button-radius, var(--silk-radius-md));

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--silk-space-1);
  box-sizing: border-box;
  margin: 0;
  border: 1px solid transparent;
  border-radius: var(--_radius);
  font-family: var(--silk-typography-label-family);
  font-weight: var(--silk-typography-label-weight);
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    color var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing),
    border-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    box-shadow var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing);

  &:where(:focus-visible) {
    outline: 2px solid var(--_tone-focus-ring);
    outline-offset: 2px;
  }

  &:where(:disabled),
  &:where([aria-disabled='true']) {
    cursor: not-allowed;
    background-color: var(--_tone-disabled-bg);
    color: var(--_tone-disabled-fg);
    border-color: transparent;
  }

  ${toneRules}

  &:where([data-variant='solid']) {
    background-color: var(--_bg);
    color: var(--_fg);
    border-color: var(--silk-button-border, transparent);

    &:where(:hover:not(:disabled):not([aria-disabled='true'])) {
      background-color: var(--silk-button-bg, var(--_tone-hover));
    }

    &:where(:active:not(:disabled):not([aria-disabled='true'])) {
      background-color: var(--silk-button-bg, var(--_tone-active));
    }
  }

  &:where([data-variant='soft']) {
    background-color: var(--silk-button-bg, var(--_tone-subtle));
    color: var(--silk-button-fg, var(--_tone-solid));
    border-color: var(--silk-button-border, transparent);

    &:where(:hover:not(:disabled):not([aria-disabled='true'])) {
      background-color: var(--silk-button-bg, var(--_tone-border));
    }
  }

  &:where([data-variant='outline']) {
    background-color: var(--silk-button-bg, transparent);
    color: var(--silk-button-fg, var(--_tone-solid));
    border-color: var(--silk-button-border, var(--_tone-border));

    &:where(:hover:not(:disabled):not([aria-disabled='true'])) {
      background-color: var(--silk-button-bg, var(--_tone-subtle));
    }
  }

  &:where([data-variant='ghost']) {
    background-color: var(--silk-button-bg, transparent);
    color: var(--silk-button-fg, var(--_tone-solid));
    border-color: var(--silk-button-border, transparent);

    &:where(:hover:not(:disabled):not([aria-disabled='true'])) {
      background-color: var(--silk-button-bg, var(--_tone-subtle));
    }
  }

  ${sizeRules}
`;

/**
 * Visual primitive — reference implementation of data-attribute variants,
 * interaction-state color contract, and public/private CSS variable pattern.
 * Density remaps effective space tokens (system-level); size padding uses those vars.
 */
export function Button({
  className,
  asChild = false,
  variant,
  tone,
  size,
  density,
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const defaults = useComponentDefaults('Button');
  const themeDensity = useThemeDensity();
  const resolvedVariant =
    variant ?? defaults.variant ?? buttonRecipe.defaults.variant;
  const resolvedTone = tone ?? defaults.tone ?? buttonRecipe.defaults.tone;
  const resolvedSize = size ?? defaults.size ?? buttonRecipe.defaults.size;
  const resolvedDensity =
    density ??
    defaults.density ??
    themeDensity ??
    buttonRecipe.defaults.density;

  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...props}
      type={asChild ? undefined : type}
      className={cx(buttonClass, densityClass, className)}
      data-variant={resolvedVariant}
      data-tone={resolvedTone}
      data-size={resolvedSize}
      data-density={resolvedDensity}
    />
  );
}
