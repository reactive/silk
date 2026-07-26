import { css, cx } from '@linaria/core';
import { ScrollArea as RadixScrollArea } from 'radix-ui';
import type { ComponentPropsWithoutRef, JSX, ReactNode, Ref } from 'react';

/**
 * Radix ScrollArea Viewport injects a constant SSR-rendered `<style>` that
 * hides native scrollbars (~170B). Outcomes of the static-CSS invariant hold
 * (no runtime-generated CSS, SSR-correct, nonce-compatible). See PRINCIPLES
 * amendment log.
 */

const rootClass: string = css`
  position: relative;
  overflow: hidden;
`;

const viewportClass: string = css`
  width: 100%;
  height: 100%;
  border-radius: inherit;
`;

const scrollbarClass: string = css`
  display: flex;
  user-select: none;
  touch-action: none;
  padding: 2px;
  transition: background-color var(--silk-motion-fast-duration-ms)
    var(--silk-motion-fast-easing);

  &:where([data-orientation='vertical']) {
    width: 10px;
  }

  &:where([data-orientation='horizontal']) {
    flex-direction: column;
    height: 10px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const thumbClass: string = css`
  flex: 1;
  position: relative;
  border-radius: var(--silk-radius-full, 999px);
  background-color: var(
    --silk-scrollarea-thumb,
    var(--silk-color-border-subtle)
  );

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    min-width: 44px;
    min-height: 44px;
  }
`;

const cornerClass: string = css`
  background-color: transparent;
`;

export function ScrollAreaRoot({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixScrollArea.Root> & {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
}): JSX.Element {
  return (
    <RadixScrollArea.Root {...props} className={cx(rootClass, className)}>
      {children}
    </RadixScrollArea.Root>
  );
}

export function ScrollAreaViewport({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixScrollArea.Viewport> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixScrollArea.Viewport
      {...props}
      className={cx(viewportClass, className)}
    />
  );
}

export function ScrollAreaScrollbar({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixScrollArea.Scrollbar> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixScrollArea.Scrollbar
      {...props}
      className={cx(scrollbarClass, className)}
    />
  );
}

export function ScrollAreaThumb({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixScrollArea.Thumb> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixScrollArea.Thumb {...props} className={cx(thumbClass, className)} />
  );
}

export function ScrollAreaCorner({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixScrollArea.Corner> & {
  readonly ref?: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <RadixScrollArea.Corner
      {...props}
      className={cx(cornerClass, className)}
    />
  );
}

export interface ScrollAreaAssembledProps
  extends ComponentPropsWithoutRef<typeof RadixScrollArea.Root> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
  readonly viewportClassName?: string;
  readonly nonce?: string;
}

/**
 * Convenience assembly: Root + Viewport + both scrollbars + Corner.
 * Pass `nonce` for CSP when Radix injects its constant viewport style.
 */
function ScrollAreaAssembled({
  className,
  viewportClassName,
  children,
  type = 'hover',
  nonce,
  ...props
}: ScrollAreaAssembledProps): JSX.Element {
  return (
    <ScrollAreaRoot {...props} className={className} type={type}>
      <ScrollAreaViewport
        {...(viewportClassName !== undefined
          ? { className: viewportClassName }
          : {})}
        {...(nonce !== undefined ? { nonce } : {})}
      >
        {children}
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaScrollbar orientation="horizontal">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaCorner />
    </ScrollAreaRoot>
  );
}

export interface ScrollAreaNamespace {
  readonly Root: typeof ScrollAreaRoot;
  readonly Viewport: typeof ScrollAreaViewport;
  readonly Scrollbar: typeof ScrollAreaScrollbar;
  readonly Thumb: typeof ScrollAreaThumb;
  readonly Corner: typeof ScrollAreaCorner;
  (props: ScrollAreaAssembledProps): JSX.Element;
}

export const ScrollArea: ScrollAreaNamespace = Object.assign(
  ScrollAreaAssembled,
  {
    Root: ScrollAreaRoot,
    Viewport: ScrollAreaViewport,
    Scrollbar: ScrollAreaScrollbar,
    Thumb: ScrollAreaThumb,
    Corner: ScrollAreaCorner,
  },
);
