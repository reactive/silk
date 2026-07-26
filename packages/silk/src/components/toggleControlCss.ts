import { css } from '@linaria/core';
import { toggleRecipe } from '@reactive/silk-core';
import { focusRingCss } from '../theme/focusRing';
import { controlSizePadding } from './controlStyles';

/** Min-heights match Input/Select (`controlGeometryCss`) for row rhythm. */
const sizeMinHeight = {
  sm: 'var(--silk-space-7)',
  md: 'var(--silk-space-8)',
  lg: 'calc(var(--silk-space-8) + var(--silk-space-2))',
} as const;

const sizeRules: string = toggleRecipe.variants.size
  .map(
    (size) => `
    &:where([data-size='${size}']) {
      padding: ${controlSizePadding[size]};
      min-height: ${sizeMinHeight[size]};
      font-size: ${
        size === 'lg'
          ? 'var(--silk-typography-body-size)'
          : 'var(--silk-typography-label-size)'
      };
    }
  `,
  )
  .join('\n');

/**
 * Shared chrome for Toggle and ToggleGroup.Item.
 *
 * Resting state carries a subtle neutral fill so the control reads as
 * interactive; pressed state is a solid accent fill (large luminance shift,
 * not color-only) with a raised shadow. Inside a ToggleGroup the sunken
 * container provides the affordance instead, so grouped items
 * (`data-grouped`) rest transparent — mirroring the Tabs `enclosed` variant.
 */
export const toggleControlClass: string = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--silk-space-1);
  box-sizing: border-box;
  margin: 0;
  min-width: 2.5em;
  border: 1px solid transparent;
  border-radius: var(--silk-radius-md);
  background-color: var(--silk-color-tone-neutral-subtle);
  color: var(--silk-color-text-primary);
  font-family: var(--silk-typography-label-family);
  font-weight: var(--silk-typography-label-weight);
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    color var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing),
    border-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    box-shadow var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);

  ${sizeRules}

  &:where(:hover:not(:disabled):not([data-state='on'])) {
    background-color: var(--silk-color-tone-neutral-subtle-hover);
  }

  &:where([data-grouped]) {
    border-radius: var(--silk-radius-sm);
  }

  &:where([data-grouped]:not([data-state='on']):not(:hover)) {
    background-color: transparent;
  }

  &:where([data-state='on']) {
    background-color: var(--silk-color-tone-accent-solid);
    color: var(--silk-color-tone-accent-on-solid);
    border-color: var(--silk-color-tone-accent-border);
    box-shadow: var(--silk-shadow-raised);
  }

  /* Inside the sunken group well the raised shadow's blur bleeds past the
     container edge and reads as a glitch; the solid fill is enough there. */
  &:where([data-grouped][data-state='on']) {
    box-shadow: none;
  }

  &:where([data-state='on']:hover:not(:disabled)) {
    background-color: var(--silk-color-tone-accent-hover);
  }

  &:where(:focus-visible) {
    ${focusRingCss('var(--silk-color-tone-accent-focus-ring)')}
  }

  &:where(:disabled) {
    cursor: not-allowed;
    color: var(--silk-color-tone-neutral-disabled-fg);
    background-color: var(--silk-color-tone-neutral-disabled-bg);
    border-color: transparent;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
