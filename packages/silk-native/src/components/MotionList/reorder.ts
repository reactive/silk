/**
 * Lists that rearrange: measure items by key before a change, then glide
 * each from where it was to where it is (FLIP, translate only), on the web
 * (adapted from the motion code of data-client's website).
 */
import type { MotionRecord, Spring } from '@reactive/silk-core';
import type { MotionKey } from './types.js';
import {
  arrive,
  glide,
  isCrossing,
  leave,
  measureOf,
  type MotionElement,
  type Point,
  type Position,
  stop,
} from './webAnimations.js';

type Items = ReadonlyMap<MotionKey, MotionElement>;
export type Positions = ReadonlyMap<MotionKey, Position>;

/** The theme's motion a list plays: a spring for glides, durations for fades. */
export interface ListMotion {
  readonly glide: Spring;
  readonly arrive: MotionRecord;
  readonly leave: MotionRecord;
}

/**
 * Reads where `items` are, and how fast they move on screen, before a change
 * moves them. An item with no box (inside a hidden parent) has no place to
 * glide from, so it's left out.
 */
export function measure(items: Items): Positions {
  const measured = new Map([...items].map(([key, el]) => [key, measureOf(el)]));
  const own = new Map([...measured.values()].map(({ el, velocity }) => [el, velocity]));
  const positions = new Map<MotionKey, Position>();
  for (const [key, position] of measured) {
    if (position.width || position.height)
      positions.set(key, { ...position, velocity: onScreen(position.el, own) });
  }
  return positions;
}

/**
 * `el`'s speed on screen: its own glide's plus those of the items it rides
 * inside, so it keeps its speed even when the change moves it to another.
 */
function onScreen(el: MotionElement, own: ReadonlyMap<MotionElement, Point>): Point {
  let { x, y } = own.get(el)!;
  for (let up = el.parentElement; up; up = up.parentElement) {
    const carried = own.get(up);
    if (carried) {
      x += carried.x;
      y += carried.y;
    }
  }
  return { x, y };
}

/**
 * Glides each item from where `before` saw its key to where it is now, so an
 * item React put under another parent travels there too. An item inside
 * another that moves rides along and travels only the rest of the way. A key
 * `before` lacks fades in, and a key that left fades out where it was. With
 * `fades` off, both just appear and go. Items crossing the others are lifted
 * over them until they land.
 */
export function reorder(
  before: Positions,
  items: Items,
  motion: ListMotion,
  { fades }: { readonly fades: boolean },
): void {
  // read before `stop` puts the lifted glides down
  const wereCrossing = new Set([...items.values()].filter(isCrossing));
  // the final layout, without glides in flight, before measuring it
  for (const el of items.values()) stop(el);
  const moves = new Map<MotionElement, Move>();
  const arrivals: MotionElement[] = [];
  for (const [key, el] of items) {
    const was = before.get(key);
    if (was) moves.set(el, { velocity: was.velocity, was: was.at, at: measureOf(el).at });
    else arrivals.push(el);
  }
  // every read is done: start the animations
  const planned = [...moves].map(([el, move]) => {
    const carrier = carrierOf(el, moves);
    const carried = carrier && moves.get(carrier)!;
    // a carried item travels, and keeps the speed, its carrier's glide doesn't give it
    const from = carried ? minus(offsetOf(move), offsetOf(carried)) : offsetOf(move);
    const velocity = carried ? minus(move.velocity, carried.velocity) : move.velocity;
    return { el, from, velocity, length: Math.hypot(from.x, from.y) };
  });
  const farthest = Math.max(0, ...planned.map(({ length }) => length));
  for (const { el, from, velocity, length } of planned) {
    // a crossing interrupted by another commit carries on lifted
    const lifted =
      length > NUDGE &&
      (wereCrossing.has(el) || (length >= farthest / 2 && passesAnother(el, moves)));
    glide(el, motion.glide, from, velocity, { lifted });
  }
  if (!fades) return;
  leave(
    [...before].filter(([key]) => !items.has(key)).map(([, position]) => position),
    motion.leave,
  );
  // an arrival holding an item that moves in shows at once, or its fade would hide that glide;
  // a walk up stops at an ancestor already added, whose own ancestors were added with it
  const ancestorsOfMoving = new Set<MotionElement>();
  for (const { el } of planned)
    for (let up = el.parentElement; up && !ancestorsOfMoving.has(up); up = up.parentElement)
      ancestorsOfMoving.add(up);
  for (const el of arrivals) if (!ancestorsOfMoving.has(el)) arrive(el, motion.arrive);
}

interface Move {
  readonly velocity: Point;
  readonly was: Point;
  readonly at: Point;
}

const minus = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const offsetOf = ({ was, at }: Move): Point => minus(was, at);

/** px: a move this short crosses nothing */
const NUDGE = 1;

/** Whether `el` changed sides with another item that stayed, not only slid into a gap */
function passesAnother(el: MotionElement, moves: ReadonlyMap<MotionElement, Move>) {
  const { was, at } = moves.get(el)!;
  for (const [other, them] of moves) {
    if (other === el) continue;
    const swapped = (['x', 'y'] as const).some((axis) => {
      const before = side(was[axis] - them.was[axis]);
      const after = side(at[axis] - them.at[axis]);
      return before && after && before !== after;
    });
    // checked last: the DOM calls cost the most
    if (swapped && !other.contains(el) && !el.contains(other)) return true;
  }
  return false;
}
const side = (d: number) => (Math.abs(d) <= NUDGE ? 0 : Math.sign(d));

/** The nearest moving item `el` is inside, if any */
function carrierOf(el: MotionElement, moving: ReadonlyMap<MotionElement, unknown>) {
  for (let up = el.parentElement; up; up = up.parentElement) if (moving.has(up)) return up;
}
