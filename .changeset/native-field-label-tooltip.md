---
'@reactive/silk-native': patch
---

On the web, a `Text` with `onPress` takes the press, as it does on iOS and Android, so a `Tooltip.Trigger` around it no longer opens too. For example, a press on an enabled `Field.Label` inside a `Tooltip.Trigger` now only toggles its control; it used to open the tooltip as well.
