import { css, cx } from '@linaria/core';
import { Tooltip as RadixTooltip } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';
import { ThemeScopePortal } from '../theme/ThemeScope';
import {
  floatingMotionClass,
  floatingSurfaceClass,
  floatingSurfaceCompactClass,
  floatingZIndex,
} from './floatingSurface';

export const TooltipProvider: typeof RadixTooltip.Provider =
  RadixTooltip.Provider;
export const TooltipRoot: typeof RadixTooltip.Root = RadixTooltip.Root;
export const TooltipTrigger: typeof RadixTooltip.Trigger = RadixTooltip.Trigger;

const contentClass: string = css`
  z-index: ${floatingZIndex.tooltip};
`;

export interface TooltipContentProps
  extends ComponentPropsWithoutRef<typeof RadixTooltip.Content> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  /**
   * Portal target. Theme scope is reconstituted automatically for body portals.
   */
  readonly container?: HTMLElement | DocumentFragment | null;
}

/** Mount `Tooltip.Provider` once at the app/surface root for delay coordination. */
export function TooltipContent({
  className,
  container,
  sideOffset = 4,
  children,
  ...props
}: TooltipContentProps): JSX.Element {
  return (
    <RadixTooltip.Portal {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixTooltip.Content
          {...props}
          sideOffset={sideOffset}
          className={cx(
            floatingSurfaceClass,
            floatingSurfaceCompactClass,
            floatingMotionClass,
            contentClass,
            className,
          )}
        >
          {children}
        </RadixTooltip.Content>
      </ThemeScopePortal>
    </RadixTooltip.Portal>
  );
}

export interface TooltipNamespace {
  readonly Provider: typeof TooltipProvider;
  readonly Root: typeof TooltipRoot;
  readonly Trigger: typeof TooltipTrigger;
  readonly Content: typeof TooltipContent;
}

export const Tooltip: TooltipNamespace = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
