---
'@reactive/silk-core': minor
'@reactive/silk': patch
'@reactive/silk-native': patch
---

Write colors in OKLCH. Adds `oklch(l, c, h, alpha?)`, also at `@reactive/silk-core/color`, which imports nothing. It returns the color's sRGB form (`#rrggbb`, or `rgba()` with `alpha`), since React Native drops `oklch()` strings, and throws a `RangeError` on input out of range. The built-in palettes, white, the overlay scrims and the web shadow ink are written with it and resolve to the same values as before. Deriving light and dark schemes in OKLCH is later work.

Every `color-mix()` now blends in Oklab. Blends with `transparent` (Progress and Skeleton shimmer, Spinner track) look the same; the indeterminate Progress bar's reduced-motion fill, a blend of two colors, shifts slightly and keeps the tone's hue in tinted themes. Native shadow ink is written `black` rather than `#000`.
