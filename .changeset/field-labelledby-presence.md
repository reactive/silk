---
"@reactive/silk": patch
---

Only wire `aria-labelledby` from Field context when a `Field.Label` is actually rendered, and point it at the label's own id. A `Slider` in a label-less `Field.Root` no longer gets a dangling `aria-labelledby`, so its `aria-label` names the `role="slider"` thumb again.
