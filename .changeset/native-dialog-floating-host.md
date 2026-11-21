---
'@reactive/silk-native': patch
---

On the web, a Popover, Listbox or Tooltip opened inside a Dialog now opens over it. It used to open behind the dialog, because react-native-web stacks a Modal at `z-index: 9999` over layers at the end of the page. A floating layer inside a dialog now renders inside the dialog's Modal, which also keeps it inside the dialog's focus trap.
