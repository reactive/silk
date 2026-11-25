import { defaultMotion } from '@reactive/silk-core';
import { beforeEach, describe, expect, rs, test } from '@rstest/core';
import type { MotionElement, Point } from './webAnimations.js';

/** A fake engine: where each element is comes from `layout`, and every call is recorded. */
const mocked = rs.hoisted(() => {
  const layout = new Map<unknown, unknown>();
  /** Elements in flight, by how fast they move. */
  const velocity = new Map<unknown, unknown>();
  /** Elements with no box (inside a hidden parent). */
  const hidden = new Set<unknown>();
  /** Elements in a lifted glide. */
  const crossing = new Set<unknown>();
  const calls: [string, ...unknown[]][] = [];
  const call = (name: string, args: unknown[], result?: unknown) => {
    calls.push([name, ...args]);
    return result;
  };
  return { layout, velocity, hidden, crossing, calls, call };
});

rs.mock('./webAnimations.js', () => ({
  measureOf: (el: unknown) => ({
    at: mocked.layout.get(el),
    velocity: mocked.velocity.get(el) ?? { x: 0, y: 0 },
    width: mocked.hidden.has(el) ? 0 : 10,
    height: mocked.hidden.has(el) ? 0 : 10,
  }),
  glide: (...args: unknown[]) => {
    if ((args[4] as { lifted: boolean }).lifted) mocked.crossing.add(args[0]);
    mocked.call('glide', args);
  },
  isCrossing: (el: unknown) => mocked.crossing.has(el),
  stop: (...args: unknown[]) => {
    mocked.crossing.delete(args[0]);
    mocked.call('stop', args);
  },
  arrive: (...args: unknown[]) => mocked.call('arrive', args),
  leave: (...args: unknown[]) => mocked.call('leave', args),
}));

const { measure, reorder } = await import('./reorder.js');

const motion = {
  glide: defaultMotion.brisk,
  arrive: defaultMotion.normal,
  leave: defaultMotion.fast,
};

function element(at: Point, parent: MotionElement | null = null): MotionElement {
  const el: MotionElement = {
    parentElement: parent,
    contains: (other) => {
      for (let up: MotionElement | null = other; up; up = up.parentElement)
        if (up === el) return true;
      return false;
    },
  };
  mocked.layout.set(el, at);
  return el;
}

/** The elements glided lifted, over the others. */
const lifted = () =>
  named('glide')
    .filter((args) => (args[4] as { lifted: boolean }).lifted)
    .map(([el]) => el);

const named = (name: string) =>
  mocked.calls.filter(([call]) => call === name).map(([, ...args]) => args);

beforeEach(() => {
  mocked.layout.clear();
  mocked.velocity.clear();
  mocked.hidden.clear();
  mocked.crossing.clear();
  mocked.calls.length = 0;
});

describe('reorder', () => {
  test('glides a moved item from where it was', () => {
    const row = element({ x: 0, y: 0 });
    const before = measure(new Map([['a', row]]));
    mocked.layout.set(row, { x: 0, y: 40 });
    reorder(before, new Map([['a', row]]), motion, { fades: true });
    expect(named('glide')).toEqual([
      [row, motion.glide, { x: 0, y: -40 }, { x: 0, y: 0 }, { lifted: false }],
    ]);
  });

  test('moves an item inside a moving one only the rest of the way', () => {
    const group = element({ x: 0, y: 0 });
    const row = element({ x: 0, y: 10 }, group);
    const items = new Map([
      ['group', group],
      ['row', row],
    ]);
    const before = measure(items);
    mocked.layout.set(group, { x: 0, y: 100 });
    mocked.layout.set(row, { x: 0, y: 130 });
    reorder(before, items, motion, { fades: true });
    const from = new Map(named('glide').map(([el, , offset]) => [el, offset]));
    expect(from.get(group)).toEqual({ x: 0, y: -100 });
    expect(from.get(row)).toEqual({ x: 0, y: -20 });
  });

  test('fades in a new id even where a removed one was: the id says which item it is', () => {
    const kept = element({ x: 0, y: 0 });
    const gone = element({ x: 0, y: 20 });
    const before = measure(
      new Map([
        ['kept', kept],
        ['old id', gone],
      ]),
    );
    const renamed = element({ x: 0, y: 20 });
    reorder(
      before,
      new Map([
        ['kept', kept],
        ['new id', renamed],
      ]),
      motion,
      { fades: true },
    );
    expect(named('arrive')).toEqual([[renamed, motion.arrive]]);
    expect(named('leave')).toEqual([
      [[expect.objectContaining({ el: gone })], motion.leave],
    ]);
  });

  test('glides an item caught mid-flight on at the speed it had', () => {
    const row = element({ x: 0, y: 0 });
    mocked.velocity.set(row, { x: 0, y: 300 });
    const before = measure(new Map([['a', row]]));
    mocked.layout.set(row, { x: 0, y: -40 });
    reorder(before, new Map([['a', row]]), motion, { fades: false });
    expect(named('glide')).toEqual([
      [row, motion.glide, { x: 0, y: 40 }, { x: 0, y: 300 }, { lifted: false }],
    ]);
  });

  test('takes an item with no box before the change for an arrival, not a glide from the corner', () => {
    const row = element({ x: 0, y: 0 });
    mocked.hidden.add(row);
    const before = measure(new Map([['a', row]]));
    mocked.hidden.delete(row);
    mocked.layout.set(row, { x: 0, y: 200 });
    reorder(before, new Map([['a', row]]), motion, { fades: true });
    expect(named('glide')).toEqual([]);
    expect(named('arrive')).toEqual([[row, motion.arrive]]);
  });

  test('fades out an item that left where it was, and only that one', () => {
    const kept = element({ x: 0, y: 0 });
    const gone = element({ x: 0, y: 20 });
    const before = measure(
      new Map([
        ['kept', kept],
        ['gone', gone],
      ]),
    );
    reorder(before, new Map([['kept', kept]]), motion, { fades: true });
    expect(named('leave')).toEqual([
      [[expect.objectContaining({ el: gone, at: { x: 0, y: 20 } })], motion.leave],
    ]);
  });

  test('lifts an item crossing another, not the one it nudges', () => {
    const first = element({ x: 0, y: 0 });
    const second = element({ x: 0, y: 20 });
    const items = new Map([
      ['first', first],
      ['second', second],
    ]);
    const before = measure(items);
    mocked.layout.set(first, { x: 0, y: 20 });
    mocked.layout.set(second, { x: 0, y: 0 });
    reorder(before, items, motion, { fades: true });
    expect(lifted()).toEqual([first, second]);
  });

  test('without fades, still glides a moved item but lets arrivals and leavers come and go', () => {
    const moved = element({ x: 0, y: 0 });
    const gone = element({ x: 0, y: 20 });
    const before = measure(
      new Map([
        ['moved', moved],
        ['gone', gone],
      ]),
    );
    mocked.layout.set(moved, { x: 0, y: 40 });
    const added = element({ x: 0, y: 80 });
    reorder(
      before,
      new Map([
        ['moved', moved],
        ['added', added],
      ]),
      motion,
      { fades: false },
    );
    expect(named('glide')).toEqual([
      [moved, motion.glide, { x: 0, y: -40 }, { x: 0, y: 0 }, { lifted: false }],
    ]);
    expect(named('arrive')).toEqual([]);
    expect(named('leave')).toEqual([]);
  });

  test('keeps a crossing item lifted when another commit interrupts its glide', () => {
    const first = element({ x: 0, y: 0 });
    const second = element({ x: 0, y: 20 });
    const items = new Map([
      ['first', first],
      ['second', second],
    ]);
    const swapped = measure(items);
    mocked.layout.set(first, { x: 0, y: 20 });
    mocked.layout.set(second, { x: 0, y: 0 });
    reorder(swapped, items, motion, { fades: true });
    // Mid-glide, each has already passed the other: by position alone neither crosses now.
    mocked.layout.set(first, { x: 0, y: 15 });
    mocked.layout.set(second, { x: 0, y: 5 });
    const midway = measure(items);
    mocked.layout.set(first, { x: 0, y: 20 });
    mocked.layout.set(second, { x: 0, y: 0 });
    mocked.calls.length = 0;
    reorder(midway, items, motion, { fades: false });
    expect(lifted()).toEqual([first, second]);
  });
});
