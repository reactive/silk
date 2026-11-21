---
'@reactive/silk-core': minor
'@reactive/silk': minor
'@reactive/silk-native': patch
---

breaking: themes pinning the blended `hover` hex values (light accent, danger and success; neutral in both schemes) must re-derive them, because hover fills now blend in OKLab instead of sRGB (default light accent `#0f5399` → `#135297`).

Adds `oklch(l, c, h, alpha?)` (from `@reactive/silk-core`, its `/color` subpath, and `@reactive/silk`), which returns a color's sRGB form and throws a `RangeError` on input out of range. Built-in palettes are kept as OKLCH coordinates and resolve to the same hex; `generateScale` reads its curves from them, so generated scales can move by one hex step. Web `color-mix()` blends in Oklab, which shifts the indeterminate Progress bar's reduced-motion fill slightly.
