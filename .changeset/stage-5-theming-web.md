---
'@reactive/silk': minor
---

Stage 5 theming maturity (web): portal variable channels and re-exports.

- Split theme-scope CSS vars into `semanticVars` (replaced by nested `theme`/`colorScheme`) and `customVars` (component hooks that inherit through named children into portals).
- Re-export `generateScale`, `generatePairedPalette`, `checkThemeContrast`, and related types from `@reactive/silk`.
- Document the frozen public component CSS-variable list via `silkComponentVarMeta` / `formatComponentVarDocsTable`.
