import { expect, test } from '@rstest/core';
import { defaultMotion } from '../tokens/scales.js';
import { sampleSpring, sampleSpringOffsets, springAt, springAtRest } from './spring.js';

const { snappy, brisk, smooth } = defaultMotion;

test('springAt starts where it was told, at the speed it was told', () => {
  const { offset, velocity } = springAt(snappy, { offset: 10, velocity: 3 }, 0);
  expect(offset).toBe(10);
  expect(velocity).toBeCloseTo(3);
});

test('springAt matches stepping the stiffness and damping form', () => {
  // m·x'' = -k·x - c·x', k = ω², c = 2ζω, ω = 2π / duration
  for (const spring of [snappy, brisk, smooth]) {
    const omega = (2 * Math.PI * 1000) / spring.durationMs;
    const k = omega * omega;
    const c = 2 * (1 - spring.bounce) * omega;
    let x = 100;
    let v = -50;
    const dt = 1 / 20000;
    for (let i = 0; i < 0.2 / dt; i++) {
      v += (-k * x - c * v) * dt;
      x += v * dt;
    }
    expect(springAt(spring, { offset: 100, velocity: -50 }, 0.2).offset).toBeCloseTo(x, 1);
  }
});

test('every spring comes to rest at its target', () => {
  for (const spring of [snappy, brisk, smooth])
    expect(
      springAtRest(springAt(spring, { offset: 100, velocity: 0 }, (spring.durationMs / 1000) * 4), 0.25),
    ).toBe(true);
});

test('springAt keeps momentum that points away from the target', () => {
  // Moving away at first, as a fling reversed mid-flight does.
  expect(springAt(brisk, { offset: 10, velocity: 500 }, 1 / 60).offset).toBeGreaterThan(10);
});

test('sampleSpring runs from 0 to exactly 1 at 60 fps', () => {
  const { settleMs, progress } = sampleSpring(smooth);
  expect(progress[0]).toBe(0);
  expect(progress.at(-1)).toBe(1);
  expect(settleMs).toBe(Math.round(((progress.length - 1) / 60) * 1000));
  // Settling takes longer than the time to (visually) arrive.
  expect(settleMs).toBeGreaterThan(smooth.durationMs);
});

test('only a spring with bounce overshoots its target', () => {
  expect(Math.max(...sampleSpring(smooth).progress)).toBe(1);
  expect(Math.max(...sampleSpring(snappy).progress)).toBeGreaterThan(1);
});

test('sampleSpringOffsets runs from the start to exactly 0, keeping the start speed', () => {
  const start = { offset: -40, velocity: -900 };
  const { settleMs, offsets } = sampleSpringOffsets(brisk, start, 0.25);
  expect(offsets[0]).toBe(-40);
  expect(offsets.at(-1)).toBe(0);
  // Moving away from the target at first, as the speed it starts at says.
  expect(offsets[1]).toBeLessThan(-40);
  expect(settleMs).toBe(Math.round(((offsets.length - 1) / 60) * 1000));
});

test('sampleSpringOffsets stops sooner for a coarser precision', () => {
  const start = { offset: 100, velocity: 0 };
  expect(sampleSpringOffsets(smooth, start, 1).offsets.length).toBeLessThan(
    sampleSpringOffsets(smooth, start, 0.01).offsets.length,
  );
});

test('sampleSpringOffsets lands at once on a spring or start it cannot play', () => {
  const start = { offset: 40, velocity: 0 };
  const endless = { ...brisk, durationMs: Number.POSITIVE_INFINITY };
  expect(sampleSpringOffsets(endless, start, 0.25)).toEqual({ settleMs: 0, offsets: [40, 0] });
  const lost = { offset: Number.NaN, velocity: 0 };
  expect(sampleSpringOffsets(brisk, lost, 0.25)).toEqual({ settleMs: 0, offsets: [0, 0] });
  expect(sampleSpringOffsets(brisk, start, 0).offsets).toEqual([40, 0]);
});
