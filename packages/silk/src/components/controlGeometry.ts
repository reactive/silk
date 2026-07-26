import { focusRingCss } from '../theme/focusRing';

/** Padding steps shared with Button for row rhythm. */
export const controlSizePadding = {
  sm: 'var(--silk-space-1) var(--silk-space-2)',
  md: 'var(--silk-space-2) var(--silk-space-3)',
  lg: 'var(--silk-space-3) var(--silk-space-4)',
} as const;

/**
 * Neutral text-control geometry shared by Input/Textarea (`input`) and Select
 * (`select`). Component-specific public CSS variables stay on the prefix —
 * Select must not inherit `--silk-input-*`.
 */
export function controlGeometryCss(prefix: 'input' | 'select'): string {
  return `
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
  appearance: none;
  background-color: var(--silk-${prefix}-bg, var(--silk-color-surface-sunken));
  color: var(--silk-color-text-primary);
  border: 1px solid var(--silk-${prefix}-border, var(--silk-color-border-subtle));
  border-radius: var(--silk-${prefix}-radius, var(--silk-radius-md));
  font-family: var(--silk-typography-body-family);
  font-weight: var(--silk-typography-body-weight);
  line-height: var(--silk-typography-body-line-height);
  transition:
    border-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing),
    box-shadow var(--silk-motion-fast-duration-ms) var(--silk-motion-fast-easing),
    background-color var(--silk-motion-fast-duration-ms)
      var(--silk-motion-fast-easing);

  &:where(:focus-visible),
  &:where([data-state='open']) {
    ${focusRingCss('var(--silk-color-tone-accent-focus-ring)')}
    border-color: var(--silk-color-tone-accent-border);
  }

  &:where([data-invalid='true']) {
    border-color: var(--silk-color-tone-danger-solid);
  }

  &:where([data-invalid='true']:focus-visible),
  &:where([data-invalid='true'][data-state='open']) {
    ${focusRingCss('var(--silk-color-tone-danger-focus-ring)')}
  }

  &:where(:disabled),
  &:where([aria-disabled='true']),
  &:where([data-disabled]) {
    cursor: not-allowed;
    color: var(--silk-color-tone-neutral-disabled-fg);
    background-color: var(--silk-color-tone-neutral-disabled-bg);
    border-color: transparent;
  }

  &:where([data-size='sm']) {
    min-height: var(--silk-space-7);
    padding: ${controlSizePadding.sm};
    font-size: var(--silk-typography-body-sm-size);
  }

  &:where([data-size='md']) {
    min-height: var(--silk-space-8);
    padding: ${controlSizePadding.md};
    font-size: var(--silk-typography-body-size);
  }

  &:where([data-size='lg']) {
    min-height: calc(var(--silk-space-8) + var(--silk-space-2));
    padding: ${controlSizePadding.lg};
    font-size: var(--silk-typography-body-size);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
}
