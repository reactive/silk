---
'@reactive/silk': minor
---

Rank the escape hatches and make the cascade contract explicit.

- New `@reactive/silk/styles.layer.css` entry ships the extracted stylesheet wrapped in `@layer silk`, so unlayered consumer CSS overrides Silk deterministically instead of depending on bundler stylesheet order. The unlayered `styles.css` is unchanged and still the default, since the layered build also loses to unlayered consumer resets.
- New `cssVars()` helper types the public component hooks for the `style` prop, replacing the `as CSSProperties` cast that custom properties otherwise require (and that silences misspelled variable names). `silkComponentVarNames` exports the hook list, guarded by a conformance test against the extracted CSS.
- `--silk-scrollarea-thumb` now follows the same `var(hook, fallback)` pattern as every other hook. It was previously assigned on the ScrollArea root, which shadowed consumer overrides of equal specificity.
