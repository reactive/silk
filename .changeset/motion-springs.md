---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': minor
---

Springs join the `motion` tokens. `motion.snappy`, `brisk` and `smooth` are `Spring`s (`durationMs`, `bounce`) for anything that changes position or size; `fast`, `normal` and `slow` stay durations for fades, and `loop` for indeterminate cycles. `createTheme` refuses springs that change meaning: out of range, out of order, or a bouncing `smooth`. silk-core adds the spring math (`springAt`, `springAtRest`, `sampleSpring`). The web gets `--silk-motion-{snappy|brisk|smooth}-duration-ms` and `-easing` (a `linear()` curve).

silk-native adds `springTo`, a Reanimated animation on a spring token that keeps a release speed pointing away from its target, and `useMotion`, a token as a duration and easing for Reanimated's CSS transitions. It also adds `gestureThresholds` and `releaseVelocity`, Android's gesture conventions. The bottom sheet now springs on `motion.smooth`.

**Breaking:** `MotionName` widens, so motion object literals need the three springs. Code that iterates `motionNames` must branch on `isSpringName`.
