/**
 * Where a Slider's thumbs and range are drawn: from the values and the moving
 * thumb as the UI thread has them, so they follow a finger without React.
 */
import { type SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { WEB } from '../web/host.js';
import {
  along,
  centerAt,
  FAR,
  fractionIn,
  placeAt,
  type SliderEdge,
} from './sliderGeometry.js';

/** No thumb is moving on its own: each is drawn at its value. */
export const NONE = -1;

/** What a slider's thumbs and range read to be drawn where the UI thread has them. */
export interface SliderTrack {
  /** Where the parts box runs along the slide, from the slider's top-left corner; 0 long until laid out. */
  readonly span: SharedValue<{ readonly start: number; readonly length: number }>;
  /** The values as the UI thread has them: ahead of React's while a slide reports them. */
  readonly placed: SharedValue<readonly number[]>;
  /** The place of the thumb drawn at `movingAt` instead of its value (held, or settling), or `NONE`. */
  readonly moving: SharedValue<number>;
  /** Where the moving thumb is drawn, in the slider's units. */
  readonly movingAt: SharedValue<number>;
  readonly min: number;
  readonly max: number;
  readonly thumbSize: number;
  readonly from: SliderEdge;
}

/** Where thumb `place` is drawn: at `heldAt` if it is the moving one (`held`), else at its value. */
function shownAt(values: readonly number[], held: number, heldAt: number, place: number): number {
  'worklet';
  return held === place ? heldAt : values[place]!;
}

/**
 * Where the range runs on a slider laid out `length` long, in pixels from
 * `min`'s edge: from the first thumb's center (the edge, for a single thumb)
 * to the last's.
 */
function rangeEdges(
  values: readonly number[],
  held: number,
  heldAt: number,
  length: number,
  min: number,
  max: number,
  thumbSize: number,
): { start: number; end: number } {
  'worklet';
  const last = values.length - 1;
  const center = (place: number) =>
    centerAt(fractionIn(shownAt(values, held, heldAt, place), min, max), length, thumbSize);
  return { start: last > 0 ? center(0) : 0, end: center(last) };
}

type AnimatedStyle = ReturnType<typeof useAnimatedStyle>;

// Each derived value and style reads its shared values in its own body: Reanimated reruns one
// only for those. Dependency arrays let a web build without the worklets Babel plugin run them;
// native warns on them. A transform reads a derived number, so a frame that leaves that number
// where it was sends the view nothing.

/**
 * The thumb at `place`, where the UI thread draws it. Until the slider is
 * laid out (on a server, too) it sits by percent, as `placeAt` places it;
 * then at the edge `min` sits at, moved along by a transform, so following
 * the finger lays nothing out.
 */
export function useThumbMotion(
  { span, placed, moving, movingAt, min, max, thumbSize, from }: SliderTrack,
  place: number,
): readonly [placement: AnimatedStyle, motion: AnimatedStyle] {
  // Before layout nothing slides, so the placement follows the values alone.
  const placement = useAnimatedStyle(
    () => {
      const fraction = span.get().length > 0 ? 0 : fractionIn(placed.get()[place]!, min, max);
      return placeAt(fraction, thumbSize, -thumbSize / 2, from);
    },
    WEB ? [span, placed, place, min, max, thumbSize, from] : undefined,
  );
  const offset = useDerivedValue(
    () => {
      const { length } = span.get();
      if (length === 0) return 0;
      const value = shownAt(placed.get(), moving.get(), movingAt.get(), place);
      return centerAt(fractionIn(value, min, max), length, thumbSize) - thumbSize / 2;
    },
    WEB ? [span, placed, moving, movingAt, place, min, max, thumbSize] : undefined,
  );
  const motion = useAnimatedStyle(
    () => along(from, offset.get()),
    WEB ? [offset, from] : undefined,
  );
  return [placement, motion];
}

/**
 * The range, where the UI thread draws the thumbs. Until laid out, `bar`
 * sits by percent; then `clip` (filling the track, clipping) starts at the
 * range's start and `bar` (as long as the track) ends at its end, both moved
 * by transforms.
 */
export function useRangeMotion({
  span,
  placed,
  moving,
  movingAt,
  min,
  max,
  thumbSize,
  from,
}: SliderTrack): {
  readonly clip: AnimatedStyle;
  readonly bar: readonly [placement: AnimatedStyle, motion: AnimatedStyle];
} {
  const placement = useAnimatedStyle(
    () => {
      const values = placed.get();
      if (span.get().length > 0) return FILL;
      const last = values.length - 1;
      return {
        ...FILL,
        // A single thumb's range starts at the track's edge, not at a thumb center.
        ...(last === 0 ? {} : placeAt(fractionIn(values[0]!, min, max), thumbSize, 0, from)),
        ...placeAt(1 - fractionIn(values[last]!, min, max), thumbSize, 0, FAR[from]),
      };
    },
    WEB ? [span, placed, min, max, thumbSize, from] : undefined,
  );
  const deps = WEB ? [span, placed, moving, movingAt, min, max, thumbSize] : undefined;
  const start = useDerivedValue(() => {
    const { length } = span.get();
    if (length === 0) return 0;
    return rangeEdges(placed.get(), moving.get(), movingAt.get(), length, min, max, thumbSize)
      .start;
  }, deps);
  // How far back from the track's far end the bar ends, at the range's end.
  const shift = useDerivedValue(() => {
    const { length } = span.get();
    if (length === 0) return 0;
    const edges = rangeEdges(
      placed.get(),
      moving.get(),
      movingAt.get(),
      length,
      min,
      max,
      thumbSize,
    );
    return edges.end - edges.start - length;
  }, deps);
  const clip = useAnimatedStyle(() => along(from, start.get()), WEB ? [start, from] : undefined);
  const motion = useAnimatedStyle(() => along(from, shift.get()), WEB ? [shift, from] : undefined);
  return { clip, bar: [placement, motion] };
}

/** The range's bar along the whole track, margins cleared of any percent placement. */
const FILL = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
};
