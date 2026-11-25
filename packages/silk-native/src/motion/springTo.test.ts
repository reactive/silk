import { defaultMotion, sampleSpring } from '@reactive/silk-core';
import { expect, rs, test } from '@rstest/core';

// Reanimated's native module isn't in jsdom: an animation definition is its factory's object.
rs.mock('react-native-reanimated', () => ({
  defineAnimation: (_start: number, factory: () => object) => factory(),
}));

const { speedToward, springSpeed, springTo } = await import('./springTo.js');

interface Running {
  current: number;
  velocity: number;
  reduceMotion?: boolean;
  onStart(animation: Running, value: number, now: number, previous?: object): void;
  onFrame(animation: Running, now: number): boolean;
}

const { snappy, smooth } = defaultMotion;
const run = (animation: unknown) => animation as Running;

/** Starts `animation` from `from` at time 0 and returns it. */
function start(animation: Running, from: number, previous?: object): Running {
  animation.onStart(animation, from, 0, previous);
  return animation;
}

test("speedAway 'drop' starts from rest on a speed away from the target, given or carried, and keeps one toward it", () => {
  const drop = { reduceMotion: false, speedAway: 'drop' } as const;
  expect(start(run(springTo(0, snappy, { ...drop, velocity: 2000 })), 100).velocity).toBe(0);
  expect(start(run(springTo(0, snappy, drop)), 100, { velocity: 900 }).velocity).toBe(0);
  expect(start(run(springTo(0, snappy, { ...drop, velocity: -2000 })), 100).velocity).toBe(-2000);
  expect(start(run(springTo(0, snappy, drop)), 100, { velocity: -900 }).velocity).toBe(-900);
});

test("clamped with speedAway 'drop', it stays between where it starts and the target", () => {
  const animation = start(
    run(springTo(100, snappy, { reduceMotion: false, speedAway: 'drop', overshootClamping: true })),
    95,
    { velocity: -3000 },
  );
  let low = 95;
  let high = 95;
  for (let ms = 0, done = false; ms <= 1000 && !done; ms += 4) {
    done = animation.onFrame(animation, ms);
    low = Math.min(low, animation.current);
    high = Math.max(high, animation.current);
  }
  expect([low, high]).toEqual([95, 100]);
});

test('a release speed away from the target carries it further before it turns', () => {
  const animation = start(run(springTo(0, smooth, { reduceMotion: false, velocity: 2000 })), 100);
  animation.onFrame(animation, 16);
  expect(animation.current).toBeGreaterThan(100);
});

test('it starts at the speed of the animation it replaces', () => {
  const first = start(run(springTo(0, smooth, { reduceMotion: false, velocity: -800 })), 100);
  first.onFrame(first, 50);
  const second = start(run(springTo(300, smooth, { reduceMotion: false })), first.current, first);
  expect(second.velocity).toBe(first.velocity);
  expect(second.velocity).toBeLessThan(0);
});

test('clamped, it stops at the target instead of passing it', () => {
  const animation = start(run(springTo(0, snappy, { reduceMotion: false, overshootClamping: true })), 100);
  let done = false;
  for (let now = 0; !done && now < 2000; now += 16) {
    done = animation.onFrame(animation, now);
    expect(animation.current).toBeGreaterThanOrEqual(0);
  }
  expect(done).toBe(true);
  expect(animation.current).toBe(0);
});

test('from rest it plays the same curve the web plays', () => {
  const { progress } = sampleSpring(snappy);
  const animation = start(run(springTo(1000, snappy, { reduceMotion: false, precision: 1e-6 })), 0);
  for (const frame of [5, 10, 20]) {
    animation.onFrame(animation, (frame / 60) * 1000);
    expect(animation.current / 1000).toBeCloseTo(progress[frame]!, 3);
  }
});

test('it passes reduced motion on to Reanimated', () => {
  expect(run(springTo(0, smooth, { reduceMotion: true })).reduceMotion).toBe(true);
  expect(run(springTo(0, smooth, { reduceMotion: false })).reduceMotion).toBe(false);
});

test('a clamped spring on its target keeps a speed away from it, then stops on its way back', () => {
  const fling = { reduceMotion: false, velocity: -2000, overshootClamping: true };
  const onTarget = start(run(springTo(0, smooth, fling)), 0);
  const nearTarget = start(run(springTo(0, smooth, fling)), -1e-9);
  onTarget.onFrame(onTarget, 16);
  nearTarget.onFrame(nearTarget, 16);
  expect(onTarget.current).toBeLessThan(-10);
  expect(onTarget.current).toBeCloseTo(nearTarget.current, 6);
  let done = false;
  for (let now = 32; !done && now < 2000; now += 16) {
    done = onTarget.onFrame(onTarget, now);
    expect(onTarget.current).toBeLessThanOrEqual(0);
  }
  expect(done).toBe(true);
});

test('a running spring’s speed is read from the value it animates', () => {
  expect(springSpeed({ value: 0.4, _animation: { velocity: 3 } } as { value: number })).toBe(3);
  expect(springSpeed({ value: 1, _animation: null } as { value: number })).toBeUndefined();
  expect(springSpeed({ value: 1 })).toBeUndefined();
});

test('settling, a part keeps a speed only when it heads to its target', () => {
  expect(speedToward(1, 0.6, 2)).toBe(2);
  // Moving away from its target, short of it or past it: it comes back from rest.
  expect(speedToward(0, 0.3, 0.5)).toBe(0);
  expect(speedToward(0, -0.1, -4)).toBe(0);
});
