---
'@reactive/silk-native': patch
---

`Slider` drags on the UI thread: the thumb follows the finger and springs to its step on release, `onValueChange` fires per step, a slide on native waits for a touch slop so a scroll view around it keeps scrolling, and a value a controlled owner turns down springs back. On Android it needs the app wrapped in Gesture Handler's `GestureHandlerRootView` (`Popover`, `Tooltip` and `Dialog` give their `Modal` one).
