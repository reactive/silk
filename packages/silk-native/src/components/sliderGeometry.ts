/**
 * Where things sit along a Slider, and the inverse: what a point on it is
 * worth. A thumb's center runs from half a thumb past the edge `min` sits at
 * to half a thumb before the far edge, so no thumb overhangs (Radix's
 * in-bounds rule). Pure worklets; Slider owns the inputs (size, direction, bounds).
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

/**
 * Style for the box a slider's thumbs, range and marks sit in, so the
 * physical `left` / `right` that `placeAt` emits mean what a press's `x`
 * reads. A right-to-left React Native app turns `left` / `right`
 * into `start` / `end`, resolved by the parent's direction.
 */
export const PHYSICAL_FRAME: { readonly direction: 'ltr' } = { direction: 'ltr' };

/** The edge `min` sits at, for a slider's orientation, reading direction and inversion. */
export function slideFrom(vertical: boolean, rtl: boolean, inverted: boolean): SliderEdge {
  if (vertical) return inverted ? 'top' : 'bottom';
  // Right to left and inverted cancel out.
  return rtl !== inverted ? 'right' : 'left';
}

/** How far `value` is from `min` toward `max`, from 0 to 1. */
export function fractionIn(value: number, min: number, max: number): number {
  'worklet';
  return max > min ? (value - min) / (max - min) : 0;
}

/**
 * Places a box `fraction` of the way from `edge`, where a thumb's center sits
 * at that fraction. Percent plus a fixed margin, so it needs no measured size,
 * as on a server. `offset` moves it further from `edge`; minus half its size
 * centers it on the point.
 */
export function placeAt(
  fraction: number,
  thumbSize: number,
  offset: number,
  edge: SliderEdge,
): ViewStyle {
  'worklet';
  return {
    [edge]: `${fraction * 100}%`,
    [MARGIN[edge]]: thumbSize / 2 - fraction * thumbSize + offset,
  };
}

/** How far a thumb's center runs along a slider `length` long: all of it but a thumb. */
export function travel(length: number, thumbSize: number): number {
  'worklet';
  return Math.max(0, length - thumbSize);
}

/**
 * The fraction of the way from `edge` at `offset` (from the top-left end)
 * along a slider `length` long, clamped: `placeAt`'s inverse.
 */
export function fractionAt(
  offset: number,
  length: number,
  thumbSize: number,
  edge: SliderEdge,
): number {
  'worklet';
  const runs = travel(length, thumbSize);
  const fromTopLeft = runs > 0 ? Math.min(1, Math.max(0, (offset - thumbSize / 2) / runs)) : 0;
  return edge === 'right' || edge === 'bottom' ? 1 - fromTopLeft : fromTopLeft;
}

/** Where a thumb's center sits, `fraction` of the way from `min`'s edge along a slider `length` long. */
export function centerAt(fraction: number, length: number, thumbSize: number): number {
  'worklet';
  return thumbSize / 2 + fraction * travel(length, thumbSize);
}

/** Which way along its axis (x or y, as the screen counts) a slider runs from `edge` toward max. */
export function towardMax(edge: SliderEdge): 1 | -1 {
  'worklet';
  return edge === 'left' || edge === 'top' ? 1 : -1;
}

/** Moves a box `distance` from `edge` along the slider, by a transform. */
export function along(edge: SliderEdge, distance: number): ViewStyle {
  'worklet';
  const by = towardMax(edge) * distance;
  return {
    transform: [edge === 'left' || edge === 'right' ? { translateX: by } : { translateY: by }],
  };
}
