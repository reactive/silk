---
"@reactive/silk": patch
---

`Slider` inside a single-mode `Field.Root` no longer gets a dangling or non-functional Label `htmlFor`. Field detects labelledby-marked controls (`fieldLabelAssociation`), omits automatic `htmlFor` / control `id`, and keeps naming on the thumb via `aria-labelledby`. Explicit `id` / `htmlFor` still win.

`Field.Root required` still shows the label indicator for Slider fields; `required` / `aria-required` are not forwarded onto the thumb because range / `role="slider"` always has a value and does not support those attributes.
