---
'@reactive/silk-core': minor
'@reactive/silk': patch
'@reactive/silk-native': patch
---

breaking: the blended `hover` fills (light accent, danger and success, and neutral in both schemes) now blend in OKLab instead of sRGB, so they shift slightly (default light accent `#0f5399` → `#135297`). Themes pinning those hex values must re-derive them.

Build colors in OKLCH. The built-in palettes are kept as OKLCH coordinates and resolve to the same hex as before; `generateScale` reads its curves from them, so generated scales can move by one hex step. Adds `oklch(l, c, h, alpha?)`, also at `@reactive/silk-core/color`, which imports nothing. It returns the color's sRGB form (`#rrggbb`, or `rgba()` with `alpha`), since React Native drops `oklch()` strings, and throws a `RangeError` on input out of range. White, the overlay scrims and the web shadow ink are written with it too and resolve to the same values.

Every `color-mix()` now blends in Oklab. Blends with `transparent` (Progress and Skeleton shimmer, Spinner track) look the same; the indeterminate Progress bar's reduced-motion fill, a blend of two colors, shifts slightly and keeps the tone's hue in tinted themes. Native shadow ink is written `black` rather than `#000`.
