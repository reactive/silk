---
"@reactive/silk": patch
---

Name multi-thumb `Slider` thumbs when `thumbLabels` is omitted: fall back to Field label or an indexed root `aria-label`, and wire `aria-describedby` on every thumb. Explicit `thumbLabels` clear Field `aria-labelledby` so they win in accessible name computation.
