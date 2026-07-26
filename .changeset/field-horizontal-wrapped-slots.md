---
"@reactive/silk": patch
---

Keep `Field.Root orientation="horizontal"` correct when slots sit inside a layout wrapper. The grid pinned only direct `Field.Label` / `Description` / `Error` children to column 2, so a `Stack` or `Inline` around the description auto-placed into the control column — even though Field already treats those wrappers as transparent when wiring `aria-describedby`. Wrappers holding a slot are now pinned too, and the label owns row 1 so the control stays beside it regardless of child order.
