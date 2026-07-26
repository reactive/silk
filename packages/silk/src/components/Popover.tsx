import { css, cx } from '@linaria/core';
import { popoverRecipe, type PopoverVariantProps } from '@reactive/silk-core';
import { Popover as RadixPopover } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { ThemeScopePortal } from '../theme/ThemeScope';
import {
  floatingMotionClass,
  floatingSurfaceClass,
  floatingSurfacePaddedClass,
  floatingZIndex,
} from './floatingSurface';

export const PopoverRoot: typeof RadixPopover.Root = RadixPopover.Root;
export const PopoverTrigger: typeof RadixPopover.Trigger = RadixPopover.Trigger;
export const PopoverAnchor: typeof RadixPopover.Anchor = RadixPopover.Anchor;
export const PopoverClose: typeof RadixPopover.Close = RadixPopover.Close;

const contentClass: string = css`
  z-index: ${floatingZIndex.popover};

  &:where([data-size='sm']) {
    width: min(100vw - var(--silk-space-6), 220px);
  }
  &:where([data-size='md']) {
    width: min(100vw - var(--silk-space-6), 320px);
  }
  &:where([data-size='lg']) {
    width: min(100vw - var(--silk-space-6), 420px);
  }
`;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof RadixPopover.Content>,
    PopoverVariantProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  /**
   * Portal target. Theme scope is reconstituted automatically for body portals.
   */
  readonly container?: HTMLElement | DocumentFragment | null;
}

/**
 * Assembled popover surface: Portal + Content.
 * Arrow support deferred until overlay behavior is stable.
 */
export function PopoverContent({
  className,
  size,
  container,
  sideOffset = 4,
  children,
  ...props
}: PopoverContentProps): JSX.Element {
  const defaults = useComponentDefaults('Popover');
  const resolvedSize = size ?? defaults.size ?? popoverRecipe.defaults.size;

  return (
    <RadixPopover.Portal {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixPopover.Content
          {...props}
          sideOffset={sideOffset}
          className={cx(
            floatingSurfaceClass,
            floatingSurfacePaddedClass,
            floatingMotionClass,
            contentClass,
            className,
          )}
          data-size={resolvedSize}
        >
          {children}
        </RadixPopover.Content>
      </ThemeScopePortal>
    </RadixPopover.Portal>
  );
}

export interface PopoverNamespace {
  readonly Root: typeof PopoverRoot;
  readonly Trigger: typeof PopoverTrigger;
  readonly Anchor: typeof PopoverAnchor;
  readonly Close: typeof PopoverClose;
  readonly Content: typeof PopoverContent;
}

export const Popover: PopoverNamespace = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Close: PopoverClose,
  Content: PopoverContent,
};
