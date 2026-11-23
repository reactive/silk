/**
 * Where things sit along a Slider, and the inverse: what a point on it is
 * worth. A thumb's center runs from half a thumb past the edge `min` sits at
 * to half a thumb before the far edge, so no thumb overhangs (Radix's
 * in-bounds rule). Pure worklets; Slider owns the inputs (size, direction, bounds).
 */
import type { ViewStyle } from "react-native";

/** The edge of a slider that `min` sits at. */
export type SliderEdge = "left" | "right" | "bottom" | "top";

export const FAR: Record<SliderEdge, SliderEdge> = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom",
};

const MARGIN = {
  left: "marginLeft",
  right: "marginRight",
  bottom: "marginBottom",
  top: "marginTop",
} as const satisfies Record<SliderEdge, keyof ViewStyle>;

/**
 * Style for the box a slider's thumbs, range and marks sit in, so the
 * physical `left` / `right` that `placeAt` emits mean what a press's `x`
 * reads. A right-to-left React Native app turns `left` / `right`
 * into `start` / `end`, resolved by the parent's direction.
 */
export const PHYSICAL_FRAME: { readonly direction: "ltr" } = {
  direction: "ltr",
};

/** The edge `min` sits at, for a slider's orientation, reading direction and inversion. */
export function slideFrom(
  vertical: boolean,
  rtl: boolean,
  inverted: boolean
): SliderEdge {
  if (vertical) return inverted ? "top" : "bottom";
  // Right to left and inverted cancel out.
  return rtl !== inverted ? "right" : "left";
}

/** How far `value` is from `min` toward `max`, from 0 to 1. */
export function fractionIn(value: number, min: number, max: number): number {
  "worklet";
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
  edge: SliderEdge
): ViewStyle {
  "worklet";
  return {
    [edge]: `${fraction * 100}%`,
    [MARGIN[edge]]: thumbSize / 2 - fraction * thumbSize + offset,
  };
}

/** How far a thumb's center runs along a slider `length` long: all of it but a thumb. */
function travel(length: number, thumbSize: number): number {
  "worklet";
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
  edge: SliderEdge
): number {
  "worklet";
  const runs = travel(length, thumbSize);
  const fromTopLeft =
    runs > 0 ? Math.min(1, Math.max(0, (offset - thumbSize / 2) / runs)) : 0;
  return edge === "right" || edge === "bottom" ? 1 - fromTopLeft : fromTopLeft;
}

/** What maps a slider's values to points along it: its bounds, its thumb's size, and the edge `min` sits at. */
export interface SliderScale {
  readonly min: number;
  readonly max: number;
  readonly thumbSize: number;
  readonly from: SliderEdge;
}

/** The value at `offset` (from the top-left end) along a slider `length` long, clamped to its bounds. */
export function valueAt(
  offset: number,
  length: number,
  scale: SliderScale
): number {
  "worklet";
  const { min, max, thumbSize, from } = scale;
  return min + fractionAt(offset, length, thumbSize, from) * (max - min);
}

/** Where the center of a thumb at `value` sits, in pixels from `min`'s edge of a slider `length` long. */
export function centerOf(
  value: number,
  length: number,
  scale: SliderScale
): number {
  "worklet";
  const { min, max, thumbSize } = scale;
  return (
    thumbSize / 2 + fractionIn(value, min, max) * travel(length, thumbSize)
  );
}

/** The slider's units per pixel along a slider `length` long (at least a pixel's travel, so never infinite). */
export function unitsPerPixel(length: number, scale: SliderScale): number {
  "worklet";
  return (scale.max - scale.min) / Math.max(travel(length, scale.thumbSize), 1);
}

/**
 * Places a thumb's box `fraction` of the way from `from`, centered across.
 * It always sets the same edges (left and top, with their margins), so an
 * animated style keeps none from before the slider changed direction.
 */
export function thumbBoxAt(
  fraction: number,
  thumbSize: number,
  from: SliderEdge
): ViewStyle {
  "worklet";
  const center = -thumbSize / 2;
  // A centered box `fraction` from the far edge sits where it would `1 - fraction` from the near one.
  const fromTopLeft = towardMax(from) === 1 ? fraction : 1 - fraction;
  return from === "left" || from === "right"
    ? {
        ...placeAt(fromTopLeft, thumbSize, center, "left"),
        top: "50%",
        marginTop: center,
      }
    : {
        ...placeAt(fromTopLeft, thumbSize, center, "top"),
        left: "50%",
        marginLeft: center,
      };
}

/** Which way along its axis (x or y, as the screen counts) a slider runs from `edge` toward max. */
export function towardMax(edge: SliderEdge): 1 | -1 {
  "worklet";
  return edge === "left" || edge === "top" ? 1 : -1;
}

/** Moves a box `distance` from `edge` along the slider, by a transform. */
export function along(edge: SliderEdge, distance: number): ViewStyle {
  "worklet";
  const by = towardMax(edge) * distance;
  return {
    transform: [
      edge === "left" || edge === "right"
        ? { translateX: by }
        : { translateY: by },
    ],
  };
}
