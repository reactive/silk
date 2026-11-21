---
'@reactive/silk-core': minor
'@reactive/silk': patch
'@reactive/silk-native': patch
---

Write colors in OKLCH. Adds `oklch(l, c, h, alpha?)`, also at `@reactive/silk-core/color` with no imports, which returns the color's sRGB form (`#rrggbb`, or `rgba()` with `alpha`), since React Native can't parse `oklch()` strings. The built-in palettes, white and the overlay scrims are written with it and resolve to the same values as before. The web renderer writes shadow ink and its `color-mix()` blends in OKLCH; only the indeterminate Progress bar's reduced-motion fill, a blend of two colors, changes slightly.
