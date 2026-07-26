---
'@reactive/silk-core': minor
---

Stage 5 theming maturity (core): palette generation, paired dark derivation, and contrast auditing.

- Add `generateScale(seedHex, colorScheme)` — OKLCH 12-step ramps from canonical sRGB hex.
- Add `generatePairedPalette(brandHex)` — tenant recipe producing full light+dark palettes (accent + brand-tinted gray; optional danger/success seeds).
- Add `checkThemeContrast`, `contrastRatio`, `relativeLuminance`, and `parseCanonicalHex` for CI/tooling.
- Depends on `culori` for OKLCH conversion and gamut mapping (private to the generator).
