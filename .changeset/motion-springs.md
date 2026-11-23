---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': minor
---

Springs join the `motion` tokens: `snappy`, `brisk` and `smooth` are `Spring`s (`durationMs`, `bounce`) for position and size, beside the `fast`/`normal`/`slow` fades. The web gets `--silk-motion-{snappy|brisk|smooth}-duration-ms` and `-easing`; silk-native adds `springTo` (a spring that keeps a release speed) and `useMotion` (a token as a Reanimated transition), and the bottom sheet springs on `motion.smooth`.

**Breaking:** a full `motion` literal now needs `snappy`, `brisk` and `smooth` (e.g. `snappy: { durationMs: 250, bounce: 0.15 }`), and a loop over `motionNames` that reads `.easing` must check `isSpringName(name)` first.
