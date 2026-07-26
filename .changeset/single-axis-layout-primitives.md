---
'@reactive/silk-core': minor
'@reactive/silk': minor
---

Layout flow direction is a property of the component, never a prop: `Stack` is vertical, `Inline` is horizontal, and neither can flip its axis.

A `direction` prop would mean the same `align`/`justify` values silently swap visual axis per call site. Fixing the axis per component — rather than renaming the props — keeps the standard flexbox reading of `align` and `justify` correct everywhere.

- **`Stack` is vertical-only.** `stackRecipe.variants` is exactly `gap`, `align`, `justify`, `rail`. Reach for `Inline` for horizontal flow; it additionally carries `wrap`, `direction` (`row | row-reverse`, order rather than axis), and the web-only `collapseBelow`.
- **Choosing between them:** vertical is `Stack`, horizontal is `Inline`. Their defaults differ deliberately — `Stack` is `align="stretch"`, `Inline` is `align="center"` and `wrap="wrap"` — so set `align`/`wrap` explicitly when a row must stretch to equal heights or must not reflow.
- **Centering** is `align`/`justify` set to `"center"`. `Container` owns max-width measure centering (`margin-inline: auto` + `max-width`).
- **`Grid` has `justify`** (`start | center | end | stretch`, default `stretch`) mapped to `justify-items`, pairing with `align` → `align-items`: `columns` always emits `1fr` tracks, so there is no free space for `justify-content` to distribute. On `Stack` and `Inline`, `justify` is `justify-content`.
