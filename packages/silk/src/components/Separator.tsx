import { css, cx } from '@linaria/core';
import {
  separatorRecipe,
  type SeparatorVariantProps,
} from '@reactive/silk-core';
import { Separator as RadixSeparator } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';

export interface SeparatorProps
  extends Omit<
      ComponentPropsWithoutRef<typeof RadixSeparator.Root>,
      'orientation'
    >,
    SeparatorVariantProps {
  readonly decorative?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

const orientationRules: string = `
  &:where([data-orientation='horizontal']) {
    width: 100%;
    height: 1px;
  }

  &:where([data-orientation='vertical']) {
    width: 1px;
    height: 100%;
    align-self: stretch;
  }
`;

const separatorClass: string = css`
  box-sizing: border-box;
  margin: 0;
  border: none;
  flex-shrink: 0;
  background-color: var(--silk-color-border-subtle);
  ${orientationRules}
`;

/**
 * Visual divider. Radix owns separator semantics (`role` / decorative);
 * Silk owns color and orientation sizing.
 */
export function Separator({
  className,
  orientation,
  decorative = true,
  ...props
}: SeparatorProps): JSX.Element {
  const defaults = useComponentDefaults('Separator');
  const resolvedOrientation =
    orientation ??
    defaults.orientation ??
    separatorRecipe.defaults.orientation;

  return (
    <RadixSeparator.Root
      {...props}
      decorative={decorative}
      orientation={resolvedOrientation}
      className={cx(separatorClass, className)}
      data-orientation={resolvedOrientation}
    />
  );
}
