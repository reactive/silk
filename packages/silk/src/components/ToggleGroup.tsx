import { css, cx } from '@linaria/core';
import { toggleRecipe, type ToggleVariantProps } from '@reactive/silk-core';
import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { toggleControlClass } from './toggleControlCss';

const ToggleGroupSizeContext = createContext<
  ToggleVariantProps['size'] | undefined
>(undefined);

/* Segmented-control well; mirrors the Tabs `enclosed` list treatment. */
const rootClass: string = css`
  display: inline-flex;
  align-items: center;
  gap: var(--silk-space-1);
  padding: var(--silk-space-1);
  background-color: var(--silk-color-surface-sunken);
  border-radius: var(--silk-radius-md);
`;

export type ToggleGroupRootProps = ComponentPropsWithoutRef<
  typeof RadixToggleGroup.Root
> &
  ToggleVariantProps & {
    readonly children?: ReactNode;
  };

export type ToggleGroupItemProps = ComponentPropsWithoutRef<
  typeof RadixToggleGroup.Item
> &
  ToggleVariantProps & {
    readonly ref?: Ref<HTMLButtonElement>;
    readonly children?: ReactNode;
  };

export function ToggleGroupRoot({
  className,
  size,
  children,
  ...props
}: ToggleGroupRootProps): JSX.Element {
  const defaults = useComponentDefaults('ToggleGroup');
  const resolvedSize = size ?? defaults.size ?? toggleRecipe.defaults.size;

  return (
    <ToggleGroupSizeContext.Provider value={resolvedSize}>
      <RadixToggleGroup.Root {...props} className={cx(rootClass, className)}>
        {children}
      </RadixToggleGroup.Root>
    </ToggleGroupSizeContext.Provider>
  );
}

export function ToggleGroupItem({
  className,
  size,
  children,
  ...props
}: ToggleGroupItemProps): JSX.Element {
  const groupSize = useContext(ToggleGroupSizeContext);
  const resolvedSize = size ?? groupSize ?? toggleRecipe.defaults.size;

  return (
    <RadixToggleGroup.Item
      {...props}
      className={cx(toggleControlClass, className)}
      data-size={resolvedSize}
      data-grouped=""
    >
      {children}
    </RadixToggleGroup.Item>
  );
}

export interface ToggleGroupNamespace {
  readonly Root: typeof ToggleGroupRoot;
  readonly Item: typeof ToggleGroupItem;
}

export const ToggleGroup: ToggleGroupNamespace = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
};
