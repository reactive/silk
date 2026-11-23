---
'@reactive/silk-native': patch
---

Natively, a `Tooltip.Trigger` inside a line of text is now a span of that text, so it stays on the line, and a tap opens the tooltip beside the line where it landed. A floating layer (`Tooltip`, `Popover`) opened inside text no longer pushes the words around or stops later taps, and a tap outside a floating layer only closes it: the views under it don't see it.
