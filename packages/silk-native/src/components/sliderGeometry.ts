/**
 * Where things sit along a Slider, and the inverse: what a point on it is
 * worth. A thumb's center runs from half a thumb past the edge `min` sits at
 * to half a thumb before the far edge, so no thumb overhangs (Radix's
 * in-bounds rule). Pure; Slider owns the inputs (size, direction, bounds).
 */
import type { ViewStyle } from 'react-native';

/** The edge of a slider that `min` sits at. */
export type SliderEdge = 'left' | 'right' | 'bottom' | 'top';

export const FAR: Record<SliderEdge, SliderEdge> = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom',
};

const MARGIN = {
  left: 'marginLeft',
  right: 'marginRight',
  bottom: 'marginBottom',
  top: 'marginTop',
} as const satisfies Record<SliderEdge, keyof ViewStyle>;

/** The edge `min` sits at, for a slider's orientation, reading direction and inversion. */
export function slideFrom(vertical: boolean, rtl: boolean, inverted: boolean): SliderEdge {
  if (vertical) return inverted ? 'top' : 'bottom';
  // Right to left and inverted cancel out.
  return rtl !== inverted ? 'right' : 'left';
}

/** How far `value` is from `min` toward `max`, from 0 to 1. */
export const fractionIn = (value: number, min: number, max: number): number =>
  max > min ? (value - min) / (max - min) : 0;

/**
 * Places a box `fraction` of the way from `edge`, where a thumb's center sits
 * at that fraction. Percent plus a fixed margin, so it needs no measured size,
 * as on a server. `offset` moves it further from `edge`; minus half its size
 * centers it on the point.
 */
export const placeAt = (
  fraction: number,
  thumbSize: number,
  offset: number,
  edge: SliderEdge,
): ViewStyle => ({
  [edge]: `${fraction * 100}%`,
  [MARGIN[edge]]: thumbSize / 2 - fraction * thumbSize + offset,
});

/**
 * The fraction of the way from the top-left end at `offset` along a slider
 * `length` long, clamped: `placeAt`'s inverse.
 */
export function fractionAt(offset: number, length: number, thumbSize: number): number {
  const travel = length - thumbSize;
  return travel > 0 ? Math.min(1, Math.max(0, (offset - thumbSize / 2) / travel)) : 0;
}
