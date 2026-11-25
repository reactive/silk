---
'@reactive/silk-native': minor
---

New `springMotion(spring)`: a one-off `Spring` as the `{ durationMs, easing }` that `useMotion` gives a theme's springs, for a Reanimated CSS transition or keyframes. For example, `const LAND = springMotion({ durationMs: 500, bounce: 0.4 })` plays a bouncier landing than the theme's springs. Prefer the theme's springs through `useMotion` where one fits. Hold the spring in a constant, since it is sampled once per object, and check `useReducedMotion` where that matters.
