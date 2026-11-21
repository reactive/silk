---
'@reactive/silk-native': patch
---

On the web, a Popover, Listbox or Tooltip opened inside a Dialog now opens over it, inside the dialog's Modal and its focus trap, instead of behind it. Pressing Escape with one open closes only that layer, not the dialog too.
