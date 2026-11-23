/**
 * A Slider's values: where a thumb moved to a number ends up, and which thumb
 * a press takes. Pure worklets, so a drag runs them on the UI thread and keys
 * on the JavaScript thread.
 */

export interface SliderBounds {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** The smallest gap between neighboring thumbs, in steps. */
  readonly minSteps: number;
}

/** The decimal places `n` has, including those of an exponent (1e-7 has 7). */
function decimals(n: number): number {
  'worklet';
  const [digits = '', exponent = '0'] = String(n).split('e');
  return Math.max(0, (digits.split('.')[1] ?? '').length - Number(exponent));
}

/** `value` on the step grid from `min`, within bounds. */
export function snap(value: number, { min, max, step }: SliderBounds): number {
  'worklet';
  const places = Math.max(decimals(step), decimals(min));
  const snapped = Number((Math.round((value - min) / step) * step + min).toFixed(places));
  // `+ 0` turns a -0 from the rounding into 0, which compares as the same value.
  return Math.min(max, Math.max(min, snapped)) + 0;
}

/**
 * The values after moving thumb `index` to `next` (snapped to the step grid
 * from `min`, within bounds, then sorted), and where that thumb ended up; or
 * undefined if neighbors would come closer than `minSteps` steps.
 */
export function moveThumb(
  values: readonly number[],
  next: number,
  index: number,
  bounds: SliderBounds,
): { values: number[]; index: number } | undefined {
  'worklet';
  const { step, minSteps } = bounds;
  const value = snap(next, bounds);
  const moved = values.map((each, i) => (i === index ? value : each)).sort((a, b) => a - b);
  // Counted in steps with a hair's slack, so float error (0.3 - 0.2, or values near 1e7)
  // doesn't fall short of a step; a half step to an off-grid `max` still does.
  const apart = moved.every(
    (each, i) => i === 0 || (each - moved[i - 1]!) / step >= minSteps - 1e-6,
  );
  return apart ? { values: moved, index: moved.indexOf(value) } : undefined;
}

/** The thumb nearest `value`, the first on a tie (Radix's). */
export function nearestThumb(values: readonly number[], value: number): number {
  'worklet';
  const distances = values.map((each) => Math.abs(each - value));
  return distances.indexOf(Math.min(...distances));
}

/**
 * Where thumb `index` of `values` can be drawn while a finger holds it at
 * `value`: there, kept within bounds and `minSteps` steps from its neighbors.
 */
export function clampToNeighbors(
  values: readonly number[],
  value: number,
  index: number,
  { min, max, step, minSteps }: SliderBounds,
): number {
  'worklet';
  const gap = minSteps * step;
  const low = index > 0 ? values[index - 1]! + gap : min;
  const high = index < values.length - 1 ? values[index + 1]! - gap : max;
  return Math.min(high, Math.max(low, value));
}
