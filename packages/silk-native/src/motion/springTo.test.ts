import { defaultMotion, sampleSpring } from '@reactive/silk-core';
import { expect, rs, test } from '@rstest/core';

// Reanimated's native module isn't in jsdom: an animation definition is its factory's object.
rs.mock('react-native-reanimated', () => ({
  defineAnimation: (_start: number, factory: () => object) => factory(),
}));

const { springTo } = await import('./springTo.js');

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

test('a release speed away from the target carries it further before it turns', () => {
  const animation = start(run(springTo(0, smooth, { velocity: 2000 })), 100);
  animation.onFrame(animation, 16);
  expect(animation.current).toBeGreaterThan(100);
});

test('it starts at the speed of the animation it replaces', () => {
  const first = start(run(springTo(0, smooth, { velocity: -800 })), 100);
  first.onFrame(first, 50);
  const second = start(run(springTo(300, smooth)), first.current, first);
  expect(second.velocity).toBe(first.velocity);
  expect(second.velocity).toBeLessThan(0);
});

test('clamped, it stops at the target instead of passing it', () => {
  const animation = start(run(springTo(0, snappy, { overshootClamping: true })), 100);
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
  const animation = start(run(springTo(1000, snappy, { precision: 1e-6 })), 0);
  for (const frame of [5, 10, 20]) {
    animation.onFrame(animation, (frame / 60) * 1000);
    expect(animation.current / 1000).toBeCloseTo(progress[frame]!, 3);
  }
});

test('it passes reduced motion on to Reanimated, and leaves it to the system by default', () => {
  expect(run(springTo(0, smooth, { reduceMotion: true })).reduceMotion).toBe(true);
  expect(run(springTo(0, smooth)).reduceMotion).toBeUndefined();
});

test('a clamped spring on its target keeps a speed away from it, then stops on its way back', () => {
  const fling = { velocity: -2000, overshootClamping: true };
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
