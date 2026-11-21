---
'@reactive/silk-core': minor
'@reactive/silk': patch
'@reactive/silk-native': patch
---

Write colors in OKLCH. Adds `oklch(l, c, h, alpha?)`, also at `@reactive/silk-core/color`, which imports nothing. It returns the color's sRGB form (`#rrggbb`, or `rgba()` with `alpha`), since React Native drops `oklch()` strings. The built-in palettes, white and the overlay scrims are written with it and resolve to the same values as before.

The web renderer writes its shadow ink as `oklch(0 0 0 / a)`, and every `color-mix()` blends in OKLCH. Blends with `transparent` (Progress and Skeleton shimmer, Spinner track) look the same; the indeterminate Progress bar's reduced-motion fill, a blend of two colors, shifts slightly. Native shadow ink is written `black` rather than `#000`.
