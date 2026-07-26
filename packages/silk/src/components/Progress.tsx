import { css, cx } from '@linaria/core';
import { progressRecipe, type ProgressVariantProps } from '@reactive/silk-core';
import { Progress as RadixProgress } from 'radix-ui';
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { useComponentDefaults } from '../theme/SilkProvider';
import { shimmerFillCss } from '../theme/shimmerCss';
import { tonePrivateVarsCss } from '../theme/tonePrivateVars';

export interface ProgressProps
  extends Omit<
      ComponentPropsWithoutRef<typeof RadixProgress.Root>,
      'asChild' | 'children'
    >,
    ProgressVariantProps {
  readonly ref?: Ref<HTMLDivElement>;
  /** Accessible name. Required for indeterminate progress. */
  readonly label?: string;
  readonly children?: ReactNode;
}

const sizeRules: string = `
  &:where([data-size='sm']) {
    height: var(--silk-space-1);
  }
  &:where([data-size='md']) {
    height: var(--silk-space-2);
  }
  &:where([data-size='lg']) {
    height: var(--silk-space-3);
  }
`;

const toneRules: string = tonePrivateVarsCss(progressRecipe.variants.tone, [
  'solid',
]);

const rootClass: string = css`
  position: relative;
  overflow: hidden;
  width: 100%;
  background-color: var(--silk-color-surface-sunken);
  border-radius: var(--silk-radius-full);
  transform: translateZ(0);

  ${sizeRules}
  ${toneRules}

  &:where([data-progress='indeterminate']) {
    ${shimmerFillCss(
      'silk-progress-indeterminate',
      'color-mix(in srgb, var(--_tone-solid) 35%, transparent)',
    )}
  }

  @media (prefers-reduced-motion: reduce) {
    &:where([data-progress='indeterminate']) {
      background-color: color-mix(
        in srgb,
        var(--_tone-solid) 35%,
        var(--silk-color-surface-sunken)
      );
    }
  }
`;

const indicatorClass: string = css`
  height: 100%;
  width: 100%;
  background-color: var(--_tone-solid);
  border-radius: inherit;
  transform: translateX(calc(var(--_pct, 0%) - 100%));
  transition: transform var(--silk-motion-normal-duration-ms)
    var(--silk-motion-normal-easing);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Determinate or indeterminate progress. Radix owns ARIA; Silk owns visuals.
 * Omit `value` for indeterminate (no aria-valuenow).
 */
export function Progress({
  className,
  size,
  tone,
  value,
  max = 100,
  label,
  ...props
}: ProgressProps): JSX.Element {
  const defaults = useComponentDefaults('Progress');
  const resolvedSize = size ?? defaults.size ?? progressRecipe.defaults.size;
  const resolvedTone = tone ?? defaults.tone ?? progressRecipe.defaults.tone;
  const safeMax = max > 0 ? max : 100;
  // Normalize invalid combinations the same way Radix does (null value → indeterminate).
  const indeterminate = value == null || Number.isNaN(value) || value < 0;
  const resolvedValue = indeterminate ? null : Math.min(value, safeMax);
  const percent =
    resolvedValue == null
      ? 0
      : Math.min(100, Math.max(0, (resolvedValue / safeMax) * 100));
  const accessibleName = label ?? props['aria-label'] ?? 'Progress';

  return (
    <RadixProgress.Root
      {...props}
      className={cx(rootClass, className)}
      value={resolvedValue}
      max={safeMax}
      data-size={resolvedSize}
      data-tone={resolvedTone}
      data-progress={indeterminate ? 'indeterminate' : 'determinate'}
      aria-label={accessibleName}
    >
      {!indeterminate ? (
        <RadixProgress.Indicator
          className={indicatorClass}
          style={{ '--_pct': `${percent}%` } as CSSProperties}
        />
      ) : null}
    </RadixProgress.Root>
  );
}
