---
'@reactive/silk-native': minor
---

New `springMotion(spring)`: any `Spring` as the `{ durationMs, easing }` that `useMotion` gives a theme's springs, for a Reanimated CSS transition or keyframes. For example, `springMotion({ durationMs: 500, bounce: 0.4 })` plays a bouncier landing than the theme's springs. It ignores reduced motion, so check `useReducedMotion` where that matters.
