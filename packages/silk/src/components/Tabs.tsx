import { css, cx } from '@linaria/core';
import { tabsRecipe, type TabsVariantProps } from '@reactive/silk-core';
import { Tabs as RadixTabs } from 'radix-ui';
import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { focusRingCss } from '../theme/focusRing';
import { useComponentDefaults } from '../theme/SilkProvider';

const TabsVariantContext = createContext<Required<TabsVariantProps>>({
  variant: tabsRecipe.defaults.variant,
});

function useTabsVariant(): Required<TabsVariantProps> {
  return useContext(TabsVariantContext);
}

export interface TabsRootProps
  extends ComponentPropsWithoutRef<typeof RadixTabs.Root>,
    TabsVariantProps {
  readonly children?: ReactNode;
}

export function TabsRoot({
  variant,
  className,
  children,
  ...props
}: TabsRootProps): JSX.Element {
  const defaults = useComponentDefaults('Tabs');
  const resolvedVariant =
    variant ?? defaults.variant ?? tabsRecipe.defaults.variant;

  return (
    <TabsVariantContext.Provider value={{ variant: resolvedVariant }}>
      <RadixTabs.Root {...props} className={cx(rootClass, className)}>
        {children}
      </RadixTabs.Root>
    </TabsVariantContext.Provider>
  );
}

const rootClass: string = css`
  display: flex;
  flex-direction: column;
  gap: var(--silk-space-3);
`;

const listClass: string = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--silk-space-1);
  align-items: stretch;

  &:where([data-variant='line']) {
    border-bottom: 1px solid var(--silk-color-border-subtle);
    gap: 0;
  }

  &:where([data-variant='enclosed']) {
    padding: var(--silk-space-1);
    background-color: var(--silk-color-surface-sunken);
    border-radius: var(--silk-radius-md);
  }
`;

const triggerClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  padding: var(--silk-space-2) var(--silk-space-3);
  border: none;
  background: transparent;
  color: var(--silk-color-text-secondary);
  font-family: var(--silk-typography-label-family);
  font-size: var(--silk-typography-label-size);
  font-weight: var(--silk-typography-label-weight);
  line-height: 1.2;
  cursor: pointer;
  transition:
    color var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing),
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    box-shadow var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing);

  &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-accent-focus-ring)')}
  }

  &:where(:disabled) {
    cursor: not-allowed;
    color: var(--silk-color-tone-neutral-disabled-fg);
  }

  &:where([data-variant='line']) {
    border-radius: 0;
    box-shadow: inset 0 -2px 0 transparent;

    &:where([data-state='active']) {
      color: var(--silk-color-text-primary);
      box-shadow: inset 0 -2px 0 var(--silk-color-tone-accent-solid);
    }
  }

  &:where([data-variant='enclosed']) {
    border-radius: var(--silk-radius-sm);

    &:where([data-state='active']) {
      color: var(--silk-color-text-primary);
      background-color: var(--silk-color-surface-raised);
      box-shadow: var(--silk-shadow-raised);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const contentClass: string = css`
  outline: none;

  &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-accent-focus-ring)')}
  }
`;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.List> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  const { variant } = useTabsVariant();
  return (
    <RadixTabs.List
      {...props}
      className={cx(listClass, className)}
      data-variant={variant}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.Trigger> & {
  readonly ref?: Ref<HTMLButtonElement>;
}): JSX.Element {
  const { variant } = useTabsVariant();
  return (
    <RadixTabs.Trigger
      {...props}
      className={cx(triggerClass, className)}
      data-variant={variant}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.Content> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixTabs.Content {...props} className={cx(contentClass, className)} />
  );
}

export interface TabsNamespace {
  readonly Root: typeof TabsRoot;
  readonly List: typeof TabsList;
  readonly Trigger: typeof TabsTrigger;
  readonly Content: typeof TabsContent;
}

export const Tabs: TabsNamespace = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
