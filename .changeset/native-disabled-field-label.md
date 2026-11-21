---
'@reactive/silk-native': patch
---

A `Field.Label` in a disabled `Field` no longer takes presses, including its own `onPress`. On Android and iOS it used to take the touch anyway, so a `Tooltip.Trigger` around a disabled field never saw a tap on the label.
