import { expect, test } from '@rstest/core';
import { makeMutable } from 'react-native-reanimated';
// Not public: the layout animation manager plays each item's animations through it.
import { withStyleAnimation } from 'react-native-reanimated/lib/module/animation/styleAnimation';
import { springTo } from '../../motion/springTo.js';

const spring = { durationMs: 300, bounce: 0.1 };

/**
 * The native engine keeps a row's speed through an interrupted glide only
 * because Reanimated's layout animation manager writes each new layout
 * animation onto the view's mutable as a style animation, which hands every
 * property's running animation to its replacement's `onStart`
 * (packages/silk-native/AGENTS.md). This plays that path: if a Reanimated
 * upgrade drops the handoff, a reversed glide would start from rest.
 */
test("an interrupting layout animation's springTo starts at the speed of the one it replaces", () => {
  const view = makeMutable<Record<string, number>>({ originY: 0 });
  view.value = withStyleAnimation({
    originY: springTo(100, spring, { reduceMotion: false, velocity: 300 }),
  });
  // As the manager does: new initial values, then the new animation.
  view.value = withStyleAnimation({ originY: springTo(-50, spring, { reduceMotion: false }) });
  const running = (view as unknown as {
    _animation: { styleAnimations: { originY: { velocity: number } } };
  })._animation;
  expect(running.styleAnimations.originY.velocity).toBe(300);
});
