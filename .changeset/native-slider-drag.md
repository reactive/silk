---
'@reactive/silk-native': minor
---

**Breaking:** wrap the app in Gesture Handler's `GestureHandlerRootView`, or `Slider` won't drag on Android.

`Slider` drags on the UI thread: the thumb follows the finger between steps and springs to its step on release (`motion.snappy`), and `onValueChange` fires only as a step changes. On native a slide starts once the finger moves a touch slop along the slider, so a scroll view around it keeps scrolling, and a tap moves the nearest thumb there. `Popover`, `Tooltip` and every `Dialog` now give Android gestures a root inside their `Modal`, so a `Slider` there drags.
