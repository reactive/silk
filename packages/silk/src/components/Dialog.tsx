import { css, cx } from '@linaria/core';
import { dialogRecipe, type DialogVariantProps } from '@reactive/silk-core';
import { Dialog as RadixDialog } from 'radix-ui';
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { ThemeScopePortal } from '../theme/ThemeScope';

export const DialogRoot: typeof RadixDialog.Root = RadixDialog.Root;
export const DialogTrigger: typeof RadixDialog.Trigger = RadixDialog.Trigger;
export const DialogClose: typeof RadixDialog.Close = RadixDialog.Close;
export const DialogTitle: typeof RadixDialog.Title = RadixDialog.Title;
export const DialogDescription: typeof RadixDialog.Description =
  RadixDialog.Description;

const overlayClass: string = css`
  position: fixed;
  inset: 0;
  background-color: var(--silk-color-overlay);
  animation: silk-dialog-overlay-in var(--silk-motion-normal-duration-ms)
    var(--silk-motion-normal-easing);

  @keyframes silk-dialog-overlay-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const contentClass: string = css`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  box-sizing: border-box;
  max-height: calc(100vh - var(--silk-space-8));
  overflow: auto;
  background-color: var(--silk-color-surface-raised);
  color: var(--silk-color-text-primary);
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-lg);
  box-shadow: var(--silk-shadow-overlay);
  padding: var(--silk-space-5);
  animation: silk-dialog-content-in var(--silk-motion-normal-duration-ms)
    var(--silk-motion-normal-easing);

  @keyframes silk-dialog-content-in {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  &:where([data-size='sm']) {
    width: min(100% - var(--silk-space-6), 360px);
  }
  &:where([data-size='md']) {
    width: min(100% - var(--silk-space-6), 480px);
  }
  &:where([data-size='lg']) {
    width: min(100% - var(--silk-space-6), 640px);
  }
  &:where([data-size='full']) {
    width: calc(100% - var(--silk-space-6));
    max-height: calc(100vh - var(--silk-space-6));
  }
`;

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof RadixDialog.Content>,
    DialogVariantProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  /**
   * Portal target. When set, content/overlay portal into this element instead
   * of `document.body` (stacking, clipping, or measuring against a subtree).
   * Theme scope is reconstituted automatically for body portals; `container`
   * is not required for nested theming.
   */
  readonly container?: HTMLElement;
  readonly overlayClassName?: string;
}

/**
 * Assembled dialog surface: Portal + Overlay + Content.
 * Radix owns focus/keyboard/portal behavior; Silk owns visuals.
 * Body portals reconstitute the nearest ThemeProvider scope; pass `container`
 * only when the portal DOM must live in a specific subtree.
 */
export function DialogContent({
  className,
  size,
  container,
  overlayClassName,
  children,
  ...props
}: DialogContentProps): JSX.Element {
  const defaults = useComponentDefaults('Dialog');
  const resolvedSize = size ?? defaults.size ?? dialogRecipe.defaults.size;

  return (
    <RadixDialog.Portal container={container}>
      <ThemeScopePortal>
        <RadixDialog.Overlay
          className={cx(overlayClass, overlayClassName)}
        />
        <RadixDialog.Content
          {...props}
          className={cx(contentClass, className)}
          data-size={resolvedSize}
        >
          {children}
        </RadixDialog.Content>
      </ThemeScopePortal>
    </RadixDialog.Portal>
  );
}

export interface DialogNamespace {
  readonly Root: typeof DialogRoot;
  readonly Trigger: typeof DialogTrigger;
  readonly Close: typeof DialogClose;
  readonly Title: typeof DialogTitle;
  readonly Description: typeof DialogDescription;
  readonly Content: typeof DialogContent;
}

export const Dialog: DialogNamespace = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Close: DialogClose,
  Title: DialogTitle,
  Description: DialogDescription,
  Content: DialogContent,
};
