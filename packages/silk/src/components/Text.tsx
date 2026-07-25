import { css, cx } from '@linaria/core';
import { textRecipe, type TextVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface TextProps
  extends Omit<ComponentPropsWithoutRef<'p'>, 'role'>, TextVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLParagraphElement>;
  readonly children?: ReactNode;
}

const roleToCssKey = {
  body: 'body',
  bodySm: 'body-sm',
  heading: 'heading',
  headingLg: 'heading-lg',
  label: 'label',
  caption: 'caption',
} as const;

const toneColor = {
  primary: 'var(--silk-color-text-primary)',
  secondary: 'var(--silk-color-text-secondary)',
  accent: 'var(--silk-color-tone-accent-solid)',
  danger: 'var(--silk-color-tone-danger-solid)',
} as const;

const roleRules: string = textRecipe.variants.role
  .map((roleName) => {
    const key = roleToCssKey[roleName];
    return `
    &:where([data-role='${roleName}']) {
      font-family: var(--silk-typography-${key}-family);
      font-size: var(--silk-typography-${key}-size);
      line-height: var(--silk-typography-${key}-line-height);
      font-weight: var(--silk-typography-${key}-weight);
    }
  `;
  })
  .join('\n');

const toneRules: string = textRecipe.variants.tone
  .map(
    (toneName) => `
    &:where([data-tone='${toneName}']) {
      color: ${toneColor[toneName]};
    }
  `,
  )
  .join('\n');

const textClass: string = css`
  margin: 0;
  ${roleRules}
  ${toneRules}
`;

/**
 * Typography primitive — proves typography semantic tokens.
 * `role` is the typography role (not the ARIA role); use `asChild` for custom elements/ARIA.
 */
export function Text({
  className,
  asChild = false,
  role,
  tone,
  ...props
}: TextProps): JSX.Element {
  const defaults = useComponentDefaults('Text');
  const resolvedRole = role ?? defaults.role ?? textRecipe.defaults.role;
  const resolvedTone = tone ?? defaults.tone ?? textRecipe.defaults.tone;

  const Comp = asChild ? Slot.Root : 'p';
  return (
    <Comp
      {...props}
      className={cx(textClass, className)}
      data-role={resolvedRole}
      data-tone={resolvedTone}
    />
  );
}
