---
'@reactive/silk-native': patch
---

A bottom-placed `Dialog` (a sheet) shows a drag handle at its top and closes when dragged down: let go past a third of its height or flung down, it slides off and calls `onOpenChange(false)`; otherwise it settles back. With reduced motion it closes or settles at once.
