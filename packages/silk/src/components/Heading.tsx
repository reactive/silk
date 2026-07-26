import { css, cx } from '@linaria/core';
import {
  headingRecipe,
  type HeadingVariantProps,
  type TypographyRole,
} from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { textToneRulesCss } from '../theme/textToneCss';
import { typographyRoleCss } from '../theme/typographyCss';

type HeadingLevel = NonNullable<HeadingVariantProps['level']>;
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const levelToTag = {
  '1': 'h1',
  '2': 'h2',
  '3': 'h3',
  '4': 'h4',
  '5': 'h5',
  '6': 'h6',
} as const satisfies Record<HeadingLevel, HeadingTag>;

/** Default visual size when size is omitted — derived from semantic level. */
const levelToDefaultSize = {
  '1': 'xl',
  '2': 'lg',
  '3': 'md',
  '4': 'sm',
  '5': 'sm',
  '6': 'sm',
} as const satisfies Record<
  HeadingLevel,
  NonNullable<HeadingVariantProps['size']>
>;

const sizeToRole = {
  sm: 'headingSm',
  md: 'heading',
  lg: 'headingLg',
  xl: 'headingXl',
} as const satisfies Record<
  NonNullable<HeadingVariantProps['size']>,
  TypographyRole
>;

export interface HeadingProps
  extends Omit<ComponentPropsWithoutRef<'h2'>, 'color'>, HeadingVariantProps {
  readonly ref?: Ref<HTMLHeadingElement>;
  readonly children?: ReactNode;
}

const sizeRules: string = headingRecipe.variants.size
  .map(
    (size) => `
    &:where([data-size='${size}']) {
      ${typographyRoleCss(sizeToRole[size])}
    }
  `,
  )
  .join('\n');

const toneRules: string = textToneRulesCss(headingRecipe.variants.tone);

const headingClass: string = css`
  margin: 0;
  ${sizeRules}
  ${toneRules}
`;

/**
 * Semantic heading. `level` (1–6) derives the tag; visual `size` is independent
 * and defaults from level when omitted.
 */
export function Heading({
  className,
  level,
  size,
  tone,
  ...props
}: HeadingProps): JSX.Element {
  const defaults = useComponentDefaults('Heading');
  const resolvedLevel = level ?? defaults.level ?? headingRecipe.defaults.level;
  const resolvedSize =
    size ??
    defaults.size ??
    levelToDefaultSize[resolvedLevel] ??
    headingRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? headingRecipe.defaults.tone;

  const Tag = levelToTag[resolvedLevel];
  return (
    <Tag
      {...props}
      className={cx(headingClass, className)}
      data-level={resolvedLevel}
      data-size={resolvedSize}
      data-tone={resolvedTone}
    />
  );
}
