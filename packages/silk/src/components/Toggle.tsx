import { cx } from '@linaria/core';
import { toggleRecipe, type ToggleVariantProps } from '@reactive/silk-core';
import { Toggle as RadixToggle } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { toggleControlClass } from './toggleControlCss';

export interface ToggleProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixToggle.Root>, 'asChild'>,
    ToggleVariantProps {
  readonly asChild?: boolean;
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}

export function Toggle({
  className,
  size,
  children,
  ...props
}: ToggleProps): JSX.Element {
  const defaults = useComponentDefaults('Toggle');
  const resolvedSize = size ?? defaults.size ?? toggleRecipe.defaults.size;

  return (
    <RadixToggle.Root
      {...props}
      className={cx(toggleControlClass, className)}
      data-size={resolvedSize}
    >
      {children}
    </RadixToggle.Root>
  );
}
