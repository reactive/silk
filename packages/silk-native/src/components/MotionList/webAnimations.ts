/// <reference lib="dom" />
/**
 * Moving DOM elements on the web: Web Animations with keyframes sampled from
 * the spring, so the browser runs them on the compositor (adapted from the
 * motion code of data-client's website). react-native-web renders a
 * `MotionView` as a DOM element, which these animate directly.
 */
import {
  type MotionRecord,
  sampleSpringOffsets,
  type Spring,
  springAt,
  springAtRest,
  type SpringState,
} from '@reactive/silk-core';
import { SUBPIXEL } from '../../motion/subpixel.js';

/** A point or offset in px, on screen */
export interface Point {
  readonly x: number;
  readonly y: number;
}
const ORIGIN: Point = { x: 0, y: 0 };

/** The DOM element behind a `MotionView`, as far as the list's bookkeeping needs it */
export interface MotionElement {
  readonly parentElement: MotionElement | null;
  contains(other: MotionElement): boolean;
}

/** Where an item was, kept so a change that takes it away can fade it out there */
export interface Position {
  readonly at: Point;
  readonly velocity: Point;
  readonly el: MotionElement;
  readonly parent: MotionElement | null;
  readonly width: number;
  readonly height: number;
}

interface Glide {
  readonly animation: Animation;
  readonly spring: Spring;
  readonly start: readonly [x: SpringState, y: SpringState];
  /** The inline `z-index` the element had, while the glide lifts it over the others. */
  readonly unlifted: string | undefined;
}
const glides = new WeakMap<Element, Glide>();

const dom = (el: MotionElement) => el as unknown as HTMLElement;

/** Whether `el` can move at all (jsdom has no Web Animations) */
const canAnimate = (el: MotionElement) => typeof dom(el).animate === 'function';

/** Where `el` is on screen now, a glide in flight included, and its size */
export function measureOf(el: MotionElement): Omit<Position, 'el' | 'parent'> {
  const { left, top, width, height } = dom(el).getBoundingClientRect();
  return { at: { x: left, y: top }, velocity: velocityOf(el), width, height };
}

/**
 * Springs `el`'s `translate` from `from` to where layout puts it, keeping
 * `velocity` (px/s), in place of any glide it had. A `lifted` glide raises
 * `el` over its siblings, as it crosses them, until it lands or stops.
 */
export function glide(
  el: MotionElement,
  spring: Spring,
  from: Point,
  velocity: Point,
  { lifted }: { readonly lifted: boolean },
): void {
  stop(el);
  const node = dom(el);
  if (!canAnimate(el)) return;
  if (!from.x && !from.y && !velocity.x && !velocity.y) return;
  const start = [
    { offset: from.x, velocity: velocity.x },
    { offset: from.y, velocity: velocity.y },
  ] as const;
  const x = sampleSpringOffsets(spring, start[0], SUBPIXEL);
  const y = sampleSpringOffsets(spring, start[1], SUBPIXEL);
  const frames = Math.max(x.offsets.length, y.offsets.length);
  const keyframes = Array.from({ length: frames }, (_, i) => ({
    translate: `${x.offsets[i] ?? 0}px ${y.offsets[i] ?? 0}px`,
  }));
  const animation = node.animate(keyframes, { duration: Math.max(x.settleMs, y.settleMs) });
  glides.set(node, { animation, spring, start, unlifted: lifted ? node.style.zIndex : undefined });
  if (!lifted) return;
  node.style.zIndex = '1';
  // Only a glide that lands: one stopped first is put down by `stop`.
  animation.addEventListener('finish', () => {
    if (glides.get(node)?.animation === animation) stop(el);
  });
}

/** Whether `el` is in a lifted glide: crossing the others. */
export function isCrossing(el: MotionElement): boolean {
  return glides.get(dom(el))?.unlifted !== undefined;
}

/** How fast `el`'s glide is moving it right now (px/s) */
function velocityOf(el: MotionElement): Point {
  const current = glides.get(dom(el));
  if (!current || current.animation.playState === 'finished') return ORIGIN;
  const { animation, spring, start } = current;
  const t = Number(animation.currentTime ?? 0) / 1000;
  const x = springAt(spring, start[0], t);
  const y = springAt(spring, start[1], t);
  return springAtRest(x, SUBPIXEL) && springAtRest(y, SUBPIXEL)
    ? ORIGIN
    : { x: x.velocity, y: y.velocity };
}

/** Ends `el`'s glide, snapping it back to its layout position and stacking. */
export function stop(el: MotionElement): void {
  const node = dom(el);
  const current = glides.get(node);
  if (!current) return;
  current.animation.cancel();
  if (current.unlifted !== undefined) node.style.zIndex = current.unlifted;
  glides.delete(node);
}

const ARRIVE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

/** Fades a new item in on `fade`, a duration token. */
export function arrive(el: MotionElement, fade: MotionRecord): void {
  if (!canAnimate(el)) return;
  dom(el).animate(ARRIVE, { duration: fade.durationMs, easing: fade.easing });
}

// On a duration token quicker than the glide into its place, so its text is
// mostly gone before the item taking its place gets there.
const LEAVE: Keyframe[] = [{ opacity: 1 }, { opacity: 0, translate: '-12px 0' }];

/**
 * Puts the items React removed back where they were, out of the flow and out
 * of reach, while they fade out. Writes all, then reads all, then writes
 * again, so the browser lays the page out once however many leave.
 */
export function leave(positions: readonly Position[], fade: MotionRecord): void {
  const leaving = positions.filter(({ el, parent }) => {
    const list = parent && dom(parent);
    // React kept it (it moved under another key), or its list left too
    return !dom(el).isConnected && list?.isConnected && canAnimate(el);
  });
  for (const { el, parent, width, height } of leaving) {
    const node = dom(el);
    stop(el);
    node.inert = true;
    node.setAttribute('aria-hidden', 'true');
    Object.assign(node.style, {
      position: 'absolute',
      boxSizing: 'border-box',
      margin: '0',
      left: '0',
      top: '0',
      width: `${width}px`,
      height: `${height}px`,
      pointerEvents: 'none',
      zIndex: '2',
    });
    dom(parent!).append(node);
  }
  const origins = leaving.map(({ el }) => dom(el).getBoundingClientRect());
  leaving.forEach(({ el, at }, i) => {
    const node = dom(el);
    node.style.left = `${at.x - origins[i]!.left}px`;
    node.style.top = `${at.y - origins[i]!.top}px`;
    const gone = () => node.remove();
    const timing = { duration: fade.durationMs, easing: fade.easing, fill: 'forwards' } as const;
    node.animate(LEAVE, timing).finished.then(gone, gone);
  });
}
