import { css, cx } from '@linaria/core';
import { toastRecipe, type ToastVariantProps } from '@reactive/silk-core';
import { Portal, Toast as RadixToast } from 'radix-ui';
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { ThemeScopePortal } from '../theme/ThemeScope';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';
import { floatingSurfaceClass, floatingZIndex } from './floatingSurface';

export const ToastProvider: typeof RadixToast.Provider = RadixToast.Provider;

const viewportClass: string = css`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: ${floatingZIndex.toast};
  display: flex;
  flex-direction: column;
  gap: var(--silk-space-2);
  width: min(100vw - var(--silk-space-6), 380px);
  max-height: 100vh;
  margin: 0;
  padding: var(--silk-space-4);
  list-style: none;
  outline: none;
`;

const toneRules: string = tonePrivateVarsCss(toastRecipe.variants.tone, [
  'solid',
  'on-solid',
  'text',
  'subtle',
  'border',
  'focus-ring',
]);

const rootClass: string = css`
  ${toneRules}

  position: relative;
  display: grid;
  grid-template-areas:
    'title action close'
    'description action close';
  grid-template-columns: 1fr auto auto;
  gap: var(--silk-space-1) var(--silk-space-2);
  align-items: center;
  padding: var(--silk-space-3) var(--silk-space-4);
  border-color: var(--_tone-border);

  &:where([data-tone='success']),
  &:where([data-tone='danger']) {
    background-color: var(--_tone-subtle);
    color: var(--_tone-text);
    border-color: var(--_tone-border);
  }

  &:where([data-state='open']) {
    animation: silk-toast-in var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  &:where([data-state='closed']) {
    animation: silk-toast-out var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  &:where([data-swipe='move']) {
    transform: translate(
      var(--radix-toast-swipe-move-x, 0px),
      var(--radix-toast-swipe-move-y, 0px)
    );
  }

  &:where([data-swipe='cancel']) {
    transform: translate(0, 0);
    transition: transform var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  &:where([data-swipe='end']) {
    animation: silk-toast-swipe-out var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  @keyframes silk-toast-in {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes silk-toast-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes silk-toast-swipe-out {
    from {
      opacity: 1;
      transform: translate(
        var(--radix-toast-swipe-end-x, 0px),
        var(--radix-toast-swipe-end-y, 0px)
      );
    }
    to {
      opacity: 0;
      transform: translate(
        var(--radix-toast-swipe-end-x, 0px),
        var(--radix-toast-swipe-end-y, 0px)
      );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-state='open']),
    &:where([data-state='closed']),
    &:where([data-swipe='end']) {
      animation: none;
    }
    &:where([data-swipe='cancel']) {
      transition: none;
    }
  }
`;

const titleClass: string = css`
  grid-area: title;
  font-family: var(--silk-typography-label-family);
  font-size: var(--silk-typography-label-size);
  font-weight: var(--silk-typography-label-weight);
  color: inherit;
`;

const descriptionClass: string = css`
  grid-area: description;
  font-family: var(--silk-typography-body-family);
  font-size: var(--silk-typography-body-sm-size);
  color: var(--silk-color-text-secondary);

  :where([data-tone='success']) &,
  :where([data-tone='danger']) & {
    color: inherit;
    opacity: 0.85;
  }
`;

const actionClass: string = css`
  grid-area: action;
  font-family: var(--silk-typography-label-family);
  font-size: var(--silk-typography-label-size);
  font-weight: var(--silk-typography-label-weight);
  color: var(--_tone-text, var(--silk-color-tone-accent-text));
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--silk-space-1) var(--silk-space-2);
  border-radius: var(--silk-radius-sm);

  &:where(:hover) {
    background-color: var(--_tone-subtle, var(--silk-color-tone-accent-subtle));
  }
`;

const closeClass: string = css`
  grid-area: close;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--silk-space-5);
  height: var(--silk-space-5);
  border: none;
  border-radius: var(--silk-radius-sm);
  background: transparent;
  color: var(--silk-color-text-secondary);
  cursor: pointer;

  &:where(:hover) {
    background-color: var(--silk-color-tone-neutral-subtle);
  }
`;

export interface ToastViewportProps
  extends ComponentPropsWithoutRef<typeof RadixToast.Viewport> {
  readonly ref?: Ref<HTMLOListElement>;
  /**
   * Portal target for the viewport. Theme scope is reconstituted automatically.
   */
  readonly container?: HTMLElement | DocumentFragment | null;
}

/**
 * Toast viewport. Portaled via generic Portal.Root (Toast has no Portal part)
 * with theme reconstitution.
 */
export function ToastViewport({
  className,
  container,
  label = 'Notifications',
  hotkey,
  ...props
}: ToastViewportProps): JSX.Element {
  return (
    <Portal.Root {...(container != null ? { container } : {})}>
      <ThemeScopePortal>
        <RadixToast.Viewport
          {...props}
          label={label}
          {...(hotkey !== undefined ? { hotkey } : {})}
          className={cx(viewportClass, className)}
        />
      </ThemeScopePortal>
    </Portal.Root>
  );
}

export interface ToastRootProps
  extends ComponentPropsWithoutRef<typeof RadixToast.Root>,
    ToastVariantProps {
  readonly ref?: Ref<HTMLLIElement>;
  readonly children?: ReactNode;
}

/**
 * Toast root. Swipe motion uses Radix-populated
 * `--radix-toast-swipe-{move,end}-{x,y}` CSS variables.
 */
export function ToastRoot({
  className,
  tone,
  children,
  ...props
}: ToastRootProps): JSX.Element {
  const defaults = useComponentDefaults('Toast');
  const resolvedTone = tone ?? defaults.tone ?? toastRecipe.defaults.tone;

  return (
    <RadixToast.Root
      {...props}
      className={cx(floatingSurfaceClass, rootClass, className)}
      data-tone={resolvedTone}
    >
      {children}
    </RadixToast.Root>
  );
}

export function ToastTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixToast.Title> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixToast.Title {...props} className={cx(titleClass, className)} />
  );
}

export function ToastDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixToast.Description> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixToast.Description
      {...props}
      className={cx(descriptionClass, className)}
    />
  );
}

export function ToastAction({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixToast.Action> & {
  readonly ref?: Ref<HTMLButtonElement>;
}): JSX.Element {
  return (
    <RadixToast.Action {...props} className={cx(actionClass, className)} />
  );
}

export function ToastClose({
  className,
  children = '×',
  ...props
}: ComponentPropsWithoutRef<typeof RadixToast.Close> & {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <RadixToast.Close {...props} className={cx(closeClass, className)}>
      {children}
    </RadixToast.Close>
  );
}

export interface ToastNamespace {
  readonly Provider: typeof ToastProvider;
  readonly Viewport: typeof ToastViewport;
  readonly Root: typeof ToastRoot;
  readonly Title: typeof ToastTitle;
  readonly Description: typeof ToastDescription;
  readonly Action: typeof ToastAction;
  readonly Close: typeof ToastClose;
}

export const Toast: ToastNamespace = {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
};
