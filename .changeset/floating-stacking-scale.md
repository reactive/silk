---
'@reactive/silk': patch
---

Dialog overlay and content now draw their `z-index` from the shared floating stacking scale, so page content with a modest `z-index` (sticky headers, app chrome) no longer paints over the scrim or the panel. The overlay previously had no `z-index` at all and content used a local `z-index: 1`.

Dialog sits below popovers, menus, selects, tooltips, and toasts on that scale. Those surfaces portal to the body as siblings of the dialog panel rather than descendants, so they must outrank it to remain visible when opened from inside a dialog.
