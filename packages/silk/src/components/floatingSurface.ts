import { css } from '@linaria/core';

/** Stacking for floating layers (Dialog overlay/content stay local). */
export const floatingZIndex = {
  popover: 40,
  menu: 45,
  tooltip: 50,
  toast: 60,
} as const;

/**
 * Shared floating-surface treatment for Popover, DropdownMenu, Select,
 * Tooltip content, Dialog content, and Toast. Component classes only set
 * non-overlapping private vars / sizing. Motion is a separate class.
 */
export const floatingSurfaceClass: string = css`
  box-sizing: border-box;
  background-color: var(--silk-color-surface-raised);
  color: var(--silk-color-text-primary);
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
  box-shadow: var(--silk-shadow-overlay);
`;

/** Compact floating surface (Tooltip). */
export const floatingSurfaceCompactClass: string = css`
  padding: var(--silk-space-1) var(--silk-space-2);
  font-family: var(--silk-typography-label-family);
  font-size: var(--silk-typography-label-size);
  font-weight: var(--silk-typography-label-weight);
  line-height: 1.3;
  max-width: 240px;
`;

/** Standard floating surface padding (Popover / Menu / Select). */
export const floatingSurfacePaddedClass: string = css`
  padding: var(--silk-space-2);
`;

/**
 * Popper-anchored enter/exit. Uses individual `scale`/`translate` properties
 * so animations do not fight Radix Popper's inline `transform`. Distinct
 * open/closed keyframe names keep Presence mounted through exit.
 */
export const floatingMotionClass: string = css`
  transform-origin: var(--radix-popper-transform-origin, center);

  &:where([data-state='open']) {
    animation: silk-float-in var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  &:where([data-state='closed']) {
    animation: silk-float-out var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  @keyframes silk-float-in {
    from {
      opacity: 0;
      scale: 0.96;
      translate: calc(
          (var(--silk-float-side-left, 0) * 4px) +
            (var(--silk-float-side-right, 0) * -4px)
        )
        calc(
          (var(--silk-float-side-top, 0) * 4px) +
            (var(--silk-float-side-bottom, 0) * -4px)
        );
    }
    to {
      opacity: 1;
      scale: 1;
      translate: 0 0;
    }
  }

  @keyframes silk-float-out {
    from {
      opacity: 1;
      scale: 1;
    }
    to {
      opacity: 0;
      scale: 0.98;
    }
  }

  &:where([data-side='top']) {
    --silk-float-side-top: 1;
  }
  &:where([data-side='bottom']) {
    --silk-float-side-bottom: 1;
  }
  &:where([data-side='left']) {
    --silk-float-side-left: 1;
  }
  &:where([data-side='right']) {
    --silk-float-side-right: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-state='open']),
    &:where([data-state='closed']) {
      animation: none;
    }
  }
`;

/** Modal-style overlay fade (Dialog). Distinct open/closed keyframe names. */
export const overlayMotionClass: string = css`
  background-color: var(--silk-color-overlay);

  &:where([data-state='open']) {
    animation: silk-overlay-in var(--silk-motion-normal-duration-ms)
      var(--silk-motion-normal-easing);
  }

  &:where([data-state='closed']) {
    animation: silk-overlay-out var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  @keyframes silk-overlay-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes silk-overlay-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-state='open']),
    &:where([data-state='closed']) {
      animation: none;
    }
  }
`;

/**
 * Centered dialog panel motion. Animates `transform` intentionally — Dialog
 * owns centering via the same property (not Popper-positioned).
 */
export const dialogPanelMotionClass: string = css`
  &:where([data-state='open']) {
    animation: silk-dialog-panel-in var(--silk-motion-normal-duration-ms)
      var(--silk-motion-normal-easing);
  }

  &:where([data-state='closed']) {
    animation: silk-dialog-panel-out var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);
  }

  @keyframes silk-dialog-panel-in {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes silk-dialog-panel-out {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.98);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-state='open']),
    &:where([data-state='closed']) {
      animation: none;
    }
  }
`;
