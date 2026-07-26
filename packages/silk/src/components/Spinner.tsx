import { css, cx } from '@linaria/core';
import { spinnerRecipe, type SpinnerVariantProps } from '@reactive/silk-core';
import type { ComponentPropsWithoutRef, JSX, Ref } from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';

export interface SpinnerProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    SpinnerVariantProps {
  /** Accessible name announced to assistive tech. */
  readonly label?: string;
  readonly ref?: Ref<HTMLSpanElement>;
}

const sizeMap = {
  sm: 'var(--silk-space-4)',
  md: 'var(--silk-space-5)',
  lg: 'var(--silk-space-7)',
} as const;

const sizeRules: string = spinnerRecipe.variants.size
  .map(
    (size) => `
    &:where([data-size='${size}']) {
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-width: ${size === 'sm' ? '2px' : '3px'};
    }
  `,
  )
  .join('\n');

const toneRules: string = tonePrivateVarsCss(spinnerRecipe.variants.tone, [
  'solid',
]);

const spinnerClass: string = css`
  display: inline-block;
  box-sizing: border-box;
  border-style: solid;
  border-radius: var(--silk-radius-full);
  border-color: color-mix(in srgb, var(--_tone-solid) 25%, transparent);
  border-top-color: var(--_tone-solid);
  animation: silk-spinner-rotate var(--silk-motion-loop-duration-ms)
    var(--silk-motion-loop-easing) infinite;

  @keyframes silk-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-style: dotted;
  }

  ${sizeRules}
  ${toneRules}
`;

const visuallyHiddenClass: string = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * Indeterminate loading indicator. Exposes role="status" with a visually-hidden label.
 */
export function Spinner({
  className,
  size,
  tone,
  label = 'Loading',
  ...props
}: SpinnerProps): JSX.Element {
  const defaults = useComponentDefaults('Spinner');
  const resolvedSize = size ?? defaults.size ?? spinnerRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? spinnerRecipe.defaults.tone;

  return (
    <span
      {...props}
      className={cx(spinnerClass, className)}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      role="status"
    >
      <span className={visuallyHiddenClass}>{label}</span>
    </span>
  );
}
