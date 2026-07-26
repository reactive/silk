import { css, cx } from '@linaria/core';
import { textRecipe, type TextVariantProps } from '@reactive/silk-core';
import { Slot } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { textToneRulesCss } from '../theme/textToneCss';
import { typographyRoleCss } from '../theme/typographyCss';

export interface TextProps
  extends Omit<ComponentPropsWithoutRef<'p'>, 'role'>, TextVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLParagraphElement>;
  readonly children?: ReactNode;
}

const roleRules: string = textRecipe.variants.role
  .map(
    (roleName) => `
    &:where([data-role='${roleName}']) {
      ${typographyRoleCss(roleName)}
    }
  `,
  )
  .join('\n');

const toneRules: string = textToneRulesCss(textRecipe.variants.tone);

const textClass: string = css`
  margin: 0;
  ${roleRules}
  ${toneRules}
`;

/**
 * Typography primitive. `role` is the typography role (not ARIA);
 * use `asChild` for custom elements/ARIA.
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
