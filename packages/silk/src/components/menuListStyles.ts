import { css } from '@linaria/core';

/** Shared list-row chrome for DropdownMenu and Select. */
export const menuItemClass: string = css`
  display: flex;
  align-items: center;
  gap: var(--silk-space-2);
  box-sizing: border-box;
  margin: 0;
  padding: var(--silk-space-1) var(--silk-space-2);
  border-radius: var(--silk-radius-sm);
  font-family: var(--silk-typography-body-family);
  font-size: var(--silk-typography-body-sm-size);
  line-height: var(--silk-typography-body-line-height);
  color: var(--silk-color-text-primary);
  outline: none;
  cursor: default;
  user-select: none;
  transition:
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    color var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing);

  &:where([data-highlighted]) {
    background-color: var(--silk-color-tone-accent-subtle);
    color: var(--silk-color-tone-accent-text);
  }

  &:where([data-disabled]) {
    color: var(--silk-color-tone-neutral-disabled-fg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const menuLabelClass: string = css`
  padding: var(--silk-space-1) var(--silk-space-2);
  font-family: var(--silk-typography-label-family);
  font-size: var(--silk-typography-label-size);
  font-weight: var(--silk-typography-label-weight);
  color: var(--silk-color-text-secondary);
`;

export const menuSeparatorClass: string = css`
  height: 1px;
  margin: var(--silk-space-1) 0;
  background-color: var(--silk-color-border-subtle);
`;

export const menuIndicatorSlotClass: string = css`
  display: inline-flex;
  width: var(--silk-space-4);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

/** Open-state chevron rotation for Select icon / Accordion trigger. */
export const chevronOpenClass: string = css`
  flex-shrink: 0;
  transition: transform var(--silk-motion-fast-duration-ms)
    var(--silk-motion-fast-easing);

  [data-state='open'] > & {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
